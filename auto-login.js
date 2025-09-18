// Auto-login script for testing
// Run this in the browser console to automatically log in as admin

console.log("🔐 Starting auto-login as admin...");

async function autoLogin() {
  try {
    // Step 1: Login with admin credentials
    console.log("Step 1: Logging in...");
    const loginResponse = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@zenith.com',
        password: 'admin123'
      })
    });
    
    if (!loginResponse.ok) {
      const errorData = await loginResponse.json();
      console.error("❌ Login failed:", errorData);
      return;
    }
    
    const loginData = await loginResponse.json();
    console.log("✅ Login successful!");
    
    // Step 2: Store tokens in localStorage
    console.log("Step 2: Storing tokens...");
    if (loginData.token) {
      localStorage.setItem("zenith-token", loginData.token);
      console.log("✅ Access token stored");
    }
    
    if (loginData.refreshToken) {
      localStorage.setItem("zenith-refresh-token", loginData.refreshToken);
      console.log("✅ Refresh token stored");
    }
    
    if (loginData.user) {
      localStorage.setItem("zenith-user", JSON.stringify(loginData.user));
      console.log("✅ User data stored");
    }
    
    // Step 3: Test the club management API
    console.log("Step 3: Testing club management API...");
    const apiResponse = await fetch('/api/club-management', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${loginData.token}`
      }
    });
    
    if (apiResponse.ok) {
      const apiData = await apiResponse.json();
      console.log("✅ Club management API working!");
      console.log("📊 Available clubs:", apiData.data.clubs.length);
      console.log("👥 Total users:", apiData.data.systemStats.total_users);
      console.log("🎯 Access level:", apiData.data.userAccess.level);
    } else {
      console.error("❌ API test failed:", apiResponse.status);
    }
    
    // Step 4: Reload the page to apply authentication
    console.log("Step 4: Reloading page...");
    setTimeout(() => {
      location.reload();
    }, 1000);
    
  } catch (error) {
    console.error("❌ Auto-login failed:", error);
  }
}

autoLogin();