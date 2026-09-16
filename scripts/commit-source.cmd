@echo off
cd /d "%~dp0.."
git add .
if errorlevel 1 goto failed
git -c user.name=Codex -c user.email=codex@local.invalid commit -m "Add NOCTYS Windows app, member approval, FACEIT and shared demos"
if errorlevel 1 goto failed
git log -1 --oneline
pause
exit /b 0
:failed
echo Commit non effectue. Copiez le message Git ci-dessus.
pause
exit /b 1
