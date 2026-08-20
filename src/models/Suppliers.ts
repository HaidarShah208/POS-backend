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

@Entity("suppliers")
@Index("IDX_supplier_org", ["organizationId"])
export class Suppliers {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", name: "organization_id" })
  organizationId!: string;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "varchar", length: 255, name: "contact_person", nullable: true })
  contactPerson!: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  email!: string | null;

  @Column({ type: "varchar", length: 50, nullable: true })
  phone!: string | null;

  @Column({ type: "text", nullable: true })
  address!: string | null;

  @Column({ type: "text", nullable: true })
  notes!: string | null;

  @Column({ type: "varchar", length: 20, default: "active" })
  status!: string;

  @Column({ type: "int", name: "total_orders", default: 0 })
  totalOrders!: number;

  @Column({ type: "decimal", precision: 12, scale: 2, name: "total_spent", default: 0 })
  totalSpent!: number;

  @Column({ type: "decimal", precision: 12, scale: 2, name: "outstanding_balance", default: 0 })
  outstandingBalance!: number;

  @Column({ type: "timestamptz", name: "last_order_at", nullable: true })
  lastOrderAt!: Date | null;

  @Column({ type: "jsonb", name: "products_supplied", default: "[]" })
  productsSupplied!: string[];

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @ManyToOne("Organizations", { onDelete: "CASCADE" })
  @JoinColumn({ name: "organization_id" })
  organization!: import("./Organizations.js").Organizations;
}
