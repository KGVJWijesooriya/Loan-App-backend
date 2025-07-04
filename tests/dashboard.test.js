const request = require("supertest");
const mongoose = require("mongoose");
const createApp = require("../app");
const Customer = require("../models/Customer");
const Loan = require("../models/Loan");
const User = require("../models/User");

describe("Dashboard API", () => {
  let app;

  beforeAll(async () => {
    app = createApp();

    // Create test data
    const testCustomer = new Customer({
      fullName: "John Doe",
      nic: "123456789V",
      phone: "0771234567",
      address: "123 Main St",
      customerId: "CUST001",
      status: "active",
    });
    await testCustomer.save();

    const testLoan = new Loan({
      customer: testCustomer._id,
      amount: 10000,
      paymentMethod: "daily",
      duration: 30,
      dailyPaymentAmount: 350,
      status: "active",
      totalRepaid: 5000,
      outstandingAmount: 5000,
    });
    await testLoan.save();
  });

  afterAll(async () => {
    await Customer.deleteMany({});
    await Loan.deleteMany({});
    await User.deleteMany({});
  });

  describe("GET /api/dashboard/overview", () => {
    it("should return dashboard overview statistics", async () => {
      const res = await request(app).get("/api/dashboard/overview").expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("customers");
      expect(res.body.data).toHaveProperty("loans");
      expect(res.body.data).toHaveProperty("financials");
      expect(res.body.data).toHaveProperty("distributions");
      expect(res.body.data.customers).toHaveProperty("total");
      expect(res.body.data.loans).toHaveProperty("total");
      expect(res.body.data.financials).toHaveProperty("totalLoanAmount");
    });
  });

  describe("GET /api/dashboard/recent-activities", () => {
    it("should return recent activities", async () => {
      const res = await request(app)
        .get("/api/dashboard/recent-activities")
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("recentLoans");
      expect(res.body.data).toHaveProperty("recentCustomers");
      expect(res.body.data).toHaveProperty("recentRepayments");
      expect(Array.isArray(res.body.data.recentLoans)).toBe(true);
      expect(Array.isArray(res.body.data.recentCustomers)).toBe(true);
    });

    it("should limit results based on query parameter", async () => {
      const res = await request(app)
        .get("/api/dashboard/recent-activities?limit=5")
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.recentLoans.length).toBeLessThanOrEqual(5);
      expect(res.body.data.recentCustomers.length).toBeLessThanOrEqual(5);
    });
  });

  describe("GET /api/dashboard/financial-analytics", () => {
    it("should return financial analytics", async () => {
      const res = await request(app)
        .get("/api/dashboard/financial-analytics")
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("dailyCollections");
      expect(res.body.data).toHaveProperty("dailyDisbursements");
      expect(res.body.data).toHaveProperty("monthlyTrends");
      expect(res.body.data).toHaveProperty("riskAnalysis");
      expect(res.body.data).toHaveProperty("period");
      expect(Array.isArray(res.body.data.dailyCollections)).toBe(true);
    });

    it("should handle different period parameters", async () => {
      const res = await request(app)
        .get("/api/dashboard/financial-analytics?period=30d")
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.period).toBe("30d");
    });
  });

  describe("GET /api/dashboard/top-customers", () => {
    it("should return top customers", async () => {
      const res = await request(app)
        .get("/api/dashboard/top-customers")
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("customers");
      expect(res.body.data).toHaveProperty("sortBy");
      expect(res.body.data).toHaveProperty("total");
      expect(Array.isArray(res.body.data.customers)).toBe(true);
    });

    it("should sort by different criteria", async () => {
      const res = await request(app)
        .get("/api/dashboard/top-customers?sortBy=totalRepaid&limit=5")
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.sortBy).toBe("totalRepaid");
      expect(res.body.data.customers.length).toBeLessThanOrEqual(5);
    });
  });

  describe("GET /api/dashboard/collection-summary", () => {
    it("should return collection summary", async () => {
      const res = await request(app)
        .get("/api/dashboard/collection-summary")
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("today");
      expect(res.body.data).toHaveProperty("overdue");
      expect(res.body.data.today).toHaveProperty("collected");
      expect(res.body.data.today).toHaveProperty("expected");
      expect(res.body.data.today).toHaveProperty("efficiency");
      expect(res.body.data.overdue).toHaveProperty("amount");
      expect(res.body.data.overdue).toHaveProperty("count");
    });
  });
});
