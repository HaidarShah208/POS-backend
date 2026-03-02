import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Categories } from "./Categories.js";

@Entity("products")
export class Products {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", name: "category_id" })
  categoryId!: string;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  price!: number;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  cost!: number | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  sku!: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  barcode!: string | null;

  @Column({ type: "varchar", length: 500, nullable: true })
  image!: string | null;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ type: "varchar", length: 20, default: "active" })
  status!: string;

  @Column({ type: "jsonb", nullable: true })
  modifiers!: { id: string; name: string; price: number }[] | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @ManyToOne(() => Categories, (c) => c.products, { onDelete: "CASCADE" })
  @JoinColumn({ name: "category_id" })
  category!: Categories;
}
