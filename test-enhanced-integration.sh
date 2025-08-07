#!/bin/bash

# Enhanced Code Editor Integration Test Script
# This script tests the integration between Zenith and the Render compiler service

echo "🚀 Testing Enhanced Code Editor Integration..."
echo ""

# Check if the Next.js server is running
echo "1. Checking Next.js server..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Next.js server is running"
else
    echo "❌ Next.js server is not running. Please start with: npm run dev"
    exit 1
fi

echo ""

# Test the health endpoint
echo "2. Testing code execution API health..."
HEALTH_RESPONSE=$(curl -s http://localhost:3000/api/code/execute)
if [[ $HEALTH_RESPONSE == *"healthy"* ]]; then
    echo "✅ Code execution API is healthy"
    echo "Response: $HEALTH_RESPONSE"
else
    echo "❌ Code execution API is not responding properly"
    echo "Response: $HEALTH_RESPONSE"
fi

echo ""

# Test simple code execution
echo "3. Testing simple Python code execution..."
TEST_RESPONSE=$(curl -s -X POST http://localhost:3000/api/code/execute \
  -H "Content-Type: application/json" \
  -d '{
    "code": "print(\"Hello, World!\")", 
    "language": "python",
    "input": ""
  }')

if [[ $TEST_RESPONSE == *"success"* ]]; then
    echo "✅ Simple code execution works"
    echo "Response: $TEST_RESPONSE"
else
    echo "❌ Simple code execution failed"
    echo "Response: $TEST_RESPONSE"
fi

echo ""

# Test with test cases
echo "4. Testing code execution with test cases..."
TESTCASE_RESPONSE=$(curl -s -X POST http://localhost:3000/api/code/execute \
  -H "Content-Type: application/json" \
  -d '{
    "code": "n = int(input())\nprint(n * 2)", 
    "language": "python",
    "testCases": [
      {"input": "5", "expectedOutput": "10"},
      {"input": "3", "expectedOutput": "6"}
    ]
  }')

if [[ $TESTCASE_RESPONSE == *"testResults"* ]]; then
    echo "✅ Test case execution works"
    echo "Response: $TESTCASE_RESPONSE"
else
    echo "❌ Test case execution failed"
    echo "Response: $TESTCASE_RESPONSE"
fi

echo ""
echo "🎉 Integration test complete!"
echo ""
echo "💡 Tips:"
echo "   - Make sure your COMPILER_SERVICE_URL is set in .env.local"
echo "   - Check that your Render service is deployed and running"
echo "   - Test the enhanced code editor in the browser at /assignments/[id]/take"
echo ""
echo "📊 Enhanced features include:"
echo "   - Real-time performance metrics (CPU, memory usage)"
echo "   - Detailed test case analysis"
echo "   - Improved custom input/output testing"
echo "   - Comprehensive execution summaries"
