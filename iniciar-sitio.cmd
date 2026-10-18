@echo off
REM ============================================================
REM  La Magica Tienda de Disfraces - servidor local (doble clic)
REM  Levanta el sitio y abre el navegador cuando ya responde.
REM  Doble clic para empezar.  Ctrl+C (o cerrar la ventana) para parar.
REM ============================================================
title La Magica Tienda de Disfraces - servidor local
chcp 65001 >nul
cd /d "%~dp0"

set "PORT=4321"
set "URL=http://localhost:%PORT%/magicatienda"

echo.
echo  ==========================================================
echo    LA MAGICA TIENDA DE DISFRACES  -  servidor local
echo  ==========================================================
echo.
echo    URL:      %URL%
echo    Detener:  Ctrl+C  o cierra esta ventana
echo.

REM --- Dependencias: solo se instalan la primera vez ---
if not exist "node_modules\" (
  echo  Primera vez: instalando dependencias ^(puede tardar unos minutos^)...
  call npm.cmd install || goto :error
  echo.
)

REM --- Cierra un servidor colgado de una sesion anterior ---
for /f "tokens=5" %%p in ('netstat -ano ^| findstr /r /c:":%PORT% .*LISTENING"') do (
  echo  Cerrando servidor anterior en el puerto %PORT% ^(PID %%p^)...
  taskkill /F /PID %%p >nul 2>&1
)

REM --- Abre el navegador SOLO cuando el servidor ya responde ---
start "" powershell -NoProfile -WindowStyle Hidden -Command "$u='%URL%'; for($i=0;$i -lt 90;$i++){ try{ $null = Invoke-WebRequest -UseBasicParsing -Uri $u -TimeoutSec 2; Start-Process $u; break } catch { Start-Sleep -Seconds 2 } }"

echo  Levantando el servidor...
echo.
call npm.cmd run dev -- --port %PORT%
goto :eof

:error
echo.
echo  ERROR: no se pudieron instalar las dependencias.
echo  Revisa que Node.js este instalado y que tengas internet.
pause
