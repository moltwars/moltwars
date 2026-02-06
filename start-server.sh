#!/bin/bash

cd "$(dirname "$0")"

# Check if server is already running
if pgrep -f "node server.js" > /dev/null; then
    echo "Server is already running (PID: $(pgrep -f 'node server.js'))"
    exit 1
fi

# Development mode: disable auth for admin endpoints
export AUTH_ENABLED=false

# Start server with nohup, redirect output to logs
nohup node server.js > server.log 2>&1 &

echo "Server started with PID: $!"
echo "Logs: $(pwd)/server.log"
echo "To stop: kill $! (or use: pkill -f 'node server.js')"
