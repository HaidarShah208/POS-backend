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
import { Products } from "./Products.js";
import { Branches } from "./Branches.js";
import { StockAdjustments } from "./StockAdjustments.js";

@Entity("inventory")
@Unique(["productId", "branchId"])
export class Inventory {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", name: "product_id" })
  productId!: string;

  @Column({ type: "uuid", name: "branch_id" })
  branchId!: string;

  @Column({ type: "int", name: "current_stock", default: 0 })
  currentStock!: number;

  @Column({ type: "int", name: "low_stock_threshold", default: 0 })
  lowStockThreshold!: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @ManyToOne(() => Products, { onDelete: "CASCADE" })
  @JoinColumn({ name: "product_id" })
  product!: Products;

  @ManyToOne(() => Branches, { onDelete: "CASCADE" })
  @JoinColumn({ name: "branch_id" })
  branch!: Branches;

  @OneToMany(() => StockAdjustments, (a) => a.inventory)
  adjustments!: StockAdjustments[];
}
