import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from "typeorm";

@Entity("audit_logs")
@Index(["organizationId", "createdAt"])
@Index(["actorId", "createdAt"])
@Index(["resource", "resourceId"])
export class AuditLogs {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", name: "organization_id", nullable: true })
  organizationId!: string | null;

  @Column({ type: "uuid", name: "actor_id", nullable: true })
  actorId!: string | null;

  @Column({ type: "varchar", length: 100 })
  action!: string;

  @Column({ type: "varchar", length: 100 })
  resource!: string;

  @Column({ type: "uuid", name: "resource_id", nullable: true })
  resourceId!: string | null;

  @Column({ type: "jsonb", nullable: true })
  meta!: Record<string, unknown> | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
