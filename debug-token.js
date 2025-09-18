// Debug the JWT token to see what's inside
const jwt = require('jsonwebtoken');

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxZmFiNTJmYS05YmIyLTRlYTQtOGNjNC00ZDk0NTBhNzM0OWYiLCJlbWFpbCI6ImFkbWluQHplbml0aC5jb20iLCJyb2xlIjoiYWRtaW4iLCJzZXNzaW9uSWQiOiJhNGJiOWJlMi02ZjUzLTQ3MTItYjlhNi05YWEzMWUyZjlmOTgiLCJpYXQiOjE3MzY5NTc2NjksImV4cCI6MTczNzA0NDA2OX0.zKWVNk2KdYJlM6Lj3UZELKwT4Zx9oYDUo7vKUJd4QAc";

console.log("Decoding token without verification...");
const decoded = jwt.decode(token);
console.log("Decoded token:", JSON.stringify(decoded, null, 2));

console.log("Current time:", Math.floor(Date.now() / 1000));
console.log("Token exp:", decoded.exp);
console.log("Token expired?", decoded.exp < Math.floor(Date.now() / 1000));

// Check if the JWT secret is available
try {
    require('dotenv').config();
    const secret = process.env.JWT_SECRET;
    console.log("JWT_SECRET available:", !!secret);
    
    if (secret) {
        try {
            const verified = jwt.verify(token, secret);
            console.log("Token verification successful:", verified);
        } catch (verifyError) {
            console.log("Token verification failed:", verifyError.message);
        }
    }
} catch (e) {
    console.log("Could not load JWT_SECRET:", e.message);
}