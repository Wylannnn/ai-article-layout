@echo off
title AI 文章排版工具
cd /d "%~dp0"

set SERVE_DIR=.
if exist out\ ( set SERVE_DIR=out )

REM --- 1. 找 Python（py > python > python3） ---
set PYTHON_CMD=
where py >nul 2>nul && set PYTHON_CMD=py
if not defined PYTHON_CMD (
  where python >nul 2>nul && set PYTHON_CMD=python
)
if not defined PYTHON_CMD (
  where python3 >nul 2>nul && set PYTHON_CMD=python3
)

if not defined PYTHON_CMD (
  echo [错误] 未找到 Python 3，请安装后重试。
  echo 下载地址: https://www.python.org/downloads/
  echo.
  echo 或者安装 Node.js 后运行: npx serve .
  pause
  exit /b 1
)

REM --- 2. 检测可用端口 3000~3005 ---
set PORT=3000
:CHECK_PORT
netstat -an 2>nul | findstr /C:":%PORT% " >nul
if not errorlevel 1 (
  if %PORT% lss 3005 (
    set /a PORT+=1
    goto CHECK_PORT
  )
  echo [错误] 端口 3000~3005 均被占用，请关闭其他应用后重试。
  pause
  exit /b 1
)

REM --- 3. 启动服务 ---
echo =====================================
echo   AI 文章排版工具
echo   浏览器打开 http://localhost:%PORT%
echo   关闭此窗口即可退出
echo =====================================

start http://localhost:%PORT%
%PYTHON_CMD% -m http.server %PORT% --directory %SERVE_DIR%

REM 如果 Python 异常退出（端口冲突、其他错误），给用户看错误信息
if errorlevel 1 (
  echo.
  echo [错误] 服务启动失败，请检查端口 %PORT% 是否被占用。
  echo 按任意键退出...
  pause >nul
)
