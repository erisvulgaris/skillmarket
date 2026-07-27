param(
  [int]$Port = 3000
)

$env:NODE_ENV = "development"

Write-Host "Starting dev server on :$Port..." -ForegroundColor Cyan

$process = Start-Process -FilePath "pnpm" -ArgumentList "dev" -NoNewWindow -PassThru

$url = "http://localhost:$Port"
$ready = $false
$maxRetries = 30
$retryCount = 0

while (-not $ready -and $retryCount -lt $maxRetries) {
  Start-Sleep -Milliseconds 1000
  try {
    $response = Invoke-WebRequest -Uri $url -TimeoutSec 2 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
      $ready = $true
    }
  } catch {
    $retryCount++
  }
}

if ($ready) {
  Write-Host "Dev server running at $url" -ForegroundColor Green
} else {
  Write-Host "Dev server started but not yet reachable at $url" -ForegroundColor Yellow
}

$process | Wait-Process
