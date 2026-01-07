import { hashPassword, verifyPassword, signToken, verifyToken } from "../src/framework/Auth";

// Mock environment variable
process.env.JWT_SECRET = "test-secret-key";

describe("Auth", () => {
  describe("hashPassword", () => {
    it("should hash a password", async () => {
      const plain = "mysecretpassword";
      const hash = await hashPassword(plain);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(plain);
      expect(hash.length).toBeGreaterThan(0);
    });

    it("should generate different hashes for same password", async () => {
      const plain = "mysecretpassword";
      const hash1 = await hashPassword(plain);
      const hash2 = await hashPassword(plain);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe("verifyPassword", () => {
    it("should verify a correct password", async () => {
      const plain = "mysecretpassword";
      const hash = await hashPassword(plain);
      const isValid = await verifyPassword(plain, hash);

      expect(isValid).toBe(true);
    });

    it("should reject an incorrect password", async () => {
      const plain = "mysecretpassword";
      const hash = await hashPassword(plain);
      const isValid = await verifyPassword("wrongpassword", hash);

      expect(isValid).toBe(false);
    });
  });

  describe("signToken", () => {
    it("should sign a token with payload", () => {
      const payload = { userId: 1, email: "test@example.com" };
      const token = signToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".").length).toBe(3); // JWT has 3 parts
    });
  });

  describe("verifyToken", () => {
    it("should verify a valid token", () => {
      const payload = { userId: 1, email: "test@example.com" };
      const token = signToken(payload);
      const decoded = verifyToken(token) as { userId: number; email: string };

      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
    });

    it("should throw on invalid token", () => {
      expect(() => verifyToken("invalid-token")).toThrow();
    });
  });
});
