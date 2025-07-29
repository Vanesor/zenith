#!/bin/bash
# Test script to verify all API endpoints are working correctly

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3000"

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run a test
run_test() {
    local test_name="$1"
    local url="$2"
    local method="$3"
    local data="$4"
    local auth_token="$5"
    
    echo -e "${YELLOW}Testing: $test_name${NC}"
    
    if [ "$method" = "GET" ]; then
        if [ -n "$auth_token" ]; then
            response=$(curl -s -w "%{http_code}" -H "Authorization: Bearer $auth_token" "$BASE_URL$url")
        else
            response=$(curl -s -w "%{http_code}" "$BASE_URL$url")
        fi
    elif [ "$method" = "POST" ]; then
        if [ -n "$auth_token" ]; then
            response=$(curl -s -w "%{http_code}" -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $auth_token" -d "$data" "$BASE_URL$url")
        else
            response=$(curl -s -w "%{http_code}" -X POST -H "Content-Type: application/json" -d "$data" "$BASE_URL$url")
        fi
    fi
    
    http_code="${response: -3}"
    response_body="${response%???}"
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✓ PASSED${NC} (HTTP $http_code)"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC} (HTTP $http_code)"
        echo "Response: $response_body"
        ((TESTS_FAILED++))
    fi
    echo ""
}

echo "Starting API Tests..."
echo "===================="

# Test 1: Health check
run_test "Health Check" "/api/health" "GET"

# Test 2: Register a new user
register_data='{"email":"test@example.com","password":"password123","name":"Test User","username":"testuser","role":"student","clubId":"tech-club"}'
run_test "User Registration" "/api/auth/register" "POST" "$register_data"

# Test 3: Login
login_data='{"email":"test@example.com","password":"password123"}'
login_response=$(curl -s -X POST -H "Content-Type: application/json" -d "$login_data" "$BASE_URL/api/auth/login")
token=$(echo "$login_response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$token" ]; then
    echo -e "${GREEN}Login successful, token obtained${NC}"
else
    echo -e "${RED}Failed to obtain token${NC}"
    token=""
fi

# Test 4: Get user profile (with auth)
run_test "Get User Profile" "/api/auth/me" "GET" "" "$token"

# Test 5: Get all events
run_test "Get All Events" "/api/events" "GET"

# Test 6: Get all posts
run_test "Get All Posts" "/api/posts" "GET"

# Test 7: Get clubs
run_test "Get Clubs" "/api/clubs" "GET"

# Test 8: Create a new event (with auth)
event_data='{"title":"Test Event","description":"Test event description","eventDate":"2025-09-01","eventTime":"14:00","location":"Test Location","maxAttendees":50}'
run_test "Create Event" "/api/events" "POST" "$event_data" "$token"

# Test 9: Create a new post (with auth)
post_data='{"title":"Test Post","content":"Test post content","category":"discussion"}'
run_test "Create Post" "/api/posts" "POST" "$post_data" "$token"

# Test 10: Get notifications (with auth)
run_test "Get Notifications" "/api/notifications" "GET" "" "$token"

echo "===================="
echo "Test Summary:"
echo -e "${GREEN}Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Tests Failed: $TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed! 🎉${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed. Please check the API implementation.${NC}"
    exit 1
fi
