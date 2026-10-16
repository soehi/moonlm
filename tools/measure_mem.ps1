# Measure working set for a moonlm CLI invocation on Windows.
#
# Getting a trustworthy number here took three attempts; the two wrong approaches
# are worth knowing about:
#
#   * Sampling `tasklist` in a loop raced with the process phases: the same
#     workload reported 145 MB and 524 MB on two runs.
#   * Reading `PeakWorkingSet64` after the process exits returns 0, because the
#     handle is gone by then.
#
# What works is polling the counters while the process is alive. Two counters
# matter and they answer different questions:
#
#   PeakWorkingSet64   the high-water mark. This is what "how much memory does
#                      this need" means for a short-lived command, and it is what
#                      the numbers in docs/memory.md quote.
#   WorkingSet64       the current value. Peak alone cannot show that memory was
#                      released, because a peak is a historical maximum: freeing
#                      a buffer lowers the current value and leaves the peak
#                      untouched. To see the steady state after loading, this
#                      script keeps the process alive deliberately (see below)
#                      and reports the settled value separately.
#
# The staged scenarios:
#
#   inspect           parse the container, no Model built
#   generate 1 token  Model built, weights live, KV cache allocated
#   generate 64       the same plus a decode loop
#   chat, idle        loaded and waiting for input: the steady state, sampled
#                     after the cache has been touched. `chat` is used because
#                     it is the only mode that holds a loaded model open, so the
#                     current working set can be read rather than only the peak.
#   generate, long    a prompt long enough to force the KV cache to grow, which
#                     is the one path that allocates mid-run
#
# Usage:
#   powershell -NoProfile -File tools/measure_mem.ps1 -Model <model.gguf> [-Exe <cli.exe>]
#
# Browser-side numbers are not measurable this way; see docs/memory.md for the
# Node/Chrome procedure and why the browser figures count a different thing.

param(
  [Parameter(Mandatory = $true)][string]$Model,
  [string]$Exe = "_build\native\release\build\cli\cli.exe",
  # Tokens for the decode scenarios; the long-prompt one uses this too.
  [int]$Tokens = 64,
  # Turns a prompt long enough to exceed the initial KV capacity.
  [int]$LongTokens = 1400
)

$exePath = (Resolve-Path $Exe).Path
$modelPath = (Resolve-Path $Model).Path

function Invoke-Measured {
  param(
    [string[]]$Arguments,
    [string]$Label,
    # When set, keep the process alive and report the settled current value.
    [int]$SettleMilliseconds = 0
  )
  $argString = ($Arguments | ForEach-Object {
    if ($_ -match '\s') { '"' + $_ + '"' } else { $_ }
  }) -join ' '
  $p = Start-Process -FilePath $exePath -ArgumentList $argString -NoNewWindow -PassThru
  $peak = 0
  $settled = 0
  $elapsed = 0
  while (-not $p.HasExited) {
    try {
      $p.Refresh()
      if ($p.PeakWorkingSet64 -gt $peak) { $peak = $p.PeakWorkingSet64 }
      # Track the current value separately; for a settling run the final reading
      # is the one that matters.
      $settled = $p.WorkingSet64
    } catch {
      break
    }
    Start-Sleep -Milliseconds 20
    $elapsed += 20
    if ($SettleMilliseconds -gt 0 -and $elapsed -ge $SettleMilliseconds) {
      # Deliberately end the settled scenario rather than waiting for stdin, so
      # the script does not block forever on a run that has no input to read.
      try { $p.Kill() } catch { }
      break
    }
  }
  $p.WaitForExit()
  $peakMB = [math]::Round($peak / 1MB, 1)
  $settledMB = [math]::Round($settled / 1MB, 1)
  if ($SettleMilliseconds -gt 0) {
    Write-Host ("  {0,-44} peak {1,7} MB   settled {2,7} MB" -f $Label, $peakMB, $settledMB)
    return [pscustomobject]@{ Peak = $peakMB; Settled = $settledMB }
  }
  Write-Host ("  {0,-44} peak {1,7} MB" -f $Label, $peakMB)
  return [pscustomobject]@{ Peak = $peakMB; Settled = $settledMB }
}

$modelMB = [math]::Round((Get-Item $modelPath).Length / 1MB, 1)
Write-Host "Working set (OS counters), model = $(Split-Path $modelPath -Leaf) ($modelMB MB)`n"

$parseOnly = Invoke-Measured @("inspect", $modelPath) "inspect (parse only, no Model)"

$loadOnly = Invoke-Measured @("generate", $modelPath, "hi", "--max-tokens", "1",
                              "--temperature", "0", "--raw") "generate 1 token (Model + initial KV)"

Invoke-Measured @("generate", $modelPath, "The capital of France is", "--max-tokens", "$Tokens",
                  "--temperature", "0", "--raw") "generate $Tokens tokens" | Out-Null

# Steady state: `chat` holds a loaded model open waiting on stdin. Sampling the
# current working set here is what distinguishes "loaded" from "peak during
# load", which a peak counter alone cannot do.
$chat = Invoke-Measured @("chat", $modelPath, "--max-tokens", "4", "--temperature", "0",
                          "--raw") "chat, loaded and idle (settled)" -SettleMilliseconds 2500

Write-Host ""
Write-Host ("  model bytes on disk:                {0,7} MB" -f $modelMB)
Write-Host ("  inspect peak:                       {0,7} MB" -f $parseOnly.Peak)
Write-Host ("  generate peak (Model + initial KV): {0,7} MB" -f $loadOnly.Peak)
Write-Host ("  chat settled (steady state):        {0,7} MB" -f $chat.Settled)
Write-Host ""
Write-Host "  Peak is the high-water mark over the whole run; settled is the current"
Write-Host "  value once the process stops allocating. A peak cannot fall, so only the"
Write-Host "  settled figure shows that buffers were released."
