@echo off
echo.
echo [INFO] Starting the web project with Vite dev server...
echo.

%~d0
cd %~dp0

cd ..
yarn dev

pause
