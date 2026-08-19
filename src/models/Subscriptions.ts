import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "cancelled"
  | "expired"
  | "suspended";

@Entity("subscriptions")
export class Subscriptions {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", name: "organization_id" })
  organizationId!: string;

  @Column({ type: "uuid", name: "plan_id" })
  planId!: string;

  @Column({ type: "varchar", length: 20, default: "trialing" })
  status!: SubscriptionStatus;

  @Column({ type: "timestamp", name: "trial_starts_at", nullable: true })
  trialStartsAt!: Date | null;

  @Column({ type: "timestamp", name: "trial_ends_at", nullable: true })
  trialEndsAt!: Date | null;

  @Column({ type: "timestamp", name: "starts_at", nullable: true })
  startsAt!: Date | null;

  @Column({ type: "timestamp", name: "expires_at", nullable: true })
  expiresAt!: Date | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @ManyToOne("Organizations", "subscriptions", { onDelete: "CASCADE" })
  @JoinColumn({ name: "organization_id" })
  organization!: import("./Organizations.js").Organizations;

  @ManyToOne("Plans", undefined, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "plan_id" })
  plan!: import("./Plans.js").Plans;
}
