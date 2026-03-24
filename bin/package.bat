@echo off
echo.
echo [INFO] Installing web project dependencies...
echo.

%~d0
cd %~dp0

cd ..
yarn --registry=https://registry.npmmirror.com

pause
