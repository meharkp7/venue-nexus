#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

echo "Installing backend dependencies..."
python -m pip install -r backend/requirements.txt
python -m pip install -r backend/requirements-dev.txt

echo "Installing frontend dependencies..."
cd frontend
npm ci
cd ..

echo "Starting Docker Compose..."
docker compose up --build
