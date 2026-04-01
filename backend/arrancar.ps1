$ErrorActionPreference = "Stop"

$backendPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$workspacePath = Split-Path -Parent $backendPath
$frontendPath = Join-Path $workspacePath "norte-gaming"

if (-not (Test-Path $frontendPath)) {
  Write-Error "No se encontro el frontend en: $frontendPath"
}

if (-not (Test-Path $backendPath)) {
  Write-Error "No se encontro el backend en: $backendPath"
}

Start-Process powershell -ArgumentList @(
  '-NoExit',
  '-ExecutionPolicy',
  'Bypass',
  '-Command',
  "Set-Location '$frontendPath'; npm.cmd run dev"
)

Start-Process powershell -ArgumentList @(
  '-NoExit',
  '-ExecutionPolicy',
  'Bypass',
  '-Command',
  "Set-Location '$backendPath'; npm.cmd run start:dev"
)

Write-Host "Frontend y backend iniciados en ventanas separadas." -ForegroundColor Green