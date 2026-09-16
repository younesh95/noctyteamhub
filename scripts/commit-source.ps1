$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
git add .
if ($LASTEXITCODE -ne 0) { throw 'Git ne peut pas écrire son index. Aucun commit effectué.' }
git -c user.name=Codex -c user.email=codex@local.invalid commit -m "Add NOCTYS Windows app, member approval, FACEIT and shared demos"
if ($LASTEXITCODE -ne 0) { throw 'Commit non effectué. Consulter le message Git.' }
git log -1 --oneline
