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

export type PaymentMethod = "EASYPAISA" | "JAZZCASH" | "BANK_TRANSFER";
export type PaymentStatus = "PENDING" | "APPROVED" | "REJECTED";

@Entity("payment_submissions")
export class PaymentSubmissions {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "uuid", name: "organization_id" })
  organizationId!: string;

  @Column({ type: "uuid", name: "plan_id" })
  planId!: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  amount!: number;

  @Column({ type: "varchar", length: 30, name: "payment_method" })
  paymentMethod!: PaymentMethod;

  @Column({ type: "varchar", length: 255, name: "account_title", nullable: true })
  accountTitle!: string | null;

  @Column({ type: "varchar", length: 100, name: "transaction_id", nullable: true })
  transactionId!: string | null;

  @Column({ type: "varchar", length: 500, name: "receipt_image", nullable: true })
  receiptImage!: string | null;

  @Index()
  @Column({ type: "varchar", length: 20, default: "PENDING" })
  status!: PaymentStatus;

  @Column({ type: "text", name: "review_notes", nullable: true })
  reviewNotes!: string | null;

  @Column({ type: "uuid", name: "reviewed_by", nullable: true })
  reviewedBy!: string | null;

  @Column({ type: "timestamp", name: "reviewed_at", nullable: true })
  reviewedAt!: Date | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @ManyToOne("Organizations", { onDelete: "CASCADE" })
  @JoinColumn({ name: "organization_id" })
  organization!: import("./Organizations.js").Organizations;

  @ManyToOne("Plans", { onDelete: "RESTRICT" })
  @JoinColumn({ name: "plan_id" })
  plan!: import("./Plans.js").Plans;

  @ManyToOne("Users", { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "reviewed_by" })
  reviewer!: import("./Users.js").Users | null;
}
