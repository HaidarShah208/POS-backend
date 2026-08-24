import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";

export type WasteReason = "DAMAGED" | "EXPIRED" | "SPILLED" | "BURNED" | "SPOILED" | "OTHER";

@Entity("waste_records")
@Index(["organizationId", "createdAt"])
export class WasteRecords {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", name: "organization_id" })
  organizationId!: string;

  @Column({ type: "uuid", name: "inventory_item_id" })
  inventoryItemId!: string;

  @Column({ type: "decimal", precision: 12, scale: 3 })
  quantity!: number;

  @Column({ type: "varchar", length: 30 })
  reason!: WasteReason;

  @Column({ type: "text", nullable: true })
  notes!: string | null;

  @Column({ type: "uuid", name: "recorded_by", nullable: true })
  recordedById!: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @ManyToOne("Organizations", undefined, { onDelete: "CASCADE" })
  @JoinColumn({ name: "organization_id" })
  organization!: import("./Organizations.js").Organizations;

  @ManyToOne("InventoryItems", undefined, { onDelete: "CASCADE" })
  @JoinColumn({ name: "inventory_item_id" })
  inventoryItem!: import("./InventoryItems.js").InventoryItems;

  @ManyToOne("Users", undefined, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "recorded_by" })
  recordedBy!: import("./Users.js").Users | null;
}
