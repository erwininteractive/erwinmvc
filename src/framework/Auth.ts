import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import type { Request, Response, NextFunction } from "express";

/**
 * Hash a plain text password using bcrypt.
 */
export async function hashPassword(plain: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
}

/**
 * Verify a plain text password against a bcrypt hash.
 */
export async function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Sign a JWT token with the given payload.
 * Token expires in 1 hour by default.
 */
export function signToken(payload: object, expiresIn: string | number = "1h"): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
}

/**
 * Verify and decode a JWT token.
 * Returns the decoded payload or throws an error if invalid.
 */
export function verifyToken(token: string): jwt.JwtPayload | string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  return jwt.verify(token, secret);
}

/**
 * Express middleware to authenticate requests using JWT Bearer tokens.
 * Attaches the decoded user payload to req.user on success.
 */
export function authenticate(
  req: Request & { user?: jwt.JwtPayload | string },
  res: Response,
  next: NextFunction
): void {
  const header = req.header("Authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}
