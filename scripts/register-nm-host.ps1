# Register HoverTV Native Messaging Host in Windows Registry
param (
    [string]$ManifestPath = "",
    [string]$HostBinaryPath = "",
    [string]$ExtensionId = ""
)

Write-Host "Registering HoverTV Native Messaging Host..." -ForegroundColor Cyan

if ([string]::IsNullOrWhiteSpace($ManifestPath)) {
    $ManifestPath = Join-Path (Resolve-Path "$PSScriptRoot\..").Path "com.hovertv.host.json"
}

if (-not (Test-Path $ManifestPath)) {
    Write-Error "Native Messaging host manifest not found at: $ManifestPath"
    exit 1
}

$ManifestPath = (Resolve-Path $ManifestPath).Path
$content = Get-Content $ManifestPath -Raw | ConvertFrom-Json

$updated = $false
if (-not [string]::IsNullOrWhiteSpace($HostBinaryPath)) {
    $resolvedBinary = (Resolve-Path $HostBinaryPath -ErrorAction SilentlyContinue)
    $content.path = if ($resolvedBinary) { $resolvedBinary.Path } else { $HostBinaryPath }
    Write-Host "Updated host binary path: $($content.path)" -ForegroundColor Green
    $updated = $true
}

if (-not [string]::IsNullOrWhiteSpace($ExtensionId)) {
    $content.allowed_origins = @("chrome-extension://$ExtensionId/")
    Write-Host "Updated allowed_origins for Extension ID: $ExtensionId" -ForegroundColor Green
    $updated = $true
}

if ($updated) {
    $content | ConvertTo-Json -Depth 4 | Set-Content $ManifestPath -Encoding utf8
}

$regPaths = @(
    "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.hovertv.host",
    "HKCU:\Software\Microsoft\Edge\NativeMessagingHosts\com.hovertv.host",
    "HKCU:\Software\BraveSoftware\Brave-Browser\NativeMessagingHosts\com.hovertv.host"
)

foreach ($regPath in $regPaths) {
    if (-not (Test-Path $regPath)) {
        New-Item -Path $regPath -Force | Out-Null
    }
    Set-ItemProperty -Path $regPath -Name "(Default)" -Value $ManifestPath
    Write-Host "Registered in: $regPath" -ForegroundColor Green
}

Write-Host "Native Messaging Host registered successfully." -ForegroundColor Cyan
