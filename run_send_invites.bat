@echo off
REM --- Instala dependências ---
npm install axios xlsx dotenv >nul 2>&1

REM --- Planilha como argumento ---
set ARQUIVO=%1
if "%ARQUIVO%"=="" (
  echo Uso: run_send_invites.bat Convidados.xlsx
  pause
  goto :eof
)

REM --- Executa Node com dotenv ---
node -r dotenv/config sendInvites.js "%ARQUIVO%"
pause