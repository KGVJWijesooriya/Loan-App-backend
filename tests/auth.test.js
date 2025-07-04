const request = require("supertest");
const createApp = require("../app");
const User = require("../models/User");

const app = createApp();

describe("Auth Endpoints", () => {
  describe("POST /api/auth/register", () => {
    it("should register a new user", async () => {
      const userData = {
        username: "testuser",
        password: "testpass123",
      };
      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(201);
      expect(response.body.message).toMatch(/registered/i);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.language).toBe("en"); // Default language
      expect(response.body.user.currency).toBe("USD"); // Default currency
    });

    it("should register a new user with language and currency preferences", async () => {
      const userData = {
        username: "testuser2",
        password: "testpass123",
        name: "Test User",
        email: "test@example.com",
        language: "si",
        currency: "LKR",
      };
      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(201);
      expect(response.body.message).toMatch(/registered/i);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.language).toBe("si");
      expect(response.body.user.currency).toBe("LKR");
      expect(response.body.user.name).toBe("Test User");
      expect(response.body.user.email).toBe("test@example.com");
    });

    it("should reject invalid language selection", async () => {
      const userData = {
        username: "testuser3",
        password: "testpass123",
        language: "invalid_lang",
      };
      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(400);
      expect(response.body.message).toMatch(/invalid language/i);
    });

    it("should reject invalid currency selection", async () => {
      const userData = {
        username: "testuser4",
        password: "testpass123",
        currency: "INVALID",
      };
      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(400);
      expect(response.body.message).toMatch(/invalid currency/i);
    });

    it("should not allow duplicate usernames", async () => {
      const userData = {
        username: "testuser",
        password: "testpass123",
      };
      await User.create({
        username: userData.username,
        password: userData.password,
      });
      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(409);
      expect(response.body.message).toMatch(/already exists/i);
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      await User.create({
        username: "loginuser",
        password: await require("bcrypt").hash("loginpass", 10),
      });
    });
    it("should login with correct credentials", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({ username: "loginuser", password: "loginpass" })
        .expect(200);
      expect(response.body.token).toBeDefined();
    });
    it("should not login with wrong password", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({ username: "loginuser", password: "wrongpass" })
        .expect(401);
      expect(response.body.message).toMatch(/invalid/i);
    });
  });
});
