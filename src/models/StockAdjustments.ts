import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Inventory } from "./Inventory.js";
import { Users } from "./Users.js";

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

  @ManyToOne(() => Inventory, (inv) => inv.adjustments, { onDelete: "CASCADE" })
  @JoinColumn({ name: "inventory_id" })
  inventory!: Inventory;

  @ManyToOne(() => Users, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "created_by" })
  createdBy!: Users | null;
}
