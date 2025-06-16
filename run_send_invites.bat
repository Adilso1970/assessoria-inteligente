@echo on
REM --- instala deps se necessário ---
npm install axios xlsx dotenv

REM --- pega a planilha ---
set ARQUIVO=%1
if "%ARQUIVO%"=="" (
  echo Uso: run_send_invites.bat Convidados.xlsx
  pause
  goto :eof
)

REM --- executa em CommonJS ---
node sendInvites.cjs "%ARQUIVO%"
pause
