import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";

export type InventoryItemType = "PRODUCT" | "INGREDIENT" | "PACKAGING";
export type InventoryItemUnit = "PCS" | "KG" | "G" | "L" | "ML" | "BOX" | "PACK";
export type InventoryItemStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

@Entity("inventory_items")
@Index(["organizationId", "type"])
export class InventoryItems {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "uuid", name: "organization_id" })
  organizationId!: string;

  @Index()
  @Column({ type: "uuid", name: "product_id", nullable: true })
  productId!: string | null;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Index()
  @Column({ type: "varchar", length: 20 })
  type!: InventoryItemType;

  @Column({ type: "varchar", length: 20 })
  unit!: InventoryItemUnit;

  @Column({ type: "decimal", precision: 12, scale: 3, name: "current_quantity", default: 0 })
  currentQuantity!: number;

  @Column({ type: "decimal", precision: 12, scale: 3, name: "minimum_quantity", default: 0 })
  minimumQuantity!: number;

  @Column({ type: "decimal", precision: 10, scale: 2, name: "cost_per_unit", default: 0 })
  costPerUnit!: number;

  @Index()
  @Column({ type: "varchar", length: 20, default: "IN_STOCK" })
  status!: InventoryItemStatus;

  @Column({ type: "boolean", name: "track_inventory", default: true })
  trackInventory!: boolean;

  @Column({ type: "boolean", name: "track_expiry", default: false })
  trackExpiry!: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @ManyToOne("Organizations", undefined, { onDelete: "CASCADE" })
  @JoinColumn({ name: "organization_id" })
  organization!: import("./Organizations.js").Organizations;

  @ManyToOne("Products", undefined, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "product_id" })
  product!: import("./Products.js").Products | null;
}
