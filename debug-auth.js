// Debug script to check authentication status
console.log("=== AUTH DEBUG SCRIPT ===");

// Check localStorage
console.log("localStorage items:");
console.log("zenith-token:", localStorage.getItem("zenith-token"));
console.log("zenith-user:", localStorage.getItem("zenith-user"));
console.log("zenith-refresh-token:", localStorage.getItem("zenith-refresh-token"));

// Check cookies
console.log("document.cookie:", document.cookie);

// Test API call with current auth
console.log("Testing API call...");

const testApiCall = async () => {
  try {
    const token = localStorage.getItem("zenith-token");
    console.log("Using token:", token);
    
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    console.log("Request headers:", headers);
    
    const response = await fetch('/api/club-management', {
      method: 'GET',
      headers: headers
    });
    
    console.log("Response status:", response.status);
    console.log("Response headers:", Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log("Success! Data:", data);
    } else {
      const errorText = await response.text();
      console.log("Error response:", errorText);
    }
  } catch (error) {
    console.error("Fetch error:", error);
  }
};

testApiCall();