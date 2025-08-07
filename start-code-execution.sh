#!/bin/bash

# Start the code execution service
echo "Starting Zenith code execution service..."

# Due to permission issues with Docker, we'll use Node.js directly
echo "Starting with Node.js to avoid Docker permission issues..."

# Install dependencies if needed
npm install express cors uuid

# Create temp directory for code execution if it doesn't exist
mkdir -p $(pwd)/scripts/temp
chmod 777 $(pwd)/scripts/temp

# Start the service with Node.js
echo "Starting code execution service..."
node scripts/code-execution-service.js &

# Save the PID to stop it later if needed
echo $! > $(pwd)/.code-execution.pid
echo "Code execution service started on http://localhost:4000 (PID: $!)"
echo "To stop the service later, use: kill \$(cat .code-execution.pid)"

echo "Done."
