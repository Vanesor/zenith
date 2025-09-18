// Script to set a valid token in localStorage for testing
// Run this in the browser console on the admin page

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJlbWFpbCI6ImFkbWluQHplbml0aC5jb20iLCJyb2xlIjoiYWRtaW4iLCJzZXNzaW9uSWQiOiIwNWRkZjYzMi0xZTE0LTQyZDctODc3YS1jNzZhNGNlMjAyYmIiLCJpYXQiOjE3NTgwNDA1NjksImV4cCI6MTc1ODEyNjk2OSwiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.nHiS7rqjXM0F5FSK3Xfb1dmPAUnLASL1vaDXkq2sdNI";

const userData = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    email: "admin@zenith.com",
    name: "Admin User",
    role: "admin",
    avatar: null,
    profile_image_url: null
};

localStorage.setItem("zenith-token", token);
localStorage.setItem("zenith-user", JSON.stringify(userData));

console.log("✅ Admin token and user data set successfully!");
console.log("Token:", token);
console.log("User data:", userData);

// Refresh the page to load the data
location.reload();