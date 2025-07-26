// Test file to verify login credentials work
// Run this in your browser console or as a Node.js script

const testCredentials = [
  {
    email: "alex.chen.coord@zenith.edu",
    password: "password123",
    name: "Alex Chen",
    role: "coordinator",
  },
  {
    email: "robert.president@zenith.edu",
    password: "password123",
    name: "Robert Johnson",
    role: "president",
  },
  {
    email: "student1@zenith.edu",
    password: "password123",
    name: "John Smith",
    role: "student",
  },
  {
    email: "jessica.liu.coord@zenith.edu",
    password: "password123",
    name: "Jessica Liu",
    role: "coordinator",
  },
  {
    email: "priya.sharma.coord@zenith.edu",
    password: "password123",
    name: "Dr. Priya Sharma",
    role: "coordinator",
  },
];

// Function to test login API
async function testLogin(credentials) {
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log(
        `✅ ${credentials.name} (${credentials.role}) - Login successful`
      );
      return data;
    } else {
      console.log(`❌ ${credentials.name} - Login failed: ${data.error}`);
      return null;
    }
  } catch (error) {
    console.log(`❌ ${credentials.name} - Network error: ${error.message}`);
    return null;
  }
}

// Test all credentials
async function testAllLogins() {
  console.log("🧪 Testing all login credentials...\n");

  for (const cred of testCredentials) {
    await testLogin(cred);
    await new Promise((resolve) => setTimeout(resolve, 100)); // Small delay between requests
  }

  console.log("\n✨ Testing complete!");
}

// Uncomment the line below to run the tests
// testAllLogins();

export { testCredentials, testLogin, testAllLogins };
