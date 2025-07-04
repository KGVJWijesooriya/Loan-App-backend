const request = require("supertest");
const createApp = require("../app");
const { connectDB, disconnectDB } = require("../config/database");
const Customer = require("../models/Customer");
const Loan = require("../models/Loan");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const config = require("../config/config");

describe("Reports Controller", () => {
  let app;
  let authToken;
  let testUser;
  let testCustomer;
  let testLoan;

  beforeAll(async () => {
    app = createApp();
    await connectDB();

    // Create test user
    testUser = new User({
      fullName: "Test Report User",
      email: "reportuser@test.com",
      password: "password123",
      role: "admin",
    });
    await testUser.save();

    // Generate auth token
    authToken = jwt.sign({ userId: testUser.userId }, config.JWT_SECRET);

    // Create test customer
    testCustomer = new Customer({
      fullName: "Test Customer",
      nic: "123456789V",
      phone: "+94771234567",
      address: "Test Address",
      email: "customer@test.com",
    });
    await testCustomer.save();

    // Create test loan
    testLoan = new Loan({
      customer: testCustomer._id,
      amount: 100000,
      paymentMethod: "daily",
      duration: 30,
      interestRate: 10,
      totalAmount: 110000,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      paymentHistory: [
        {
          date: new Date(),
          amount: 5000,
          method: "cash",
          notes: "First payment",
        },
      ],
      paidAmount: 5000,
      remainingAmount: 105000,
    });
    await testLoan.save();
  });

  afterAll(async () => {
    await Customer.deleteMany({});
    await Loan.deleteMany({});
    await User.deleteMany({});
    await disconnectDB();
  });

  describe("GET /api/reports/business-report", () => {
    it("should generate business report in JSON format", async () => {
      const response = await request(app)
        .get("/api/reports/business-report")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("reportData");
      expect(response.body.data.reportData).toHaveProperty("customerStats");
      expect(response.body.data.reportData).toHaveProperty("loanStats");
      expect(response.body.data.reportData).toHaveProperty("financialStats");
      expect(response.body.data).toHaveProperty("dateRange");
      expect(response.body.data).toHaveProperty("generatedAt");
    });

    it("should generate business report with custom date range", async () => {
      const startDate = "2024-01-01";
      const endDate = "2024-12-31";

      const response = await request(app)
        .get(
          `/api/reports/business-report?startDate=${startDate}&endDate=${endDate}`
        )
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.dateRange.start).toBe(
        `${startDate}T00:00:00.000Z`
      );
      expect(response.body.data.dateRange.end).toBe(`${endDate}T23:59:59.999Z`);
    });

    it("should generate business report in PDF format", async () => {
      const response = await request(app)
        .get("/api/reports/business-report?format=pdf")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.headers["content-type"]).toBe("application/pdf");
      expect(response.headers["content-disposition"]).toContain(
        "business-report"
      );
      expect(Buffer.isBuffer(response.body)).toBe(true);
    });

    it("should require authentication", async () => {
      await request(app).get("/api/reports/business-report").expect(401);
    });
  });

  describe("GET /api/reports/customer-report", () => {
    it("should generate customer report in JSON format", async () => {
      const response = await request(app)
        .get("/api/reports/customer-report")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("customerData");
      expect(response.body.data.customerData).toHaveProperty("customerStats");
      expect(response.body.data.customerData).toHaveProperty("customerGrowth");
      expect(response.body.data.customerData).toHaveProperty(
        "customersByStatus"
      );
    });

    it("should generate customer report in PDF format", async () => {
      const response = await request(app)
        .get("/api/reports/customer-report?format=pdf")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.headers["content-type"]).toBe("application/pdf");
      expect(response.headers["content-disposition"]).toContain(
        "customer-report"
      );
    });
  });

  describe("GET /api/reports/loan-performance", () => {
    it("should generate loan performance report in JSON format", async () => {
      const response = await request(app)
        .get("/api/reports/loan-performance")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("loanData");
      expect(response.body.data.loanData).toHaveProperty("loanStats");
      expect(response.body.data.loanData).toHaveProperty("performanceMetrics");
      expect(response.body.data.loanData).toHaveProperty("repaymentAnalysis");
    });

    it("should generate loan performance report in PDF format", async () => {
      const response = await request(app)
        .get("/api/reports/loan-performance?format=pdf")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.headers["content-type"]).toBe("application/pdf");
      expect(response.headers["content-disposition"]).toContain(
        "loan-performance-report"
      );
    });
  });

  describe("GET /api/reports/financial-summary", () => {
    it("should generate financial summary report in JSON format", async () => {
      const response = await request(app)
        .get("/api/reports/financial-summary")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("financialData");
      expect(response.body.data.financialData).toHaveProperty("financialStats");
      expect(response.body.data.financialData).toHaveProperty("cashFlow");
      expect(response.body.data.financialData).toHaveProperty("profitability");
    });

    it("should generate financial summary report in PDF format", async () => {
      const response = await request(app)
        .get("/api/reports/financial-summary?format=pdf")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.headers["content-type"]).toBe("application/pdf");
      expect(response.headers["content-disposition"]).toContain(
        "financial-summary-report"
      );
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid date format gracefully", async () => {
      const response = await request(app)
        .get("/api/reports/business-report?startDate=invalid-date")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200); // Should still work with default date range

      expect(response.body.success).toBe(true);
    });

    it("should handle database errors gracefully", async () => {
      // This test would require mocking database failures
      // For now, we'll just ensure the endpoint exists and responds
      const response = await request(app)
        .get("/api/reports/business-report")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
