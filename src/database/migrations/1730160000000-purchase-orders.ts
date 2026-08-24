import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from "typeorm";

export class PurchaseOrders1730160000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "purchase_orders",
        columns: [
          { name: "id", type: "uuid", isPrimary: true, generationStrategy: "uuid", default: "uuid_generate_v4()" },
          { name: "organization_id", type: "uuid" },
          { name: "supplier_id", type: "uuid", isNullable: true },
          { name: "order_number", type: "varchar", length: "50" },
          { name: "status", type: "varchar", length: "20", default: "'DRAFT'" },
          { name: "total_amount", type: "decimal", precision: 12, scale: 2, default: 0 },
          { name: "notes", type: "text", isNullable: true },
          { name: "expected_date", type: "date", isNullable: true },
          { name: "received_date", type: "date", isNullable: true },
          { name: "created_at", type: "timestamptz", default: "now()" },
          { name: "updated_at", type: "timestamptz", default: "now()" },
        ],
      }),
      true
    );

    await queryRunner.createIndex("purchase_orders", new TableIndex({ name: "IDX_purchase_orders_organization", columnNames: ["organization_id"] }));
    await queryRunner.createIndex("purchase_orders", new TableIndex({ name: "IDX_purchase_orders_status", columnNames: ["status"] }));
    await queryRunner.createIndex("purchase_orders", new TableIndex({ name: "IDX_purchase_orders_supplier", columnNames: ["supplier_id"] }));

    await queryRunner.createForeignKey("purchase_orders", new TableForeignKey({
      name: "FK_purchase_orders_organization",
      columnNames: ["organization_id"],
      referencedTableName: "organizations",
      referencedColumnNames: ["id"],
      onDelete: "CASCADE",
    }));
    await queryRunner.createForeignKey("purchase_orders", new TableForeignKey({
      name: "FK_purchase_orders_supplier",
      columnNames: ["supplier_id"],
      referencedTableName: "suppliers",
      referencedColumnNames: ["id"],
      onDelete: "SET NULL",
    }));

    await queryRunner.createTable(
      new Table({
        name: "purchase_order_items",
        columns: [
          { name: "id", type: "uuid", isPrimary: true, generationStrategy: "uuid", default: "uuid_generate_v4()" },
          { name: "purchase_order_id", type: "uuid" },
          { name: "inventory_item_id", type: "uuid" },
          { name: "ordered_quantity", type: "decimal", precision: 12, scale: 3 },
          { name: "received_quantity", type: "decimal", precision: 12, scale: 3, default: 0 },
          { name: "unit_cost", type: "decimal", precision: 10, scale: 2, default: 0 },
          { name: "total_cost", type: "decimal", precision: 12, scale: 2, default: 0 },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey("purchase_order_items", new TableForeignKey({
      name: "FK_purchase_order_items_purchase_order",
      columnNames: ["purchase_order_id"],
      referencedTableName: "purchase_orders",
      referencedColumnNames: ["id"],
      onDelete: "CASCADE",
    }));
    await queryRunner.createForeignKey("purchase_order_items", new TableForeignKey({
      name: "FK_purchase_order_items_inventory_item",
      columnNames: ["inventory_item_id"],
      referencedTableName: "inventory_items",
      referencedColumnNames: ["id"],
      onDelete: "CASCADE",
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("purchase_order_items", true);
    await queryRunner.dropTable("purchase_orders", true);
  }
}
