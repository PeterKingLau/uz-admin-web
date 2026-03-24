@echo off
echo.
echo [INFO] Building web project and generating dist output...
echo.

%~d0
cd %~dp0

cd ..
yarn build:prod

pause
