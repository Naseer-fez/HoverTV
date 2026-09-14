# Release Build & Bundling Script for HoverTV
param (
    [ValidateSet("msi", "nsis", "all")]
    [string]$BundleType = "msi",
    [switch]$SkipFrontendBuild = $false
)

$ErrorActionPreference = "Stop"
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " HoverTV Release Bundler ($BundleType)  " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Configure MSVC portable toolchain environment
$msvcRoot = "D:\Extras\ES\msvc"
if (Test-Path $msvcRoot) {
    Write-Host "Configuring MSVC toolchain from: $msvcRoot" -ForegroundColor DarkGray
    $msvcBin = Join-Path $msvcRoot "VC\Tools\MSVC\14.44.35207\bin\Hostx64\x64"
    $msvcLib = Join-Path $msvcRoot "VC\Tools\MSVC\14.44.35207\lib\x64"
    $msvcInc = Join-Path $msvcRoot "VC\Tools\MSVC\14.44.35207\include"
    $sdkLibUcrt = Join-Path $msvcRoot "Windows Kits\10\Lib\10.0.19041.0\ucrt\x64"
    $sdkLibUm = Join-Path $msvcRoot "Windows Kits\10\Lib\10.0.19041.0\um\x64"
    $sdkIncUcrt = Join-Path $msvcRoot "Windows Kits\10\Include\10.0.19041.0\ucrt"
    $sdkIncUm = Join-Path $msvcRoot "Windows Kits\10\Include\10.0.19041.0\um"
    $sdkIncShared = Join-Path $msvcRoot "Windows Kits\10\Include\10.0.19041.0\shared"

    $sdkBin = Join-Path $msvcRoot "Windows Kits\10\bin\10.0.19041.0\x64"

    if ($env:PATH -notlike "*$msvcBin*") {
        $env:PATH = "$msvcBin;$sdkBin;$env:PATH"
    }
    $env:RC = Join-Path $sdkBin "rc.exe"
    $env:LIB = "$msvcLib;$sdkLibUcrt;$sdkLibUm;$env:LIB"
    $env:INCLUDE = "$msvcInc;$sdkIncUcrt;$sdkIncUm;$sdkIncShared;$env:INCLUDE"
}

$tauriAppDir = (Resolve-Path "$PSScriptRoot\..\tauri-app").Path
Push-Location $tauriAppDir
try {
    if (-not $SkipFrontendBuild) {
        Write-Host "Building web frontend..." -ForegroundColor Cyan
        pnpm build
    }

    Write-Host "Executing Tauri release build (bundle: $BundleType)..." -ForegroundColor Cyan
    if ($BundleType -eq "all") {
        pnpm tauri build
    } else {
        pnpm tauri build -b $BundleType
    }

    $bundleDir = Join-Path $tauriAppDir "src-tauri\target\release\bundle\$BundleType"
    if (Test-Path $bundleDir) {
        Write-Host ""
        Write-Host "Release bundle generated successfully!" -ForegroundColor Green
        Get-ChildItem -Path $bundleDir -File | ForEach-Object {
            Write-Host "  -> $($_.FullName) ($([math]::Round($_.Length / 1MB, 2)) MB)" -ForegroundColor Green
        }
    } else {
        Write-Host "Tauri build completed. Check src-tauri\target\release\ for artifacts." -ForegroundColor Yellow
    }
} finally {
    Pop-Location
}
