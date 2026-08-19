import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";

export type OrganizationStatus = "active" | "suspended" | "trial" | "inactive";

@Entity("organizations")
export class Organizations {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "varchar", length: 255, unique: true })
  slug!: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  logo!: string | null;

  @Column({ type: "varchar", length: 50, nullable: true })
  phone!: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  email!: string | null;

  @Column({ type: "text", nullable: true })
  address!: string | null;

  @Column({ type: "varchar", length: 20, default: "trial" })
  status!: OrganizationStatus;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @OneToMany("Users", "organization")
  users!: import("./Users.js").Users[];

  @OneToMany("Branches", "organization")
  branches!: import("./Branches.js").Branches[];

  @OneToMany("Subscriptions", "organization")
  subscriptions!: import("./Subscriptions.js").Subscriptions[];
}
