#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DASHBOARD_DIR="$ROOT_DIR/dashboard"

echo ""
echo "Super Sayn Dashboard Setup"
echo "=========================="
echo ""

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is not installed."
  echo "Install Node.js 20 or newer, then run this script again."
  exit 1
fi

echo "Node version: $(node --version)"

if [[ ! -d "$DASHBOARD_DIR" ]]; then
  echo "Dashboard directory not found: $DASHBOARD_DIR"
  exit 1
fi

cd "$DASHBOARD_DIR"

echo ""
echo "Installing dashboard dependencies..."
npm install

if [[ ! -f ".env.local" ]]; then
  cp .env.example .env.local
  echo ""
  echo "Created dashboard/.env.local from .env.example"
else
  echo ""
  echo "dashboard/.env.local already exists"
fi

echo ""
echo "Setup complete."
echo ""
echo "Next steps:"
echo "1. Optional: add API keys to dashboard/.env.local"
echo "2. Start the dashboard with: bash scripts/run-dashboard.sh"
echo "3. Open: http://localhost:3108"
echo ""

