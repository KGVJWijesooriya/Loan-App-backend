const request = require("supertest");
const createApp = require("../app");
const Customer = require("../models/Customer");

const app = createApp();

describe("Customer Controller", () => {
  describe("POST /api/customers", () => {
    it("should create a new customer", async () => {
      const customerData = {
        fullName: "John Doe",
        nic: "123456789V",
        phone: "+94771234567",
        address: "123 Main St, Colombo",
        email: "john@example.com",
      };

      const response = await request(app)
        .post("/api/customers")
        .send(customerData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.fullName).toBe(customerData.fullName);
      expect(response.body.data.nic).toBe(customerData.nic);
    });

    it("should return validation error for invalid NIC", async () => {
      const customerData = {
        fullName: "John Doe",
        nic: "invalid-nic",
        phone: "+94771234567",
      };

      const response = await request(app)
        .post("/api/customers")
        .send(customerData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("nic");
    });

    it("should return validation error for duplicate NIC", async () => {
      const customerData = {
        fullName: "John Doe",
        nic: "123456789V",
        phone: "+94771234567",
      };

      // Create first customer
      await Customer.create(customerData);

      // Try to create duplicate
      const response = await request(app)
        .post("/api/customers")
        .send({
          ...customerData,
          fullName: "Jane Doe",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/customers", () => {
    beforeEach(async () => {
      await Customer.create([
        {
          fullName: "John Doe",
          nic: "123456789V",
          phone: "+94771234567",
        },
        {
          fullName: "Jane Smith",
          nic: "987654321X",
          phone: "+94771234568",
        },
      ]);
    });

    it("should get all customers", async () => {
      const response = await request(app).get("/api/customers").expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination).toBeDefined();
    });

    it("should search customers by name", async () => {
      const response = await request(app)
        .get("/api/customers?search=John")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].fullName).toBe("John Doe");
    });

    it("should paginate customers", async () => {
      const response = await request(app)
        .get("/api/customers?page=1&limit=1")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.pagination.totalPages).toBe(2);
    });
  });

  describe("GET /api/customers/:id", () => {
    let customer;

    beforeEach(async () => {
      customer = await Customer.create({
        fullName: "John Doe",
        nic: "123456789V",
        phone: "+94771234567",
      });
    });

    it("should get customer by id", async () => {
      const response = await request(app)
        .get(`/api/customers/${customer._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.customer.fullName).toBe("John Doe");
      expect(response.body.data.loans).toBeDefined();
    });

    it("should return 404 for non-existent customer", async () => {
      const nonExistentId = "507f1f77bcf86cd799439011";
      const response = await request(app)
        .get(`/api/customers/${nonExistentId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe("PUT /api/customers/:id", () => {
    let customer;

    beforeEach(async () => {
      customer = await Customer.create({
        fullName: "John Doe",
        nic: "123456789V",
        phone: "+94771234567",
      });
    });

    it("should update customer", async () => {
      const updateData = {
        fullName: "John Smith",
        address: "456 Oak St, Colombo",
      };

      const response = await request(app)
        .put(`/api/customers/${customer._id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.fullName).toBe("John Smith");
      expect(response.body.data.address).toBe("456 Oak St, Colombo");
    });
  });

  describe("DELETE /api/customers/:id", () => {
    let customer;

    beforeEach(async () => {
      customer = await Customer.create({
        fullName: "John Doe",
        nic: "123456789V",
        phone: "+94771234567",
      });
    });

    it("should delete customer", async () => {
      const response = await request(app)
        .delete(`/api/customers/${customer._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify customer is deleted
      const deletedCustomer = await Customer.findById(customer._id);
      expect(deletedCustomer).toBeNull();
    });
  });
});
