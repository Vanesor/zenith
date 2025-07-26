// Test the login flow end-to-end
async function testRealLogin() {
  try {
    console.log("🧪 Testing real login flow...");

    // Test 1: Valid credentials
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
      console.log("✅ API Login successful!");
      console.log(`- User ID: ${validResult.user.id}`);
      console.log(`- Name: ${validResult.user.name}`);
      console.log(`- Email: ${validResult.user.email}`);
      console.log(`- Role: ${validResult.user.role}`);
      console.log(`- Club ID: ${validResult.user.club_id}`);
      console.log(`- Has Token: ${validResult.token ? "YES" : "NO"}`);

      if (validResult.club) {
        console.log(`- Club Name: ${validResult.club.name}`);
        console.log(`- Club Type: ${validResult.club.type}`);
      }
    } else {
      console.log("❌ API Login failed:");
      console.log(validResult);
    }

    // Test 2: Invalid credentials
    console.log("\n2. Testing with INVALID credentials:");
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
      console.log("✅ Properly rejected invalid credentials");
      console.log(`Error message: "${invalidResult.error}"`);
    } else {
      console.log("❌ Should have rejected invalid credentials");
      console.log(invalidResult);
    }

    // Test 3: Invalid email format
    console.log("\n3. Testing with INVALID email format:");
    const invalidEmailResponse = await fetch(
      "http://localhost:3000/api/auth/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "invalid-email",
          password: "password123",
        }),
      }
    );

    const invalidEmailResult = await invalidEmailResponse.json();
    console.log(`Status: ${invalidEmailResponse.status}`);

    if (invalidEmailResponse.status === 400) {
      console.log("✅ Properly rejected invalid email format");
      console.log(`Error message: "${invalidEmailResult.error}"`);
    } else {
      console.log("❌ Should have rejected invalid email format");
      console.log(invalidEmailResult);
    }

    // Test 4: Missing fields
    console.log("\n4. Testing with MISSING fields:");
    const missingFieldsResponse = await fetch(
      "http://localhost:3000/api/auth/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "alex.chen.coord@zenith.edu",
          // Missing password
        }),
      }
    );

    const missingFieldsResult = await missingFieldsResponse.json();
    console.log(`Status: ${missingFieldsResponse.status}`);

    if (missingFieldsResponse.status === 400) {
      console.log("✅ Properly rejected missing fields");
      console.log(`Error message: "${missingFieldsResult.error}"`);
    } else {
      console.log("❌ Should have rejected missing fields");
      console.log(missingFieldsResult);
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

// Check if server is running and test
fetch("http://localhost:3000/api/home/stats")
  .then(() => {
    console.log("✅ Server is running");
    return testRealLogin();
  })
  .catch(() => {
    console.log("❌ Server is not running! Please start with: npm run dev");
  });
