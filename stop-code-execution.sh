#!/bin/bash

# Stop the code execution service
echo "Stopping Zenith code execution service..."

if [ -f .code-execution.pid ]; then
    PID=$(cat .code-execution.pid)
    if ps -p $PID > /dev/null; then
        echo "Stopping service with PID: $PID"
        kill $PID
        rm .code-execution.pid
        echo "Service stopped successfully."
    else
        echo "Service is not running (PID: $PID not found)."
        rm .code-execution.pid
    fi
else
    echo "No PID file found. Service might not be running."
    
    # Try to find and stop the process anyway
    PID=$(ps -ef | grep "node scripts/code-execution-service.js" | grep -v grep | awk '{print $2}')
    if [ ! -z "$PID" ]; then
        echo "Found running service with PID: $PID"
        kill $PID
        echo "Service stopped."
    fi
fi

# Also try to stop any Docker containers if they exist
if command -v docker &> /dev/null; then
    echo "Checking for Docker containers..."
    if docker ps | grep -q "code-execution"; then
        echo "Stopping Docker container..."
        docker stop $(docker ps -q --filter "name=code-execution")
        echo "Docker container stopped."
    fi
fi

echo "Done."
