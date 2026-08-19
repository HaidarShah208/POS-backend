import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from "typeorm";

@Entity("branches")
export class Branches {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", name: "organization_id", nullable: true })
  organizationId!: string | null;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  address!: string | null;

  @Column({ type: "varchar", length: 50, nullable: true })
  phone!: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @ManyToOne("Organizations", "branches", { onDelete: "CASCADE", nullable: true })
  @JoinColumn({ name: "organization_id" })
  organization!: import("./Organizations.js").Organizations | null;

  @OneToMany("Users", "branch")
  users!: import("./Users.js").Users[];

  @OneToMany("Orders", "branch")
  orders!: import("./Orders.js").Orders[];
}
