#!/usr/bin/env node

/**
 * Reports API Test Script
 *
 * This script demonstrates how to call the Reports API endpoints
 * and shows the actual response structures.
 *
 * Usage:
 * 1. Make sure your server is running (npm run dev)
 * 2. Set your JWT token in the TOKEN variable below
 * 3. Run: node test-reports-api.js
 */

const axios = require("axios");

// Configuration
const BASE_URL = "http://localhost:5000";
const TOKEN = "YOUR_JWT_TOKEN_HERE"; // Replace with actual JWT token

// Set up axios defaults
axios.defaults.baseURL = BASE_URL;
axios.defaults.headers.common["Authorization"] = `Bearer ${TOKEN}`;

// Helper function to make API calls and display results
async function testEndpoint(name, endpoint, params = {}) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Testing: ${name}`);
  console.log(`Endpoint: GET ${endpoint}`);
  console.log(`Params:`, params);
  console.log(`${"=".repeat(60)}`);

  try {
    const response = await axios.get(endpoint, { params });

    console.log(`✅ Status: ${response.status}`);
    console.log(`📄 Response Body:`);
    console.log(JSON.stringify(response.data, null, 2));

    return response.data;
  } catch (error) {
    console.log(`❌ Error: ${error.response?.status || "Network Error"}`);
    console.log(`📄 Error Response:`);
    console.log(
      JSON.stringify(error.response?.data || { error: error.message }, null, 2)
    );

    return null;
  }
}

// Helper function to test PDF download
async function testPDFDownload(name, endpoint, params = {}) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Testing PDF Download: ${name}`);
  console.log(`Endpoint: GET ${endpoint}`);
  console.log(`Params:`, params);
  console.log(`${"=".repeat(60)}`);

  try {
    const response = await axios.get(endpoint, {
      params,
      responseType: "arraybuffer",
    });

    console.log(`✅ Status: ${response.status}`);
    console.log(`📄 Content-Type: ${response.headers["content-type"]}`);
    console.log(
      `📁 Content-Disposition: ${response.headers["content-disposition"]}`
    );
    console.log(`📊 Data Size: ${response.data.length} bytes`);
    console.log(
      `🔍 PDF Buffer Preview: ${response.data.slice(0, 50).toString("hex")}...`
    );

    return response;
  } catch (error) {
    console.log(`❌ Error: ${error.response?.status || "Network Error"}`);
    console.log(`📄 Error Response:`);
    console.log(
      JSON.stringify(error.response?.data || { error: error.message }, null, 2)
    );

    return null;
  }
}

// Main test function
async function runTests() {
  console.log("🚀 Starting Reports API Tests");
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Using Token: ${TOKEN.substring(0, 20)}...`);

  // Test 1: Business Report (JSON)
  await testEndpoint("Business Report (JSON)", "/api/reports/business-report");

  // Test 2: Business Report with Date Range
  await testEndpoint(
    "Business Report with Date Range",
    "/api/reports/business-report",
    {
      startDate: "2024-01-01",
      endDate: "2024-12-31",
    }
  );

  // Test 3: Customer Report (JSON)
  await testEndpoint("Customer Report (JSON)", "/api/reports/customer-report");

  // Test 4: Loan Performance Report (JSON)
  await testEndpoint(
    "Loan Performance Report (JSON)",
    "/api/reports/loan-performance"
  );

  // Test 5: Financial Summary Report (JSON)
  await testEndpoint(
    "Financial Summary Report (JSON)",
    "/api/reports/financial-summary"
  );

  // Test 6: Business Report (PDF)
  await testPDFDownload(
    "Business Report (PDF)",
    "/api/reports/business-report",
    { format: "pdf" }
  );

  // Test 7: Customer Report (PDF)
  await testPDFDownload(
    "Customer Report (PDF)",
    "/api/reports/customer-report",
    { format: "pdf" }
  );

  // Test 8: Test without authentication (should fail)
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Testing: Authentication Required (Should Fail)`);
  console.log(`${"=".repeat(60)}`);

  try {
    // Remove auth header temporarily
    delete axios.defaults.headers.common["Authorization"];

    const response = await axios.get("/api/reports/business-report");
    console.log(`❌ Unexpected success: ${response.status}`);
  } catch (error) {
    console.log(`✅ Expected failure: ${error.response?.status}`);
    console.log(`📄 Error Response:`);
    console.log(JSON.stringify(error.response?.data, null, 2));
  }

  // Restore auth header
  axios.defaults.headers.common["Authorization"] = `Bearer ${TOKEN}`;

  console.log(`\n${"=".repeat(60)}`);
  console.log("✅ All tests completed!");
  console.log(`${"=".repeat(60)}\n`);
}

// Sample responses for documentation
const SAMPLE_RESPONSES = {
  businessReport: {
    success: true,
    data: {
      reportData: {
        customerStats: {
          totalCustomers: 150,
          activeCustomers: 140,
          newCustomers: 25,
          inactiveCustomers: 10,
        },
        loanStats: {
          totalLoans: 300,
          activeLoans: 200,
          completedLoans: 90,
          overdueLoans: 10,
          newLoans: 45,
        },
        financialStats: {
          totalLoanAmount: 5000000,
          activeLoanAmount: 3000000,
          totalRepayments: 2500000,
          outstandingAmount: 2500000,
          recentCollections: 150000,
        },
        paymentMethodStats: [
          { _id: "daily", count: 180 },
          { _id: "weekly", count: 80 },
          { _id: "monthly", count: 40 },
        ],
        loanStatusStats: [
          { _id: "active", count: 200 },
          { _id: "completed", count: 90 },
          { _id: "overdue", count: 10 },
        ],
        monthlyTrends: [
          {
            _id: { year: 2024, month: 1 },
            totalLoans: 25,
            totalAmount: 1250000,
          },
        ],
        overdueAnalysis: [
          {
            _id: null,
            totalOverdueAmount: 250000,
            averageDaysPastDue: 15.5,
            count: 10,
          },
        ],
        topCustomers: [
          {
            _id: "60f1b2b5a1b1c12d3e4f5g6h",
            customerName: "John Doe",
            customerId: "CUST001",
            totalLoans: 5,
            totalAmount: 500000,
            totalPaid: 400000,
          },
        ],
      },
      dateRange: {
        start: "2024-06-04T00:00:00.000Z",
        end: "2024-07-04T23:59:59.999Z",
      },
      generatedAt: "2025-07-04T10:30:00.000Z",
    },
  },
};

// Show sample response if token not configured
if (TOKEN === "YOUR_JWT_TOKEN_HERE") {
  console.log("⚠️  Please set your JWT token in the TOKEN variable");
  console.log("📋 Here's a sample response structure:");
  console.log(JSON.stringify(SAMPLE_RESPONSES.businessReport, null, 2));
  console.log("\n🔧 To get a token:");
  console.log("1. POST /api/auth/login with username and password");
  console.log("2. Copy the token from the response");
  console.log("3. Set it in the TOKEN variable in this script");
} else {
  // Run the actual tests
  runTests().catch(console.error);
}

module.exports = {
  testEndpoint,
  testPDFDownload,
  SAMPLE_RESPONSES,
};
