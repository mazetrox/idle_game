@echo off
title The Caves - Idle Mining Game
echo.
echo   Starting The Caves...
echo   Opening http://localhost:3000
echo   (Keep this window open while playing)
echo.
start http://localhost:3000
npx serve -l 3000 --no-clipboard
pause
