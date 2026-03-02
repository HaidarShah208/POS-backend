import { Request, Response } from "express";
import * as branchesService from "./branches.service.js";

export async function getAll(req: Request, res: Response): Promise<void> {
  const branches = await branchesService.getAll();
  res.json(branches);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const branch = await branchesService.getById(req.params.id);
  if (!branch) {
    res.status(404).json({ error: "Branch not found" });
    return;
  }
  res.json(branch);
}

export async function create(req: Request, res: Response): Promise<void> {
  const branch = await branchesService.create(req.body);
  res.status(201).json(branch);
}
