@echo off
title AI 文章排版工具

echo =====================================
echo   AI 文章排版工具
echo   浏览器打开 http://localhost:3000
echo   关闭此窗口即可退出
echo =====================================

cd /d "%~dp0"

set SERVE_DIR=.
if exist out\ (
  set SERVE_DIR=out
)

where python >nul 2>nul
if %ERRORLEVEL% equ 0 (
  python -m http.server 3000 --directory %SERVE_DIR%
  goto :end
)

where python3 >nul 2>nul
if %ERRORLEVEL% equ 0 (
  python3 -m http.server 3000 --directory %SERVE_DIR%
  goto :end
)

echo 未找到 Python，请安装 Python 3 后重新运行此脚本。
echo 下载地址: https://www.python.org/downloads/
echo.
echo 或者安装 Node.js 后运行: npx serve .
pause

:end
