param(
  [int]$Port = 3001
)

$ErrorActionPreference = "Stop"
$env:NODE_ENV = "production"
$env:PORT = $Port

Write-Host "Starting production server on :$Port..." -ForegroundColor Cyan

$process = Start-Process -FilePath "pnpm" -ArgumentList "start" -NoNewWindow -PassThru

Write-Host "Production server running at http://localhost:$Port" -ForegroundColor Green

$process | Wait-Process
