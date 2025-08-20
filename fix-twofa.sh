#!/bin/bash

# Fix TwoFactorAuthService.ts

file="src/lib/TwoFactorAuthService.ts"

if [ -f "$file" ]; then
    echo "Fixing TwoFactorAuthService.ts..."
    
    # Replace all $queryRaw with db.query
    sed -i 's/await db\.\$queryRaw`/await db.query(`/g' "$file"
    sed -i 's/db\.\$queryRaw`/db.query(`/g' "$file"
    
    # Fix SQL template literals to regular strings with parameters
    sed -i 's/SELECT \* FROM users WHERE email = \${email}/SELECT * FROM users WHERE email = $1/g' "$file"
    sed -i 's/SELECT \* FROM users WHERE id = \${userId}/SELECT * FROM users WHERE id = $1/g' "$file"
    sed -i 's/UPDATE users SET two_factor_secret = \${secret} WHERE id = \${userId}/UPDATE users SET two_factor_secret = $1 WHERE id = $2/g' "$file"
    sed -i 's/UPDATE users SET two_factor_enabled = true WHERE id = \${userId}/UPDATE users SET two_factor_enabled = true WHERE id = $1/g' "$file"
    sed -i 's/UPDATE users SET two_factor_enabled = false, two_factor_secret = NULL WHERE id = \${userId}/UPDATE users SET two_factor_enabled = false, two_factor_secret = NULL WHERE id = $1/g' "$file"
    sed -i 's/INSERT INTO auth_tokens (token, user_id, expires_at) VALUES (\${token}, \${userId}, \${expiresAt})/INSERT INTO auth_tokens (token, user_id, expires_at) VALUES ($1, $2, $3)/g' "$file"
    
    echo "✓ Fixed TwoFactorAuthService.ts"
else
    echo "✗ File not found: $file"
fi
