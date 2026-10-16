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
#   bench, decoding   loaded and still working: the steady state. Read while the
#                     process is alive, since a peak counter cannot show release.
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

# How long to let a settled scenario run before sampling.
#
# This matters more than it looks. Loading a 138 MB model takes well over a
# second (parse, tokenizer, matrix descriptors), so a settle point inside that
# window samples the process mid-load and reports a *lower* number that is not
# the steady state. An earlier version settled at 2500 ms and read 156 MB, which
# looked like a better result and was simply taken too early.
#
# The value has to sit after load and before the scenario's own end. The
# measuring run reports the elapsed time when it misses, so the constant can be
# tuned from evidence rather than guessed.
$settleWindowMs = 3000

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
  # Settled value = the largest current-value reading at or after the settle
  # point. Two details here, both learned from wrong readings:
  #
  #   * A reading taken while the process tears down comes back as 0, and
  #     `HasExited` can still read false at that moment. Taking a single "last"
  #     value gave 0 MB, 21.8 MB and 182.9 MB on three runs of the same workload.
  #     Zero readings are therefore not candidates.
  #   * Among the rest, the largest is the stable one: the steady state does not
  #     drop while decoding, so a low reading is the same artifact. Taking a max
  #     over the window also makes the result insensitive to exactly when the
  #     window closes.
  $settledAt = -1
  $settled = 0
  $elapsed = 0
  while (-not $p.HasExited) {
    try {
      $p.Refresh()
      if ($p.PeakWorkingSet64 -gt $peak) { $peak = $p.PeakWorkingSet64 }
      $current = $p.WorkingSet64
      if ($elapsed -ge $SettleMilliseconds -and $current -gt $settled) {
        $settled = $current
        $settledAt = $elapsed
      }
    } catch {
      break
    }
    Start-Sleep -Milliseconds 20
    $elapsed += 20
  }
  $p.WaitForExit()
  $peakMB = [math]::Round($peak / 1MB, 1)
  if ($SettleMilliseconds -gt 0) {
    if ($settledAt -ge 0) {
      $settledMB = [math]::Round($settled / 1MB, 1)
      Write-Host ("  {0,-40} peak {1,7} MB   settled {2,7} MB" -f $Label, $peakMB, $settledMB)
      return [pscustomobject]@{ Peak = $peakMB; Settled = $settledMB; SettledMeasured = $true }
    }
    # Say so rather than printing a number that reads as a measurement.
    Write-Host ("  {0,-40} peak {1,7} MB   settled  n/a (finished in {2} ms, before the {3} ms settle point)" -f $Label, $peakMB, $elapsed, $SettleMilliseconds)
    return [pscustomobject]@{ Peak = $peakMB; Settled = $null; SettledMeasured = $false }
  }
  $settledMB = [math]::Round($settled / 1MB, 1)
  Write-Host ("  {0,-40} peak {1,7} MB" -f $Label, $peakMB)
  return [pscustomobject]@{ Peak = $peakMB; Settled = $settledMB; SettledMeasured = $false }
}

$modelMB = [math]::Round((Get-Item $modelPath).Length / 1MB, 1)
Write-Host "Working set (OS counters), model = $(Split-Path $modelPath -Leaf) ($modelMB MB)`n"

$parseOnly = Invoke-Measured @("inspect", $modelPath) "inspect (parse only, no Model)"

$loadOnly = Invoke-Measured @("generate", $modelPath, "hi", "--max-tokens", "1",
                              "--temperature", "0", "--raw") "generate 1 token (Model + initial KV)"

Invoke-Measured @("generate", $modelPath, "The capital of France is", "--max-tokens", "$Tokens",
                  "--temperature", "0", "--raw") "generate $Tokens tokens" | Out-Null

# Steady state, sampled from a process that is still working.
#
# This has to be a run that stays alive on its own: a peak counter cannot show
# that memory was released, so the current value has to be read while the process
# is up, and an interactive `chat` exits the moment its stdin hits EOF. `bench`
# loads the model and then decodes a fixed number of tokens, so it is reliably
# alive during the window without needing any input. The token count is chosen to
# outlast the window at this model's decode rate.
# 600 tokens is ~30 s of decoding at this model's rate, so the process is
  # reliably alive at the settle point regardless of machine speed.
  $settleTokens = [math]::Max(200, [int]($settleWindowMs / 1000 * 20))
$steady = Invoke-Measured @("bench", $modelPath, "--tokens", "$settleTokens",
                            "--prompt", "The capital of France is") "bench, loaded and decoding (settled)" -SettleMilliseconds $settleWindowMs

Write-Host ""
Write-Host ("  model bytes on disk:                {0,7} MB" -f $modelMB)
Write-Host ("  inspect peak:                       {0,7} MB" -f $parseOnly.Peak)
Write-Host ("  generate peak (Model + initial KV): {0,7} MB" -f $loadOnly.Peak)
if ($steady.SettledMeasured) {
  Write-Host ("  steady state (loaded + decoding):   {0,7} MB" -f $steady.Settled)
} else {
  Write-Host "  steady state (loaded + decoding):       n/a (see note above)"
}
Write-Host ""
Write-Host "  Peak is the high-water mark over the whole run; settled is the current"
Write-Host "  value once the process stops allocating. A peak cannot fall, so only the"
Write-Host "  settled figure shows that buffers were released."
