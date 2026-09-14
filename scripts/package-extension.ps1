# Package HoverTV Browser Extension for Distribution
param (
    [string]$OutputDir = "$PSScriptRoot\..\extension"
)

Write-Host "Packaging HoverTV Browser Extension..." -ForegroundColor Cyan

$extDir = (Resolve-Path "$PSScriptRoot\..\extension").Path
$manifestPath = Join-Path $extDir "manifest.json"
$manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
$version = $manifest.version

Write-Host "Building production extension bundle (v$version)..." -ForegroundColor Cyan
Push-Location $extDir
try {
    pnpm run build:prod
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Extension build failed with code $LASTEXITCODE"
        exit 1
    }
} finally {
    Pop-Location
}

$stagingDir = Join-Path $extDir "staging"
if (Test-Path $stagingDir) {
    Remove-Item $stagingDir -Recurse -Force
}
New-Item -ItemType Directory -Path $stagingDir -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $stagingDir "dist") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $stagingDir "icons") -Force | Out-Null

Copy-Item (Join-Path $extDir "manifest.json") (Join-Path $stagingDir "manifest.json")
Copy-Item (Join-Path $extDir "popup.html") (Join-Path $stagingDir "popup.html")

# Copy JS artifacts (excluding any .map sourcemaps)
Get-ChildItem -Path (Join-Path $extDir "dist\*.js") | ForEach-Object {
    Copy-Item $_.FullName (Join-Path $stagingDir "dist\$($_.Name)")
}

# Copy icons
Get-ChildItem -Path (Join-Path $extDir "icons\*.*") | ForEach-Object {
    Copy-Item $_.FullName (Join-Path $stagingDir "icons\$($_.Name)")
}

$zipFileName = "hovertv-extension-v$version.zip"
$zipPath = Join-Path $extDir $zipFileName

if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}

Write-Host "Creating archive: $zipPath..." -ForegroundColor Cyan
Compress-Archive -Path "$stagingDir\*" -DestinationPath $zipPath -Force
Remove-Item $stagingDir -Recurse -Force

Write-Host "Extension successfully packaged!" -ForegroundColor Green
Write-Host "Package file: $zipPath" -ForegroundColor Green
Write-Host ""
Write-Host "To test in Chrome / Edge / Brave:" -ForegroundColor Yellow
Write-Host "1. Open chrome://extensions (or edge://extensions / brave://extensions)" -ForegroundColor Yellow
Write-Host "2. Enable 'Developer mode'" -ForegroundColor Yellow
Write-Host "3. Unpack the zip or click 'Load unpacked' pointing to the extension directory" -ForegroundColor Yellow
