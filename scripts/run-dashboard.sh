#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DASHBOARD_DIR="$ROOT_DIR/dashboard"
HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-3108}"

echo ""
echo "Starting Super Sayn dashboard..."
echo "Local URL: http://localhost:${PORT}"
echo ""

cd "$DASHBOARD_DIR"
npm run dev -- --hostname "$HOST" --port "$PORT"

