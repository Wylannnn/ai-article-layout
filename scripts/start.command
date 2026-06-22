#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"

if command -v python3 &> /dev/null; then
  echo "====================================="
  echo "  AI 文章排版工具"
  echo "  浏览器打开 http://localhost:3000"
  echo "  按 Ctrl+C 退出"
  echo "====================================="
  python3 -m http.server 3000 --directory out
elif command -v python &> /dev/null; then
  echo "====================================="
  echo "  AI 文章排版工具"
  echo "  浏览器打开 http://localhost:3000"
  echo "  按 Ctrl+C 退出"
  echo "====================================="
  python -m http.server 3000 --directory out
else
  echo "未找到 Python 环境，请安装 Python 3 或使用以下命令手动启动："
  echo "  npx serve out"
  exit 1
fi
