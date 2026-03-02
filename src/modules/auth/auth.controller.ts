import { Request, Response } from "express";
import * as authService from "./auth.service.js";

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, password, role, branchId } = req.body;
    const user = await authService.register(name, email, password, role, branchId);
    res.status(201).json(user);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Registration failed";
    if (message === "Email already registered") {
      res.status(409).json({ error: message });
      return;
    }
    res.status(400).json({ error: message });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Login failed";
    if (message === "Invalid email or password") {
      res.status(401).json({ error: message });
      return;
    }
    res.status(400).json({ error: message });
  }
}
