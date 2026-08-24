import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Unique,
} from "typeorm";
import { RecipeIngredients } from "./RecipeIngredients.js";

@Entity("recipes")
@Unique(["organizationId", "productId"])
export class Recipes {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", name: "organization_id" })
  organizationId!: string;

  @Column({ type: "uuid", name: "product_id" })
  productId!: string;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "boolean", name: "is_active", default: true })
  isActive!: boolean;

  @Column({ type: "decimal", precision: 10, scale: 2, name: "estimated_cost", default: 0 })
  estimatedCost!: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @ManyToOne("Organizations", undefined, { onDelete: "CASCADE" })
  @JoinColumn({ name: "organization_id" })
  organization!: import("./Organizations.js").Organizations;

  @ManyToOne("Products", undefined, { onDelete: "CASCADE" })
  @JoinColumn({ name: "product_id" })
  product!: import("./Products.js").Products;

  @OneToMany(() => RecipeIngredients, (ri) => ri.recipe, { cascade: true })
  ingredients!: RecipeIngredients[];
}
