import { Request, Response } from "express";
import * as svc from "./suppliers.service.js";
import { getOrgId } from "../../middlewares/tenant.middleware.js";

export async function getSuppliers(req: Request, res: Response): Promise<void> {
  try {
    const orgId = getOrgId(req);
    if (!orgId) { res.status(403).json({ error: "Organization context required" }); return; }
    const { page, limit, search, status } = req.query;
    const result = await svc.getSuppliers({
      organizationId: orgId,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search: search as string | undefined,
      status: status as string | undefined,
    });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to fetch suppliers" });
  }
}

export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const orgId = getOrgId(req);
    if (!orgId) { res.status(403).json({ error: "Organization context required" }); return; }
    const supplier = await svc.getById(req.params.id, orgId);
    if (!supplier) { res.status(404).json({ error: "Supplier not found" }); return; }
    res.json(supplier);
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to fetch supplier" });
  }
}

export async function create(req: Request, res: Response): Promise<void> {
  try {
    const orgId = getOrgId(req);
    if (!orgId) { res.status(403).json({ error: "Organization context required" }); return; }
    const { name } = req.body;
    if (!name || !name.trim()) { res.status(400).json({ error: "Supplier name is required" }); return; }
    const supplier = await svc.create(req.body, orgId);
    res.status(201).json(supplier);
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : "Failed to create supplier" });
  }
}

export async function update(req: Request, res: Response): Promise<void> {
  try {
    const orgId = getOrgId(req);
    if (!orgId) { res.status(403).json({ error: "Organization context required" }); return; }
    const supplier = await svc.update(req.params.id, req.body, orgId);
    if (!supplier) { res.status(404).json({ error: "Supplier not found" }); return; }
    res.json(supplier);
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : "Failed to update supplier" });
  }
}

export async function remove(req: Request, res: Response): Promise<void> {
  try {
    const orgId = getOrgId(req);
    if (!orgId) { res.status(403).json({ error: "Organization context required" }); return; }
    const deleted = await svc.remove(req.params.id, orgId);
    if (!deleted) { res.status(404).json({ error: "Supplier not found" }); return; }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to delete supplier" });
  }
}
