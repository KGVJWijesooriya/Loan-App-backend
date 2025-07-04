// Simple test to verify Jest is working
describe("Basic Setup", () => {
  test("should perform basic arithmetic", () => {
    expect(2 + 2).toBe(4);
  });

  test("should verify string operations", () => {
    expect("hello world").toContain("world");
  });

  test("should verify async operations", async () => {
    const promise = Promise.resolve("test data");
    await expect(promise).resolves.toBe("test data");
  });
});
