#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DASHBOARD_DIR="$ROOT_DIR/dashboard"

echo ""
echo "Super Sayn Dashboard Check"
echo "=========================="
echo ""

cd "$DASHBOARD_DIR"

echo "1. npm test"
npm test

echo ""
echo "2. npm run lint"
npm run lint

echo ""
echo "3. npm run build"
npm run build

echo ""
echo "Dashboard checks passed."
echo ""

