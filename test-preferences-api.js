// Test script to help diagnose the preferences API issue
const axios = require("axios");

const BASE_URL = "http://localhost:5000";
const USER_ID = "adm0001";

console.log("🔍 Diagnosing User Preferences API Issue");
console.log("=========================================\n");

// Test 1: Check if server is running
const testServerHealth = async () => {
  try {
    console.log("1️⃣ Testing server health...");
    const response = await axios.get(`${BASE_URL}/`);
    console.log("✅ Server is running");
    console.log(`   Status: ${response.status}`);
    console.log(`   Data: ${JSON.stringify(response.data)}\n`);
    return true;
  } catch (error) {
    console.log("❌ Server is not running or not accessible");
    console.log(`   Error: ${error.message}\n`);
    return false;
  }
};

// Test 2: Check GET preferences options
const testGetOptions = async () => {
  try {
    console.log("2️⃣ Testing GET /api/users/preferences/options...");
    const response = await axios.get(
      `${BASE_URL}/api/users/preferences/options`
    );
    console.log("✅ GET preferences options successful");
    console.log(`   Status: ${response.status}`);
    console.log(`   Languages: ${response.data.languages.length}`);
    console.log(`   Currencies: ${response.data.currencies.length}\n`);
    return true;
  } catch (error) {
    console.log("❌ GET preferences options failed");
    console.log(`   Error: ${error.message}`);
    console.log(`   Status: ${error.response?.status}`);
    console.log(`   Data: ${JSON.stringify(error.response?.data)}\n`);
    return false;
  }
};

// Test 3: Check if user exists
const testUserExists = async (userId) => {
  try {
    console.log(`3️⃣ Testing if user ${userId} exists...`);
    const response = await axios.get(`${BASE_URL}/api/users/${userId}`);
    console.log("✅ User exists");
    console.log(`   Status: ${response.status}`);
    console.log(`   User: ${response.data.username || "N/A"}\n`);
    return true;
  } catch (error) {
    console.log(`❌ User ${userId} not found or error occurred`);
    console.log(`   Error: ${error.message}`);
    console.log(`   Status: ${error.response?.status}`);
    console.log(`   Data: ${JSON.stringify(error.response?.data)}\n`);
    return false;
  }
};

// Test 4: Test PATCH preferences (the failing endpoint)
const testPatchPreferences = async (userId) => {
  try {
    console.log(`4️⃣ Testing PATCH /api/users/${userId}/preferences...`);

    const requestData = {
      language: "si",
    };

    console.log(`   Request body: ${JSON.stringify(requestData)}`);

    const response = await axios.patch(
      `${BASE_URL}/api/users/${userId}/preferences`,
      requestData,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ PATCH preferences successful");
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.data, null, 2)}\n`);
    return true;
  } catch (error) {
    console.log(`❌ PATCH preferences failed`);
    console.log(`   Error: ${error.message}`);
    console.log(`   Status: ${error.response?.status}`);
    console.log(
      `   Response: ${JSON.stringify(error.response?.data, null, 2)}`
    );

    if (error.code === "ECONNREFUSED") {
      console.log("   💡 Hint: Server might not be running on port 5000");
    } else if (error.response?.status === 404) {
      console.log(
        "   💡 Hint: Route might not be registered or user not found"
      );
    } else if (error.response?.status === 400) {
      console.log("   💡 Hint: Invalid request data");
    }
    console.log("");
    return false;
  }
};

// Test 5: Test with both language and currency
const testPatchBothPreferences = async (userId) => {
  try {
    console.log(`5️⃣ Testing PATCH with both language and currency...`);

    const requestData = {
      language: "en",
      currency: "LKR",
    };

    console.log(`   Request body: ${JSON.stringify(requestData)}`);

    const response = await axios.patch(
      `${BASE_URL}/api/users/${userId}/preferences`,
      requestData,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ PATCH both preferences successful");
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.data, null, 2)}\n`);
    return true;
  } catch (error) {
    console.log(`❌ PATCH both preferences failed`);
    console.log(`   Error: ${error.message}`);
    console.log(`   Status: ${error.response?.status}`);
    console.log(
      `   Response: ${JSON.stringify(error.response?.data, null, 2)}\n`
    );
    return false;
  }
};

// Run all tests
const runDiagnostics = async () => {
  console.log(`🎯 Target URL: ${BASE_URL}/api/users/${USER_ID}/preferences`);
  console.log(`🔍 Testing with user ID: ${USER_ID}\n`);

  const serverRunning = await testServerHealth();
  if (!serverRunning) {
    console.log("🚨 Cannot proceed - server is not running");
    console.log("💡 Please start the server with: npm run dev");
    return;
  }

  await testGetOptions();
  await testUserExists(USER_ID);
  await testPatchPreferences(USER_ID);
  await testPatchBothPreferences(USER_ID);

  console.log("🏁 Diagnostics complete!");
  console.log("\n📋 If tests pass but you still have issues:");
  console.log("   1. Check browser console for CORS errors");
  console.log("   2. Verify JWT token if authentication is required");
  console.log("   3. Check network tab in browser dev tools");
  console.log("   4. Try the exact same request with Postman");
};

// Handle axios errors
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === "ENOTFOUND") {
      error.message = "Cannot connect to server - check if server is running";
    }
    return Promise.reject(error);
  }
);

// Run the diagnostics
runDiagnostics().catch(console.error);
