#!/bin/bash

echo "Starting FinSight..."

# Start backend

osascript -e '
tell application "Terminal"
    do script "
    cd '"$(pwd)"'/backend &&
    source venv/bin/activate &&
    uvicorn main:app --reload
    "
end tell
'

sleep 2

# Start frontend

osascript -e '
tell application "Terminal"
    do script "
    cd '"$(pwd)"'/frontend &&
    npm run dev
    "
end tell
'

echo "FinSight backend + frontend started."