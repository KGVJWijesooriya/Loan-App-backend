const request = require("supertest");
const createApp = require("../app");
const User = require("../models/User");
const bcrypt = require("bcrypt");

const app = createApp();

describe("User Preferences API", () => {
  let testUser;

  beforeEach(async () => {
    // Create a test user
    const hashedPassword = await bcrypt.hash("testpass123", 10);
    testUser = new User({
      username: "testuser",
      password: hashedPassword,
      name: "Test User",
      email: "test@example.com",
      language: "en",
      currency: "USD",
      theme: "light",
    });
    await testUser.save();
  });

  describe("PATCH /api/users/:id/preferences", () => {
    it("should update user language preference", async () => {
      const updateData = {
        language: "si",
      };

      const response = await request(app)
        .patch(`/api/users/${testUser.userId}/preferences`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toMatch(/updated successfully/i);
      expect(response.body.data.language).toBe("si");
      expect(response.body.data.currency).toBe("USD"); // Should remain unchanged
      expect(response.body.data.theme).toBe("light"); // Should remain unchanged
      expect(response.body.data.userId).toBe(testUser.userId);
    });

    it("should update user currency preference", async () => {
      const updateData = {
        currency: "LKR",
      };

      const response = await request(app)
        .patch(`/api/users/${testUser.userId}/preferences`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.currency).toBe("LKR");
      expect(response.body.data.language).toBe("en"); // Should remain unchanged
      expect(response.body.data.theme).toBe("light"); // Should remain unchanged
    });

    it("should update both language and currency", async () => {
      const updateData = {
        language: "si",
        currency: "LKR",
      };

      const response = await request(app)
        .patch(`/api/users/${testUser.userId}/preferences`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.language).toBe("si");
      expect(response.body.data.currency).toBe("LKR");
      expect(response.body.data.theme).toBe("light"); // Should remain unchanged
    });

    it("should update user theme preference", async () => {
      const updateData = {
        theme: "dark",
      };

      const response = await request(app)
        .patch(`/api/users/${testUser.userId}/preferences`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.theme).toBe("dark");
      expect(response.body.data.language).toBe("en"); // Should remain unchanged
      expect(response.body.data.currency).toBe("USD"); // Should remain unchanged
    });

    it("should update all preferences together", async () => {
      const updateData = {
        language: "si",
        currency: "LKR",
        theme: "dark",
      };

      const response = await request(app)
        .patch(`/api/users/${testUser.userId}/preferences`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.language).toBe("si");
      expect(response.body.data.currency).toBe("LKR");
      expect(response.body.data.theme).toBe("dark");
    });

    it("should reject invalid language", async () => {
      const updateData = {
        language: "fr",
      };

      const response = await request(app)
        .patch(`/api/users/${testUser.userId}/preferences`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/invalid language/i);
    });

    it("should reject invalid currency", async () => {
      const updateData = {
        currency: "EUR",
      };

      const response = await request(app)
        .patch(`/api/users/${testUser.userId}/preferences`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/invalid currency/i);
    });

    it("should reject invalid theme", async () => {
      const updateData = {
        theme: "blue",
      };

      const response = await request(app)
        .patch(`/api/users/${testUser.userId}/preferences`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/invalid theme/i);
    });

    it("should reject empty update data", async () => {
      const response = await request(app)
        .patch(`/api/users/${testUser.userId}/preferences`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(
        /provide language, currency, or theme/i
      );
    });

    it("should return 404 for non-existent user", async () => {
      const updateData = {
        language: "si",
      };

      const response = await request(app)
        .patch("/api/users/nonexistent0001/preferences")
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/user not found/i);
    });
  });

  describe("GET /api/users/preferences/options", () => {
    it("should return available language and currency options", async () => {
      const response = await request(app)
        .get("/api/users/preferences/options")
        .expect(200);

      expect(response.body.languages).toBeDefined();
      expect(response.body.currencies).toBeDefined();
      expect(response.body.themes).toBeDefined();
      expect(response.body.languages).toHaveLength(2);
      expect(response.body.currencies).toHaveLength(2);
      expect(response.body.themes).toHaveLength(2);

      // Check language options
      expect(response.body.languages).toEqual(
        expect.arrayContaining([
          { code: "en", name: "English" },
          { code: "si", name: "සිංහල" },
        ])
      );

      // Check currency options
      expect(response.body.currencies).toEqual(
        expect.arrayContaining([
          { code: "USD", name: "US Dollar", symbol: "$" },
          { code: "LKR", name: "Sri Lankan Rupee", symbol: "Rs" },
        ])
      );

      // Check theme options
      expect(response.body.themes).toEqual(
        expect.arrayContaining([
          { code: "light", name: "Light Theme" },
          { code: "dark", name: "Dark Theme" },
        ])
      );
    });
  });
});
