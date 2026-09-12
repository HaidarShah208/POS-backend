import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";

@Entity("purchase_order_items")
export class PurchaseOrderItems {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", name: "purchase_order_id" })
  purchaseOrderId!: string;

  @Column({ type: "uuid", name: "inventory_item_id" })
  inventoryItemId!: string;

  @Column({ type: "decimal", precision: 12, scale: 3, name: "ordered_quantity" })
  orderedQuantity!: number;

  @Column({ type: "decimal", precision: 12, scale: 3, name: "received_quantity", default: 0 })
  receivedQuantity!: number;

  @Column({ type: "decimal", precision: 10, scale: 2, name: "unit_cost", default: 0 })
  unitCost!: number;

  @Column({ type: "decimal", precision: 12, scale: 2, name: "total_cost", default: 0 })
  totalCost!: number;

  @ManyToOne("PurchaseOrders", "items", { onDelete: "CASCADE" })
  @JoinColumn({ name: "purchase_order_id" })
  purchaseOrder!: import("./PurchaseOrders.js").PurchaseOrders;

  @ManyToOne("InventoryItems", undefined, { onDelete: "CASCADE" })
  @JoinColumn({ name: "inventory_item_id" })
  inventoryItem!: import("./InventoryItems.js").InventoryItems;
}
