# Measure peak working set for a moonlm CLI invocation on Windows.
#
# Getting a trustworthy number here took two attempts, and both wrong approaches
# are worth knowing about:
#
#   * Sampling `tasklist` in a loop raced with the process phases: the same
#     workload reported 145 MB and 524 MB on two runs.
#   * Reading `PeakWorkingSet64` after the process exits returns 0, because the
#     handle is gone by then.
#
# What works is polling `PeakWorkingSet64` while the process is alive and keeping
# the maximum. The OS maintains that counter, so no sample is missed even for a
# short phase; this loop only decides when to stop looking.
#
# Usage:
#   powershell -NoProfile -File tools/measure_mem.ps1 -Model <model.gguf> [-Exe <cli.exe>]

param(
  [Parameter(Mandatory = $true)][string]$Model,
  [string]$Exe = "_build\native\release\build\cli\cli.exe"
)

$exePath = (Resolve-Path $Exe).Path
$modelPath = (Resolve-Path $Model).Path

function Measure-Peak {
  param([string[]]$Arguments, [string]$Label)
  $argString = ($Arguments | ForEach-Object {
    if ($_ -match '\s') { '"' + $_ + '"' } else { $_ }
  }) -join ' '
  $p = Start-Process -FilePath $exePath -ArgumentList $argString -NoNewWindow -PassThru
  # Poll while the process is alive, and only ever keep the maximum. Reading the
  # property after exit returns 0 because the handle is released, which is why
  # this samples during the run instead — but it takes the max over the whole
  # run rather than one snapshot, so a short phase cannot be missed.
  $peak = 0
  while (-not $p.HasExited) {
    try {
      $p.Refresh()
      if ($p.PeakWorkingSet64 -gt $peak) { $peak = $p.PeakWorkingSet64 }
    } catch {
      break
    }
    Start-Sleep -Milliseconds 20
  }
  $p.WaitForExit()
  $mb = [math]::Round($peak / 1MB, 1)
  Write-Host ("  {0,-46} {1,7} MB" -f $Label, $mb)
  return $mb
}

Write-Host "Peak working set (OS counter), model = $(Split-Path $modelPath -Leaf)`n"

$parseOnly = Measure-Peak @("inspect", $modelPath) "inspect (parse only, no Model)"

$loadOnly = Measure-Peak @("generate", $modelPath, "hi", "--max-tokens", "1",
                           "--temperature", "0", "--raw") "generate 1 token (Model + KV allocated)"

# The KV cache is preallocated to the model's full context, so decoding more
# tokens must not raise the peak; this checks that claim.
Measure-Peak @("generate", $modelPath, "The capital of France is", "--max-tokens", "64",
               "--temperature", "0", "--raw") "generate 64 tokens" | Out-Null

Write-Host ""
Write-Host ("  model bytes on disk:                  {0,7} MB" -f
  [math]::Round((Get-Item $modelPath).Length / 1MB, 1))
Write-Host ("  parse-only overhead:                  {0,7} MB" -f $parseOnly)
Write-Host ("  weights + KV after load:              {0,7} MB" -f $loadOnly)
