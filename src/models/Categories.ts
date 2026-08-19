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

@Entity("categories")
export class Categories {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", name: "organization_id", nullable: true })
  organizationId!: string | null;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "varchar", length: 255, unique: true })
  slug!: string;

  @Column({ type: "int", name: "sort_order", default: 0 })
  sortOrder!: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @ManyToOne("Organizations", undefined, { onDelete: "CASCADE", nullable: true })
  @JoinColumn({ name: "organization_id" })
  organization!: import("./Organizations.js").Organizations | null;

  @OneToMany("Products", "category")
  products!: import("./Products.js").Products[];
}
