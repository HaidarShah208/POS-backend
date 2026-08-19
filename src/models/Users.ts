import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import type { UserRole } from "../types/index.js";

@Entity("users")
export class Users {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", name: "organization_id", nullable: true })
  organizationId!: string | null;

  @Column({ type: "uuid", name: "branch_id" })
  branchId!: string;

  @Column({ type: "varchar", length: 255, unique: true })
  email!: string;

  @Column({ type: "varchar", length: 255, name: "password_hash" })
  passwordHash!: string;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "varchar", length: 20 })
  role!: UserRole;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @ManyToOne("Organizations", "users", { onDelete: "CASCADE", nullable: true })
  @JoinColumn({ name: "organization_id" })
  organization!: import("./Organizations.js").Organizations | null;

  @ManyToOne("Branches", "users", { onDelete: "CASCADE" })
  @JoinColumn({ name: "branch_id" })
  branch!: import("./Branches.js").Branches;
}
