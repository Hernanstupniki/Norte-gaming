$ErrorActionPreference = "Stop"

$backendPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$workspacePath = Split-Path -Parent $backendPath
$frontendPath = Join-Path $workspacePath "frontend"

if (-not (Test-Path $frontendPath)) {
  Write-Error "No se encontro el frontend en: $frontendPath"
}

if (-not (Test-Path $backendPath)) {
  Write-Error "No se encontro el backend en: $backendPath"
}

# Backend NestJS en puerto 3000
Start-Process powershell -ArgumentList @(
  '-NoExit',
  '-ExecutionPolicy',
  'Bypass',
  '-Command',
  "Set-Location '$backendPath'; npm.cmd run start:dev"
)

# Frontend Next.js en puerto 3001
Start-Process powershell -ArgumentList @(
  '-NoExit',
  '-ExecutionPolicy',
  'Bypass',
  '-Command',
  "Set-Location '$frontendPath'; npm.cmd run dev"
)

Write-Host ""
Write-Host "=== Norte Gaming - Entorno local ===" -ForegroundColor Cyan
Write-Host "Backend  -> http://localhost:3000/api" -ForegroundColor Green
Write-Host "Frontend -> http://localhost:3001" -ForegroundColor Green
Write-Host "Swagger  -> http://localhost:3000/docs" -ForegroundColor Yellow
Write-Host ""
Write-Host "Para recibir webhooks de Mercado Pago necesitas exponer el backend." -ForegroundColor Magenta
Write-Host "Opcion A (localtunnel):  npx localtunnel --port 3000" -ForegroundColor White
Write-Host "Opcion B (ngrok):        ngrok http 3000" -ForegroundColor White
Write-Host "Luego actualizá BACKEND_URL en backend\.env con la URL publica." -ForegroundColor White
