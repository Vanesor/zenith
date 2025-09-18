// Generate a fresh JWT token for testing
require('dotenv').config({ path: '.env.local' });
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const secret = process.env.JWT_SECRET;
console.log("JWT_SECRET loaded:", !!secret);

if (!secret) {
    console.error("JWT_SECRET not found in environment");
    process.exit(1);
}

// Generate a fresh token for the admin user
const sessionId = crypto.randomUUID();
const payload = {
    userId: "550e8400-e29b-41d4-a716-446655440000", // The admin user ID from our database
    email: "admin@zenith.com",
    role: "admin",
    sessionId: sessionId
};

const token = jwt.sign(payload, secret, { 
    expiresIn: '24h',
    issuer: 'zenith-auth',
    audience: 'zenith-users'
});

console.log("Generated fresh token:");
console.log(token);
console.log("");
console.log("Token payload:", jwt.decode(token));

// Test the token
try {
    const verified = jwt.verify(token, secret);
    console.log("Token verification successful!");
} catch (e) {
    console.error("Token verification failed:", e.message);
}