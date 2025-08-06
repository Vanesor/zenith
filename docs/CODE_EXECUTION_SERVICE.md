# Code Execution Service for Zenith

This service handles safe code compilation and execution for the Zenith assignment system. It provides isolated environments for running code in various programming languages.

## Features

- Support for multiple programming languages:
  - JavaScript (Node.js)
  - Python
  - Java
  - C/C++
  - And more
- Secure execution in isolated Docker containers
- Time and memory limits enforcement
- Standard input/output handling for test cases
- Comprehensive error reporting

## Architecture

The code execution service runs as a separate microservice from the main Zenith application. This separation provides:

1. **Security**: Code execution happens in isolated containers
2. **Scalability**: The execution service can be scaled independently
3. **Reliability**: Issues with code execution won't affect the main application

## Setup and Running

### Option 1: Using Docker (Recommended for Production)

```bash
# Build and start the Docker container
docker-compose -f docker-compose.execution.yml up -d

# Check logs
docker-compose -f docker-compose.execution.yml logs -f
```

### Option 2: Using Node.js Directly (Development)

```bash
# Install dependencies
npm install express cors uuid

# Start the service
node scripts/code-execution-service.js
```

### Using the npm Scripts

We've added several npm scripts to manage the execution service:

```bash
# Start the code execution service
npm run exec:service:start

# Stop the service
npm run exec:service:stop

# View service logs
npm run exec:service:logs

# Start development server with execution service
npm run dev:with-exec
```

## API Endpoints

The service exposes the following endpoints:

- `POST /execute` - Execute code with the given parameters
- `GET /health` - Health check endpoint
- `GET /languages` - Get supported languages information

### Execution Request Format

```json
{
  "language": "javascript", 
  "code": "function solution(a, b) { return a + b; }",
  "testCases": [
    {
      "input": "5\n7",
      "expectedOutput": "12"
    }
  ],
  "timeLimit": 2000,
  "memoryLimit": 128
}
```

### Response Format

```json
{
  "success": true,
  "results": [
    {
      "passed": true,
      "output": "12",
      "expectedOutput": "12",
      "executionTime": 15
    }
  ],
  "stats": {
    "passedTests": 1,
    "totalTests": 1,
    "executionTimeMs": 15
  }
}
```

## Security Considerations

The execution service uses several layers of security:

1. **Docker Isolation**: Each code execution happens in a separate container
2. **Resource Limits**: CPU and memory limits are enforced
3. **Execution Timeouts**: Code execution is limited by time
4. **Seccomp Profile**: System calls are restricted using a security profile

## Troubleshooting

If the code execution service isn't working:

1. Check if the service is running: `curl http://localhost:4000/health`
2. Verify Docker is running (if using Docker mode)
3. Check service logs: `npm run exec:service:logs`
4. Ensure required compilers/interpreters are installed in the Docker image

## Integration with Main Application

The main Zenith application communicates with this service via the `/api/code/execute` endpoint, which forwards requests to the execution service.

See `src/app/api/code/execute/route.ts` for integration details.
