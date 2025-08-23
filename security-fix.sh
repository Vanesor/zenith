#!/bin/bash

# Comprehensive Security Fix Script for Production
echo "🔒 Starting comprehensive security fixes..."

# Remove hardcoded secret fallbacks
echo "1. Removing hardcoded secret fallbacks..."
find src/ -name "*.ts" -type f -exec sed -i 's/|| "your-secret-key"//g' {} \;
find src/ -name "*.ts" -type f -exec sed -i 's/|| "your-fallback-secret"//g' {} \;
find src/ -name "*.ts" -type f -exec sed -i 's/|| '\''your-secret-key'\''//g' {} \;
find src/ -name "*.ts" -type f -exec sed -i 's/|| '\''fallback-secret'\''//g' {} \;
echo "✅ Removed hardcoded secrets"

# Remove JWT_SECRET constant declarations where not needed
echo "2. Cleaning up JWT_SECRET declarations..."
find src/app/api -name "*.ts" -type f -exec grep -l "const JWT_SECRET" {} \; | while read file; do
    if grep -q "verifyAuth" "$file"; then
        # If file uses verifyAuth, remove JWT_SECRET
        sed -i '/^const JWT_SECRET/d' "$file"
        echo "Cleaned: $file"
    fi
done
echo "✅ Cleaned JWT_SECRET declarations"

# Add proper error handling guard
echo "3. Adding production error handling..."
find src/app/api -name "*.ts" -type f -exec sed -i 's/console\.error.*error[^;]*;/console.error("API Error:", error instanceof Error ? error.message : "Unknown error");/g' {} \;
echo "✅ Improved error handling"

echo "🎉 Security fixes completed!"
