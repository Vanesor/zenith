#!/bin/bash

# This script is a wrapper for starting both the code execution service and the main application
# It's designed to be used in production environments

echo "Starting Zenith application with code execution service..."

# Start the code execution service
./start-code-execution.sh

# Wait a moment to ensure the service is up
sleep 3

# Check if the service is running
if curl -s http://localhost:4000/health > /dev/null; then
  echo "Code execution service is running."
else
  echo "Warning: Code execution service may not be running properly."
  echo "The application will continue to start, but code execution may not work."
fi

# Start the main application
echo "Starting main application..."
NODE_ENV=production npm run start

# Note: The main application will keep this script running until it exits
# When it exits, we should also stop the code execution service if it's running
echo "Main application has stopped, cleaning up..."

# Attempt to stop the execution service
npm run exec:service:stop

echo "Shutdown complete."
