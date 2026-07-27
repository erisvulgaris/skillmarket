$ErrorActionPreference = "Stop"

Write-Host "Generating Prisma client..." -ForegroundColor Cyan
pnpm db:generate
if ($LASTEXITCODE -ne 0) { throw "Prisma generate failed" }

Write-Host "Building Next.js..." -ForegroundColor Cyan
pnpm build
if ($LASTEXITCODE -ne 0) { throw "Next.js build failed" }

Write-Host "Build complete" -ForegroundColor Green
