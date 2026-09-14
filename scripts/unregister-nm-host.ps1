# Unregister HoverTV Native Messaging Host from Windows Registry
Write-Host "Unregistering HoverTV Native Messaging Host..." -ForegroundColor Cyan

$regPaths = @(
    "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.hovertv.host",
    "HKCU:\Software\Microsoft\Edge\NativeMessagingHosts\com.hovertv.host",
    "HKCU:\Software\BraveSoftware\Brave-Browser\NativeMessagingHosts\com.hovertv.host"
)

foreach ($regPath in $regPaths) {
    if (Test-Path $regPath) {
        Remove-Item -Path $regPath -Recurse -Force
        Write-Host "Removed: $regPath" -ForegroundColor Yellow
    } else {
        Write-Host "Not found (skipping): $regPath" -ForegroundColor DarkGray
    }
}

Write-Host "Native Messaging Host unregistered successfully." -ForegroundColor Cyan
