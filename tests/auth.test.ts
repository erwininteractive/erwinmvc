import { hashPassword, verifyPassword, signToken, verifyToken, authenticate } from "../src/framework/Auth";

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

    it("should sign a token with custom expiry", () => {
      const payload = { userId: 1 };
      const token = signToken(payload, "30d");

      expect(token).toBeDefined();
    });

    it("should throw when JWT_SECRET is not set", () => {
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      expect(() => signToken({ userId: 1 })).toThrow("JWT_SECRET environment variable is not set");

      process.env.JWT_SECRET = originalSecret;
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

    it("should throw on tampered token", () => {
      const payload = { userId: 1 };
      const token = signToken(payload);
      const tamperedToken = token.split(".")[0] + "." + token.split(".")[1] + ".invalid";

      expect(() => verifyToken(tamperedToken)).toThrow();
    });

    it("should throw when JWT_SECRET is not set", () => {
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      expect(() => verifyToken("token")).toThrow("JWT_SECRET environment variable is not set");

      process.env.JWT_SECRET = originalSecret;
    });
  });

  describe("authenticate", () => {
    let mockReq: { header: jest.Mock; user?: any };
    let mockRes: { status: jest.Mock; json: jest.Mock };
    let mockNext: jest.Mock;

    beforeEach(() => {
      mockReq = { header: jest.fn() };
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      mockNext = jest.fn();
    });

    it("should reject request without Authorization header", () => {
      mockReq.header.mockReturnValue(undefined);

      authenticate(mockReq as any, mockRes as any, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Unauthorized" });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should reject request with invalid Authorization header format", () => {
      mockReq.header.mockReturnValue("InvalidToken");

      authenticate(mockReq as any, mockRes as any, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Unauthorized" });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should reject request with invalid token", () => {
      mockReq.header.mockReturnValue("Bearer invalid-token");

      authenticate(mockReq as any, mockRes as any, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Invalid token" });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should reject request when JWT_SECRET is missing", () => {
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      mockReq.header.mockReturnValue("Bearer valid-format-token");

      authenticate(mockReq as any, mockRes as any, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Invalid token" });

      process.env.JWT_SECRET = originalSecret;
    });

    it("should call next with valid token", () => {
      const payload = { userId: 1, email: "test@example.com" };
      const token = signToken(payload);
      mockReq.header.mockReturnValue(`Bearer ${token}`);

      authenticate(mockReq as any, mockRes as any, mockNext);

      expect(mockReq.user).toBeDefined();
      expect(mockReq.user!.userId).toBe(1);
      expect(mockNext).toHaveBeenCalled();
    });

    it("should attach decoded payload to req.user", () => {
      const payload = { userId: 42, role: "admin" };
      const token = signToken(payload);
      mockReq.header.mockReturnValue(`Bearer ${token}`);

      authenticate(mockReq as any, mockRes as any, mockNext);

      expect(mockReq.user!.userId).toBe(42);
      expect(mockReq.user!.role).toBe("admin");
    });
  });
});
