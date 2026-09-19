#!/usr/bin/env bash
# AuraHome Launcher Script
echo "🌿 Starting AuraHome Telemetry Hub..."

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR/backend"

if [ ! -d "venv" ]; then
    echo "Setting up Python virtual environment..."
    python3 -m venv venv
    ./venv/bin/pip install -r requirements.txt
fi

echo "🚀 Launching AuraHome Server on http://localhost:8000"
./venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --reload
