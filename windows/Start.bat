@echo off
REM Fallback-Start MIT sichtbarer Konsole — zeigt Serverausgaben und Fehler.
REM Der normale Weg ist die Startmenue-Verknuepfung (windows\start.vbs, ohne Fenster).
cd /d "%~dp0.."
title D2 Stream-Overlay
echo.
echo   D2 Stream-Overlay startet... dieses Fenster bitte offen lassen.
echo   Zum Beenden: dieses Fenster schliessen oder Strg+C.
echo.
"%~dp0..\node.exe" "windows\launcher.mjs"
echo.
echo   Server beendet. Taste druecken zum Schliessen.
pause >nul
