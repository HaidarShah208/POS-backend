import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";

@Entity("recipe_ingredients")
export class RecipeIngredients {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", name: "recipe_id" })
  recipeId!: string;

  @Column({ type: "uuid", name: "inventory_item_id" })
  inventoryItemId!: string;

  @Column({ type: "decimal", precision: 12, scale: 3 })
  quantity!: number;

  @Column({ type: "varchar", length: 20 })
  unit!: string;

  @ManyToOne("Recipes", undefined, { onDelete: "CASCADE" })
  @JoinColumn({ name: "recipe_id" })
  recipe!: import("./Recipes.js").Recipes;

  @ManyToOne("InventoryItems", undefined, { onDelete: "CASCADE" })
  @JoinColumn({ name: "inventory_item_id" })
  inventoryItem!: import("./InventoryItems.js").InventoryItems;
}
