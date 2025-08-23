#!/bin/bash

# Production Security Audit for Zenith API Routes
# This script checks for common security issues in API endpoints

echo "🔒 Starting Production Security Audit for Zenith API Routes..."
echo "========================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

ISSUES_FOUND=0

# Function to log issues
log_issue() {
    echo -e "${RED}❌ SECURITY ISSUE:${NC} $1"
    ((ISSUES_FOUND++))
}

log_warning() {
    echo -e "${YELLOW}⚠️  WARNING:${NC} $1"
}

log_good() {
    echo -e "${GREEN}✅ GOOD:${NC} $1"
}

log_info() {
    echo -e "${BLUE}ℹ️  INFO:${NC} $1"
}

echo "1. Checking for proper authentication..."
echo "----------------------------------------"

# Check for files still using manual JWT verification
echo "Checking for manual JWT verification..."
JWT_FILES=$(grep -r "jwt\.verify\|jwtVerify" src/app/api/ --include="*.ts" --include="*.js" | wc -l)
if [ $JWT_FILES -gt 0 ]; then
    log_issue "Found $JWT_FILES files still using manual JWT verification:"
    grep -r "jwt\.verify\|jwtVerify" src/app/api/ --include="*.ts" --include="*.js" | head -10
else
    log_good "No manual JWT verification found"
fi

# Check for hardcoded secrets
echo -e "\nChecking for hardcoded secrets..."
SECRET_FILES=$(grep -r "your-secret-key\|fallback.*secret\|test.*secret" src/ --include="*.ts" --include="*.js" | wc -l)
if [ $SECRET_FILES -gt 0 ]; then
    log_issue "Found $SECRET_FILES files with hardcoded secrets:"
    grep -r "your-secret-key\|fallback.*secret\|test.*secret" src/ --include="*.ts" --include="*.js"
else
    log_good "No hardcoded secrets found"
fi

# Check for proper error handling
echo -e "\nChecking for proper error handling..."
ERROR_HANDLING=$(grep -r "console\.log.*error\|throw new Error\|\.catch.*console" src/app/api/ --include="*.ts" | wc -l)
if [ $ERROR_HANDLING -gt 0 ]; then
    log_warning "Found $ERROR_HANDLING potential error handling issues (information leakage)"
fi

# Check for SQL injection vulnerabilities
echo -e "\nChecking for SQL injection vulnerabilities..."
SQL_INJECTION=$(grep -r "query.*\${.*}\|query.*\+.*\+\|query.*concat" src/app/api/ --include="*.ts" | wc -l)
if [ $SQL_INJECTION -gt 0 ]; then
    log_issue "Found $SQL_INJECTION potential SQL injection vulnerabilities:"
    grep -r "query.*\${.*}\|query.*\+.*\+\|query.*concat" src/app/api/ --include="*.ts"
else
    log_good "No obvious SQL injection vulnerabilities found"
fi

# Check for missing input validation
echo -e "\nChecking for input validation..."
VALIDATION_FILES=$(find src/app/api -name "*.ts" -exec grep -l "await.*request\.json()\|request\.body\|params\." {} \; | wc -l)
VALIDATED_FILES=$(find src/app/api -name "*.ts" -exec grep -l "zod\|joi\|yup\|validate" {} \; | wc -l)
log_info "Found $VALIDATION_FILES files handling input, $VALIDATED_FILES with validation"

# Check for missing rate limiting
echo -e "\nChecking for rate limiting..."
RATE_LIMIT_FILES=$(grep -r "rate.*limit\|throttle" src/app/api/ --include="*.ts" | wc -l)
if [ $RATE_LIMIT_FILES -eq 0 ]; then
    log_warning "No rate limiting found in API routes"
else
    log_good "Rate limiting implementation found"
fi

# Check for CORS configuration
echo -e "\nChecking for CORS configuration..."
CORS_FILES=$(grep -r "cors\|Access-Control" src/ --include="*.ts" --include="*.js" | wc -l)
if [ $CORS_FILES -eq 0 ]; then
    log_warning "No CORS configuration found"
else
    log_info "CORS configuration found in $CORS_FILES files"
fi

# Check for environment variable usage
echo -e "\nChecking environment variables..."
ENV_VARS=$(grep -r "process\.env\." src/ --include="*.ts" --include="*.js" | grep -v "NODE_ENV" | wc -l)
log_info "Found $ENV_VARS environment variable usages"

# Check for exposed sensitive endpoints
echo -e "\nChecking for potentially sensitive endpoints..."
SENSITIVE_ENDPOINTS=$(find src/app/api -name "*.ts" | grep -E "(admin|debug|test|dev|internal)" | wc -l)
if [ $SENSITIVE_ENDPOINTS -gt 0 ]; then
    log_warning "Found $SENSITIVE_ENDPOINTS potentially sensitive endpoints:"
    find src/app/api -name "*.ts" | grep -E "(admin|debug|test|dev|internal)"
fi

echo -e "\n========================================================"
echo -e "${BLUE}AUDIT SUMMARY:${NC}"
echo "Total security issues found: $ISSUES_FOUND"

if [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "${GREEN}🎉 No critical security issues found!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Please address the security issues above before production deployment.${NC}"
    exit 1
fi
