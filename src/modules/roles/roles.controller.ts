import { Request, Response } from "express";
import * as rolesService from "./roles.service.js";
import { getOrgId } from "../../middlewares/tenant.middleware.js";

export async function getRoles(req: Request, res: Response): Promise<void> {
  try {
    const orgId = getOrgId(req);
    const roles = await rolesService.getRoles(orgId);
    res.json(roles);
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to fetch roles" });
  }
}

export async function getRoleById(req: Request, res: Response): Promise<void> {
  try {
    const orgId = getOrgId(req);
    const role = await rolesService.getRoleById(req.params.id, orgId);
    if (!role) {
      res.status(404).json({ error: "Role not found" });
      return;
    }
    res.json(role);
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to fetch role" });
  }
}

export async function createRole(req: Request, res: Response): Promise<void> {
  try {
    const orgId = getOrgId(req);
    if (!orgId) {
      res.status(403).json({ error: "Organization context required" });
      return;
    }
    const { name, description, permissions } = req.body;
    if (!name || !permissions || !Array.isArray(permissions)) {
      res.status(400).json({ error: "name and permissions[] are required" });
      return;
    }
    const role = await rolesService.createRole({ name, description, permissions }, orgId, req.user?.sub);
    res.status(201).json(role);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to create role";
    if (msg.includes("already exists") || msg.includes("Cannot use")) {
      res.status(409).json({ error: msg });
      return;
    }
    res.status(400).json({ error: msg });
  }
}

export async function updateRole(req: Request, res: Response): Promise<void> {
  try {
    const orgId = getOrgId(req);
    if (!orgId) {
      res.status(403).json({ error: "Organization context required" });
      return;
    }
    const { name, description, permissions } = req.body;
    const role = await rolesService.updateRole(req.params.id, { name, description, permissions }, orgId, req.user?.sub);
    res.json(role);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to update role";
    if (msg === "Role not found") {
      res.status(404).json({ error: msg });
      return;
    }
    if (msg.includes("system") || msg.includes("already exists") || msg.includes("Cannot use")) {
      res.status(409).json({ error: msg });
      return;
    }
    res.status(400).json({ error: msg });
  }
}

export async function deleteRole(req: Request, res: Response): Promise<void> {
  try {
    const orgId = getOrgId(req);
    if (!orgId) {
      res.status(403).json({ error: "Organization context required" });
      return;
    }
    await rolesService.deleteRole(req.params.id, orgId, req.user?.sub);
    res.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to delete role";
    if (msg === "Role not found") {
      res.status(404).json({ error: msg });
      return;
    }
    if (msg.includes("system")) {
      res.status(403).json({ error: msg });
      return;
    }
    res.status(400).json({ error: msg });
  }
}
