import { Request, Response } from "express";
import * as adminService from "./admin.service.js";

export async function getPlatformStats(_req: Request, res: Response): Promise<void> {
  try {
    const stats = await adminService.getPlatformStats();
    res.json(stats);
  } catch {
    res.status(500).json({ error: "Failed to fetch platform stats" });
  }
}

export async function getOrganizations(req: Request, res: Response): Promise<void> {
  try {
    const { page, limit, search, status } = req.query as Record<string, string | undefined>;
    const result = await adminService.getOrganizations({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search,
      status: status as "active" | "suspended" | "trial" | "inactive" | undefined,
    });
    res.json(result);
  } catch {
    res.status(500).json({ error: "Failed to fetch organizations" });
  }
}

export async function getOrganizationById(req: Request, res: Response): Promise<void> {
  const org = await adminService.getOrganizationById(req.params.id);
  if (!org) {
    res.status(404).json({ error: "Organization not found" });
    return;
  }
  res.json(org);
}

export async function updateOrganization(req: Request, res: Response): Promise<void> {
  const org = await adminService.updateOrganization(req.params.id, req.body);
  if (!org) {
    res.status(404).json({ error: "Organization not found" });
    return;
  }
  res.json(org);
}

export async function updateOrganizationStatus(req: Request, res: Response): Promise<void> {
  const { status } = req.body as { status: string };
  const validStatuses = ["active", "suspended", "trial", "inactive"];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
    return;
  }
  const org = await adminService.updateOrganizationStatus(
    req.params.id,
    status as "active" | "suspended" | "trial" | "inactive"
  );
  if (!org) {
    res.status(404).json({ error: "Organization not found" });
    return;
  }
  res.json(org);
}
