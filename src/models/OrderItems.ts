import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Orders } from "./Orders.js";

@Entity("order_items")
export class OrderItems {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", name: "order_id" })
  orderId!: string;

  @Column({ type: "uuid", name: "product_id", nullable: true })
  productId!: string | null;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  price!: number;

  @Column({ type: "int", default: 1 })
  quantity!: number;

  @Column({ type: "text", nullable: true })
  note!: string | null;

  @Column({ type: "jsonb", nullable: true })
  modifiers!: { id: string; name: string; price: number }[] | null;

  @ManyToOne("Orders", "items", { onDelete: "CASCADE" })
  @JoinColumn({ name: "order_id" })
  order!: Orders;

  @ManyToOne("Products", undefined, { onDelete: "SET NULL" })
  @JoinColumn({ name: "product_id" })
  product!: import("./Products.js").Products | null;
}
