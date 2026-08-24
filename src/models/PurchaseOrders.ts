import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from "typeorm";
import { PurchaseOrderItems } from "./PurchaseOrderItems.js";

export type PurchaseOrderStatus = "DRAFT" | "SENT" | "PARTIAL" | "RECEIVED" | "CANCELLED";

@Entity("purchase_orders")
export class PurchaseOrders {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "uuid", name: "organization_id" })
  organizationId!: string;

  @Column({ type: "uuid", name: "supplier_id", nullable: true })
  supplierId!: string | null;

  @Column({ type: "varchar", length: 50, name: "order_number" })
  orderNumber!: string;

  @Index()
  @Column({ type: "varchar", length: 20, default: "DRAFT" })
  status!: PurchaseOrderStatus;

  @Column({ type: "decimal", precision: 12, scale: 2, name: "total_amount", default: 0 })
  totalAmount!: number;

  @Column({ type: "text", nullable: true })
  notes!: string | null;

  @Column({ type: "date", name: "expected_date", nullable: true })
  expectedDate!: string | null;

  @Column({ type: "date", name: "received_date", nullable: true })
  receivedDate!: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @ManyToOne("Organizations", undefined, { onDelete: "CASCADE" })
  @JoinColumn({ name: "organization_id" })
  organization!: import("./Organizations.js").Organizations;

  @ManyToOne("Suppliers", undefined, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "supplier_id" })
  supplier!: import("./Suppliers.js").Suppliers | null;

  @OneToMany(() => PurchaseOrderItems, (poi) => poi.purchaseOrder, { cascade: true })
  items!: PurchaseOrderItems[];
}
