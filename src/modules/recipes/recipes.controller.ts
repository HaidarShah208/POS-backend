import { Request, Response } from "express";
import { getOrgId } from "../../middlewares/tenant.middleware.js";
import * as recipesService from "./recipes.service.js";

export async function getRecipes(req: Request, res: Response): Promise<void> {
  const orgId = getOrgId(req);
  if (!orgId) {
    res.status(403).json({ error: "No organization context" });
    return;
  }
  const recipes = await recipesService.getRecipes(orgId);
  res.json(recipes);
}

export async function getRecipeById(req: Request, res: Response): Promise<void> {
  const orgId = getOrgId(req);
  if (!orgId) {
    res.status(403).json({ error: "No organization context" });
    return;
  }
  const recipe = await recipesService.getRecipeById(req.params.id, orgId);
  if (!recipe) {
    res.status(404).json({ error: "Recipe not found" });
    return;
  }
  res.json(recipe);
}

export async function createRecipe(req: Request, res: Response): Promise<void> {
  const orgId = getOrgId(req);
  if (!orgId) {
    res.status(403).json({ error: "No organization context" });
    return;
  }
  try {
    const recipe = await recipesService.createRecipe(
      req.body,
      orgId,
      req.user!.sub
    );
    res.status(201).json(recipe);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create recipe";
    if (message.includes("already exists")) {
      res.status(409).json({ error: message });
      return;
    }
    res.status(400).json({ error: message });
  }
}

export async function updateRecipe(req: Request, res: Response): Promise<void> {
  const orgId = getOrgId(req);
  if (!orgId) {
    res.status(403).json({ error: "No organization context" });
    return;
  }
  try {
    const recipe = await recipesService.updateRecipe(
      req.params.id,
      req.body,
      orgId,
      req.user!.sub
    );
    res.json(recipe);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update recipe";
    if (message.includes("not found")) {
      res.status(404).json({ error: message });
      return;
    }
    res.status(400).json({ error: message });
  }
}

export async function deleteRecipe(req: Request, res: Response): Promise<void> {
  const orgId = getOrgId(req);
  if (!orgId) {
    res.status(403).json({ error: "No organization context" });
    return;
  }
  const deleted = await recipesService.deleteRecipe(
    req.params.id,
    orgId,
    req.user!.sub
  );
  if (!deleted) {
    res.status(404).json({ error: "Recipe not found" });
    return;
  }
  res.json({ success: true });
}
