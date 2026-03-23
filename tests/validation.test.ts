import { z, ZodError } from "zod";
import { validate, getFieldErrors, getErrors, getOldInput } from "../src/framework/Validation";

describe("Validation", () => {
  describe("validate", () => {
    it("should accept valid data", async () => {
      const schema = z.object({
        name: z.string().min(1),
        age: z.number().positive(),
      });

      const req = { body: { name: "John", age: 25 }, flash: jest.fn() };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      const middleware = validate(schema);
      await middleware(req as any, res as any, next);

      expect(next).toBeCalled();
    });

    it("should reject invalid data with JSON response", async () => {
      const schema = z.object({
        name: z.string().min(1),
        age: z.number().positive(),
      });

      const req = { body: { name: "", age: -5 }, flash: jest.fn() };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      const middleware = validate(schema, "json");
      await middleware(req as any, res as any, next);

      expect(res.status).toBeCalledWith(422);
      expect(res.json).toBeCalled();
    });

    it("should reject invalid data with redirect", async () => {
      const schema = z.object({
        name: z.string().min(1),
      });

      const req = { body: { name: "" }, headers: { referer: "/form" }, flash: jest.fn().mockReturnValue([]) };
      const res = { redirect: jest.fn() };
      const next = jest.fn();

      const middleware = validate(schema, "redirect");
      await middleware(req as any, res as any, next);

      expect(res.redirect).toHaveBeenCalledWith("/form");
    });
  });

  describe("getFieldErrors", () => {
    it("should extract field errors from ZodError", () => {
      const schema = z.object({
        email: z.string().email(),
        password: z.string().min(8),
      });
      
      const result = schema.safeParse({
        email: "invalid-email",
        password: "short",
      });

      const errors = getFieldErrors(result.error as ZodError);

      expect(errors).toHaveLength(2);
      expect(errors[0].field).toBe("email");
      expect(errors[1].field).toBe("password");
    });

    it("should handle nested field paths", () => {
      const schema = z.object({
        user: z.object({
          email: z.string().email(),
        }),
      });

      const result = schema.safeParse({
        user: { email: "invalid" },
      });

      const errors = getFieldErrors(result.error as ZodError);
      expect(errors[0].field).toBe("user.email");
    });
  });

  describe("getErrors", () => {
    it("should get flash errors", () => {
      const flashCalls: any[] = [];
      const req = { 
        flash: jest.fn((key: string) => {
          if (key === "errors") return flashCalls[0] || [];
          return [];
        })
      };

      flashCalls[0] = [{ field: "name", message: "Required" }];
      const errors = getErrors(req);
      expect(errors).toEqual([{ field: "name", message: "Required" }]);
    });

    it("should return empty array when no errors", () => {
      const req = { flash: jest.fn().mockReturnValue([]) };

      const errors = getErrors(req);
      expect(errors).toEqual([]);
    });
  });

  describe("getOldInput", () => {
    it("should get flash old input", () => {
      const req = { flash: jest.fn().mockReturnValue([{ name: "John" }]) };

      const oldInput = getOldInput(req);
      expect(oldInput).toEqual({ name: "John" });
    });

    it("should return empty object when no input", () => {
      const req = { flash: jest.fn().mockReturnValue([]) };

      const oldInput = getOldInput(req);
      expect(oldInput).toEqual({});
    });
  });
});
