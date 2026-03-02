import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
export type StockAdjustmentType = "add" | "remove";

@Entity("stock_adjustments")
export class StockAdjustments {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", name: "inventory_id" })
  inventoryId!: string;

  @Column({ type: "varchar", length: 20 })
  type!: StockAdjustmentType;

  @Column({ type: "int" })
  quantity!: number;

  @Column({ type: "varchar", length: 500 })
  reason!: string;

  @Column({ type: "uuid", name: "created_by", nullable: true })
  createdById!: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @ManyToOne("Inventory", "adjustments", { onDelete: "CASCADE" })
  @JoinColumn({ name: "inventory_id" })
  inventory!: import("./Inventory.js").Inventory;

  @ManyToOne("Users", undefined, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "created_by" })
  createdBy!: import("./Users.js").Users | null;
}
