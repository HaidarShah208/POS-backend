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

@Entity("roles")
@Index("IDX_role_org_slug", ["organizationId", "slug"], { unique: true })
export class Roles {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", name: "organization_id", nullable: true })
  organizationId!: string | null;

  @Column({ type: "varchar", length: 100 })
  name!: string;

  @Column({ type: "varchar", length: 100 })
  slug!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  description!: string | null;

  @Column({ type: "jsonb", default: "[]" })
  permissions!: string[];

  @Column({ type: "boolean", name: "is_system", default: false })
  isSystem!: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @ManyToOne("Organizations", { onDelete: "CASCADE", nullable: true })
  @JoinColumn({ name: "organization_id" })
  organization!: import("./Organizations.js").Organizations | null;
}
