import { Request, Response } from "express";
import * as authService from "./auth.service.js";
import { AppDataSource } from "../../config/data-source.js";
import { Branches } from "../../models/Branches.js";

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, password, role, branchId } = req.body;
    const organizationId = req.user?.organizationId;

    if (!organizationId && req.user?.role !== "super_admin") {
      res.status(403).json({ error: "No organization context" });
      return;
    }

    if (organizationId && branchId) {
      const branch = await AppDataSource.getRepository(Branches).findOne({
        where: { id: branchId, organizationId },
      });
      if (!branch) {
        res.status(400).json({ error: "Branch does not belong to your organization" });
        return;
      }
    }

    const user = await authService.register(name, email, password, role, branchId, organizationId || undefined);
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

export async function registerOrganization(req: Request, res: Response): Promise<void> {
  try {
    const { restaurantName, ownerName, email, password, phone, address } = req.body;
    const result = await authService.registerOrganization({
      restaurantName,
      ownerName,
      email,
      password,
      phone,
      address,
    });
    res.status(201).json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Registration failed";
    if (message === "Email already registered" || message === "Restaurant name already taken") {
      res.status(409).json({ error: message });
      return;
    }
    if (message === "Trial plan not found") {
      res.status(500).json({ error: "System configuration error" });
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
