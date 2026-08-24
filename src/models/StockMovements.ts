import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";

export type StockMovementType =
  | "OPENING_STOCK"
  | "SALE"
  | "PURCHASE"
  | "RETURN"
  | "DAMAGE"
  | "WASTAGE"
  | "EXPIRED"
  | "MANUAL_ADJUSTMENT"
  | "STOCK_CORRECTION"
  | "RECIPE_DEDUCTION";

export type StockMovementReferenceType = "ORDER" | "PURCHASE_ORDER" | "MANUAL" | "SYSTEM" | "WASTE";

@Entity("stock_movements")
@Index(["organizationId", "createdAt"])
@Index(["referenceType", "referenceId"])
export class StockMovements {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", name: "organization_id" })
  organizationId!: string;

  @Index()
  @Column({ type: "uuid", name: "inventory_item_id" })
  inventoryItemId!: string;

  @Column({ type: "varchar", length: 30 })
  type!: StockMovementType;

  @Column({ type: "decimal", precision: 12, scale: 3 })
  quantity!: number;

  @Column({ type: "decimal", precision: 12, scale: 3, name: "previous_quantity" })
  previousQuantity!: number;

  @Column({ type: "decimal", precision: 12, scale: 3, name: "new_quantity" })
  newQuantity!: number;

  @Column({ type: "varchar", length: 500, nullable: true })
  reason!: string | null;

  @Column({ type: "varchar", length: 30, name: "reference_type", nullable: true })
  referenceType!: StockMovementReferenceType | null;

  @Column({ type: "uuid", name: "reference_id", nullable: true })
  referenceId!: string | null;

  @Column({ type: "uuid", name: "performed_by", nullable: true })
  performedById!: string | null;

  @Column({ type: "text", nullable: true })
  notes!: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @ManyToOne("Organizations", undefined, { onDelete: "CASCADE" })
  @JoinColumn({ name: "organization_id" })
  organization!: import("./Organizations.js").Organizations;

  @ManyToOne("InventoryItems", undefined, { onDelete: "CASCADE" })
  @JoinColumn({ name: "inventory_item_id" })
  inventoryItem!: import("./InventoryItems.js").InventoryItems;

  @ManyToOne("Users", undefined, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "performed_by" })
  performedBy!: import("./Users.js").Users | null;
}
