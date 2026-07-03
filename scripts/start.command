#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"

SERVE_DIR="."
if [ -d "out" ]; then
  SERVE_DIR="out"
fi

if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
  echo "[错误] 未找到 Python 环境。"
  echo "请安装 Python 3 或使用以下命令手动启动："
  echo "  npx serve ."
  exit 1
fi

PYTHON_CMD="python3"
if ! command -v "$PYTHON_CMD" &> /dev/null; then
  PYTHON_CMD="python"
fi

for PORT in 3000 3001 3002 3003 3004 3005; do
  if ! lsof -i :$PORT &>/dev/null 2>&1; then
    echo "====================================="
    echo "  AI 文章排版工具"
    echo "  浏览器打开 http://localhost:$PORT"
    echo "  按 Ctrl+C 退出"
    echo "====================================="
    open "http://localhost:$PORT" 2>/dev/null || true
    exec $PYTHON_CMD -m http.server $PORT --directory "$SERVE_DIR"
  fi
done

echo "[错误] 端口 3000~3005 均被占用，请关闭其他应用后重试。" >&2
exit 1
