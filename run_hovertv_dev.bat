@echo off
title HoverTV Dev Server
echo Starting HoverTV Dev Environment...

cd /d "%~dp0tauri-app"

echo Running Tauri Dev...
call pnpm run tauri dev

if %ERRORLEVEL% neq 0 (
    echo pnpm command failed. Trying npm...
    call npm run tauri dev
)

echo.
echo Process has ended or crashed!
pause
