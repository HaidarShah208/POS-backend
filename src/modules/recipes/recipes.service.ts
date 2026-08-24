import { AppDataSource } from "../../config/data-source.js";
import { Recipes } from "../../models/Recipes.js";
import { RecipeIngredients } from "../../models/RecipeIngredients.js";
import { InventoryItems } from "../../models/InventoryItems.js";
import { logAudit } from "../../services/audit.service.js";
import type { CreateRecipeDto, UpdateRecipeDto } from "./recipes.dto.js";

const recipeRepo = () => AppDataSource.getRepository(Recipes);

export async function getRecipes(orgId: string) {
  return recipeRepo().find({
    where: { organizationId: orgId },
    relations: ["product", "ingredients", "ingredients.inventoryItem"],
    order: { name: "ASC" },
  });
}

export async function getRecipeById(id: string, orgId: string) {
  return recipeRepo().findOne({
    where: { id, organizationId: orgId },
    relations: ["product", "ingredients", "ingredients.inventoryItem"],
  });
}

export async function getRecipeByProductId(productId: string, orgId: string) {
  return recipeRepo().findOne({
    where: { productId, organizationId: orgId },
    relations: ["product", "ingredients", "ingredients.inventoryItem"],
  });
}

export async function createRecipe(
  data: CreateRecipeDto,
  orgId: string,
  actorId: string
) {
  return AppDataSource.transaction(async (manager) => {
    const existing = await manager.getRepository(Recipes).findOne({
      where: { organizationId: orgId, productId: data.productId },
    });
    if (existing) {
      throw new Error("Recipe already exists for this product");
    }

    const recipe = manager.getRepository(Recipes).create({
      organizationId: orgId,
      productId: data.productId,
      name: data.name,
    });
    await manager.getRepository(Recipes).save(recipe);

    const ingredientRepo = manager.getRepository(RecipeIngredients);
    const itemRepo = manager.getRepository(InventoryItems);
    let estimatedCost = 0;

    for (const ing of data.ingredients) {
      const ingredient = ingredientRepo.create({
        recipeId: recipe.id,
        inventoryItemId: ing.inventoryItemId,
        quantity: ing.quantity,
        unit: ing.unit,
      });
      await ingredientRepo.save(ingredient);

      const item = await itemRepo.findOne({
        where: { id: ing.inventoryItemId },
      });
      if (item) {
        estimatedCost += Number(ing.quantity) * Number(item.costPerUnit);
      }
    }

    recipe.estimatedCost = parseFloat(estimatedCost.toFixed(2));
    await manager.getRepository(Recipes).save(recipe);

    logAudit({
      organizationId: orgId,
      actorId,
      action: "recipe.create",
      resource: "recipe",
      resourceId: recipe.id,
      meta: { name: data.name, productId: data.productId },
    });

    return manager.getRepository(Recipes).findOne({
      where: { id: recipe.id },
      relations: ["product", "ingredients", "ingredients.inventoryItem"],
    });
  });
}

export async function updateRecipe(
  id: string,
  data: UpdateRecipeDto,
  orgId: string,
  actorId: string
) {
  return AppDataSource.transaction(async (manager) => {
    const recipeRepoTx = manager.getRepository(Recipes);
    const recipe = await recipeRepoTx.findOne({
      where: { id, organizationId: orgId },
      relations: ["ingredients"],
    });

    if (!recipe) {
      throw new Error("Recipe not found");
    }

    if (data.name !== undefined) {
      recipe.name = data.name;
    }
    if (data.isActive !== undefined) {
      recipe.isActive = data.isActive;
    }
    await recipeRepoTx.save(recipe);

    if (data.ingredients) {
      await manager
        .getRepository(RecipeIngredients)
        .delete({ recipeId: recipe.id });

      const ingredientRepo = manager.getRepository(RecipeIngredients);
      const itemRepo = manager.getRepository(InventoryItems);
      let estimatedCost = 0;

      for (const ing of data.ingredients) {
        const ingredient = ingredientRepo.create({
          recipeId: recipe.id,
          inventoryItemId: ing.inventoryItemId,
          quantity: ing.quantity,
          unit: ing.unit,
        });
        await ingredientRepo.save(ingredient);

        const item = await itemRepo.findOne({
          where: { id: ing.inventoryItemId },
        });
        if (item) {
          estimatedCost += Number(ing.quantity) * Number(item.costPerUnit);
        }
      }

      recipe.estimatedCost = parseFloat(estimatedCost.toFixed(2));
      await recipeRepoTx.save(recipe);
    }

    logAudit({
      organizationId: orgId,
      actorId,
      action: "recipe.update",
      resource: "recipe",
      resourceId: recipe.id,
      meta: { changes: data },
    });

    return recipeRepoTx.findOne({
      where: { id: recipe.id },
      relations: ["product", "ingredients", "ingredients.inventoryItem"],
    });
  });
}

export async function deleteRecipe(
  id: string,
  orgId: string,
  actorId: string
): Promise<boolean> {
  const recipe = await recipeRepo().findOne({
    where: { id, organizationId: orgId },
  });
  if (!recipe) {
    return false;
  }

  await recipeRepo().remove(recipe);

  logAudit({
    organizationId: orgId,
    actorId,
    action: "recipe.delete",
    resource: "recipe",
    resourceId: id,
    meta: { name: recipe.name },
  });

  return true;
}
