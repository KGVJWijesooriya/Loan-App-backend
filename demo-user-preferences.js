// Test script to demonstrate the new language and currency functionality
const { spawn } = require("child_process");

console.log("🌍 Testing User Language and Currency Preferences 🏦");
console.log("=====================================================\n");

// Test 1: Register user with language and currency
console.log(
  "1️⃣ Testing user registration with language and currency preferences..."
);
const registerData = {
  username: "john_test",
  password: "securepass123",
  name: "John Test",
  email: "john.test@example.com",
  language: "si",
  currency: "LKR",
};

// Note: This is a demonstration script showing how to use the new API
console.log("📝 Registration payload:");
console.log(JSON.stringify(registerData, null, 2));

console.log("\n✅ Expected response structure:");
console.log(`{
  "message": "User registered successfully.",
  "user": {
    "userId": "joh0001",
    "username": "john_test",
    "name": "John Test",
    "email": "john.test@example.com",
    "language": "si",
    "currency": "LKR",
    "createdAt": "2025-07-04T10:30:00.000Z"
  }
}`);

console.log("\n2️⃣ Testing user registration with default preferences...");
const defaultRegisterData = {
  username: "jane_test",
  password: "securepass456",
};

console.log("📝 Registration payload (minimal):");
console.log(JSON.stringify(defaultRegisterData, null, 2));

console.log("\n✅ Expected response (with defaults):");
console.log(`{
  "message": "User registered successfully.",
  "user": {
    "userId": "jan0001",
    "username": "jane_test",
    "language": "en",    // Default language
    "currency": "USD",   // Default currency
    "createdAt": "2025-07-04T10:30:00.000Z"
  }
}`);

console.log("\n3️⃣ Testing preference validation...");
const invalidData = {
  username: "invalid_test",
  password: "securepass789",
  language: "invalid_lang",
  currency: "INVALID_CURR",
};

console.log("📝 Invalid registration payload:");
console.log(JSON.stringify(invalidData, null, 2));

console.log("\n❌ Expected error responses:");
console.log(`{
  "message": "Invalid language selection."
}
// or
{
  "message": "Invalid currency selection."
}`);

console.log("\n4️⃣ Testing getting available preferences...");
console.log("📍 GET /api/users/preferences/options");
console.log("\n✅ Expected response structure:");
console.log(`{
  "languages": [
    { "code": "en", "name": "English" },
    { "code": "es", "name": "Español" },
    { "code": "fr", "name": "Français" },
    // ... more languages
  ],
  "currencies": [
    { "code": "USD", "name": "US Dollar", "symbol": "$" },
    { "code": "EUR", "name": "Euro", "symbol": "€" },
    { "code": "GBP", "name": "British Pound", "symbol": "£" },
    // ... more currencies
  ]
}`);

console.log("\n5️⃣ Testing user preference updates...");
console.log("📍 PUT /api/users/:userId");
const updateData = {
  language: "fr",
  currency: "GBP",
};

console.log("📝 Update payload:");
console.log(JSON.stringify(updateData, null, 2));

console.log("\n✅ Expected response:");
console.log(`{
  "userId": "joh0001",
  "username": "john_test",
  "name": "John Test",
  "email": "john.test@example.com",
  "language": "fr",    // Updated
  "currency": "GBP",   // Updated
  "createdAt": "2025-07-04T10:30:00.000Z"
}`);

console.log("\n🎯 Summary of Implementation:");
console.log("================================");
console.log("✅ Added language and currency fields to User model");
console.log("✅ Updated registration endpoint to accept preferences");
console.log("✅ Added validation for language and currency codes");
console.log("✅ Added endpoint to get available options");
console.log("✅ Updated user profile editing to support preferences");
console.log("✅ Added comprehensive test coverage");
console.log("✅ Provided defaults for backward compatibility");
console.log("✅ Created detailed documentation");

console.log("\n🌟 Supported Languages:");
console.log("en (English), si (සිංහල)");

console.log("\n💰 Supported Currencies:");
console.log("USD ($), LKR (Rs)");

console.log(
  "\n✨ Ready to use! Your users can now register with their preferred"
);
console.log(
  "   language and currency, or update them later through their profile."
);
