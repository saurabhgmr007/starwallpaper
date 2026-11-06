@echo off
title StarWallpaper Local Server
cd /d "%~dp0"
echo Starting StarWallpaper on http://localhost:3000 ...
npx next start -p 3000
