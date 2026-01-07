import type { Request, Response } from "express";

/**
 * GET /homes (or configure as root route)
 * Display the home page.
 */
export async function index(req: Request, res: Response): Promise<void> {
  res.render("index", { title: "Welcome" });
}
