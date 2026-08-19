import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

export type PlanSlug = "free_trial" | "starter" | "professional" | "enterprise";

@Entity("plans")
export class Plans {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 100 })
  name!: string;

  @Column({ type: "varchar", length: 100, unique: true })
  slug!: PlanSlug;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  price!: number;

  @Column({ type: "jsonb", nullable: true })
  features!: Record<string, unknown> | null;

  @Column({ type: "jsonb", nullable: true })
  limits!: Record<string, number> | null;

  @Column({ type: "boolean", default: true })
  active!: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
