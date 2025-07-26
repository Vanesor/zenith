const { Client } = require("pg");

async function testLoginAPI() {
  try {
    console.log("🧪 Testing login API with proper credentials...");

    // Test with valid credentials
    console.log("\n1. Testing with VALID credentials:");
    const validResponse = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "alex.chen.coord@zenith.edu",
        password: "password123",
      }),
    });

    const validResult = await validResponse.json();
    console.log(`Status: ${validResponse.status}`);
    if (validResponse.ok) {
      console.log("✅ Login successful!");
      console.log(`User: ${validResult.user.name}`);
      console.log(`Role: ${validResult.user.role}`);
      console.log(`Club: ${validResult.user.club_id}`);
      console.log(`Token: ${validResult.token ? "Generated" : "Missing"}`);
    } else {
      console.log("❌ Login failed:");
      console.log(validResult);
    }

    // Test with invalid password
    console.log("\n2. Testing with INVALID password:");
    const invalidResponse = await fetch(
      "http://localhost:3000/api/auth/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "alex.chen.coord@zenith.edu",
          password: "wrongpassword",
        }),
      }
    );

    const invalidResult = await invalidResponse.json();
    console.log(`Status: ${invalidResponse.status}`);
    if (invalidResponse.status === 401) {
      console.log("✅ Properly rejected invalid password");
      console.log(`Error: ${invalidResult.error}`);
    } else {
      console.log("❌ Should have rejected invalid password:");
      console.log(invalidResult);
    }

    // Test with non-existent user
    console.log("\n3. Testing with NON-EXISTENT user:");
    const nonExistentResponse = await fetch(
      "http://localhost:3000/api/auth/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "nonexistent@example.com",
          password: "password123",
        }),
      }
    );

    const nonExistentResult = await nonExistentResponse.json();
    console.log(`Status: ${nonExistentResponse.status}`);
    if (nonExistentResponse.status === 401) {
      console.log("✅ Properly rejected non-existent user");
      console.log(`Error: ${nonExistentResult.error}`);
    } else {
      console.log("❌ Should have rejected non-existent user:");
      console.log(nonExistentResult);
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

// Check if server is running first
fetch("http://localhost:3000/api/home/stats")
  .then(() => {
    console.log("✅ Server is running, testing login API...");
    return testLoginAPI();
  })
  .catch(() => {
    console.log("❌ Server is not running! Please start with: npm run dev");
  });
