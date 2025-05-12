@echo off
REM Script d'installation VibeMCP pour Windows
REM Ce fichier batch permet de lancer facilement le script PowerShell

echo.
echo   __      ___ _          __  __ ___ ___ 
echo   \ \    / (_) ^|__  ___ ^|  \/  / __^| _ \
echo    \ \/\/ /^| ^| '_ \/ -_)^| ^|\/^| ^| (__^|  _/
echo     \_/\_/ ^|_^|_.__/\___^|^|_^|  ^|_^|\_\_^|_^|  
echo                                          
echo   Proxy MCP universel - Installateur Windows
echo.

REM Vérifier si PowerShell est disponible
where powershell >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] PowerShell n'est pas disponible sur ce système.
    echo Veuillez installer PowerShell ou exécuter manuellement le script install.ps1.
    pause
    exit /b 1
)

REM Exécuter le script PowerShell
echo Lancement de l'installation...
powershell -ExecutionPolicy Bypass -File "%~dp0install.ps1"

if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] Une erreur s'est produite lors de l'installation.
    pause
    exit /b 1
)

echo.
echo Installation terminée avec succès!
pause