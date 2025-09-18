// Test the club management API endpoint directly
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJlbWFpbCI6ImFkbWluQHplbml0aC5jb20iLCJyb2xlIjoiYWRtaW4iLCJzZXNzaW9uSWQiOiIwNWRkZjYzMi0xZTE0LTQyZDctODc3YS1jNzZhNGNlMjAyYmIiLCJpYXQiOjE3NTgwNDA1NjksImV4cCI6MTc1ODEyNjk2OSwiYXVkIjoiemVuaXRoLXVzZXJzIiwiaXNzIjoiemVuaXRoLWF1dGgifQ.nHiS7rqjXM0F5FSK3Xfb1dmPAUnLASL1vaDXkq2sdNI";

async function testAPI() {
    try {
        console.log("Testing club management API...");
        
        const response = await fetch('http://localhost:3000/api/club-management', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log("Response status:", response.status);
        console.log("Response headers:", Object.fromEntries(response.headers.entries()));
        
        const text = await response.text();
        console.log("Response body:", text);
        
        if (!response.ok) {
            console.error("API Error:", response.status, text);
        } else {
            try {
                const data = JSON.parse(text);
                console.log("Parsed data:", JSON.stringify(data, null, 2));
            } catch (e) {
                console.log("Could not parse JSON:", e.message);
            }
        }
    } catch (error) {
        console.error("Test error:", error);
    }
}

testAPI();