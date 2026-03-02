import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";
import type { OrderType, PaymentMethod, OrderStatus } from "../types/index.js";
import { Branches } from "./Branches.js";
import { Users } from "./Users.js";
import { OrderItems } from "./OrderItems.js";

@Entity("orders")
export class Orders {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", name: "branch_id" })
  branchId!: string;

  @Column({ type: "uuid", name: "user_id", nullable: true })
  userId!: string | null;

  @Column({ type: "varchar", length: 50, name: "order_number", unique: true })
  orderNumber!: string;

  @Column({ type: "varchar", length: 20, name: "order_type" })
  orderType!: OrderType;

  @Column({ type: "varchar", length: 20, name: "payment_method" })
  paymentMethod!: PaymentMethod;

  @Column({ type: "decimal", precision: 12, scale: 2, name: "subtotal", default: 0 })
  subtotal!: number;

  @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
  tax!: number;

  @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
  discount!: number;

  @Column({ type: "decimal", precision: 12, scale: 2, name: "grand_total", default: 0 })
  grandTotal!: number;

  @Column({ type: "varchar", length: 20, default: "pending" })
  status!: OrderStatus;

  @Column({ type: "varchar", length: 20, unique: true })
  token!: string;

  @Column({ type: "varchar", length: 20, name: "kitchen_status", default: "NEW" })
  kitchenStatus!: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @ManyToOne(() => Branches, (b) => b.orders, { onDelete: "CASCADE" })
  @JoinColumn({ name: "branch_id" })
  branch!: Branches;

  @ManyToOne(() => Users, { onDelete: "SET NULL" })
  @JoinColumn({ name: "user_id" })
  user!: Users | null;

  @OneToMany(() => OrderItems, (item) => item.order, { cascade: true })
  items!: OrderItems[];
}
