import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from "typeorm";

export class CustomersSuppliers1730140000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "customers",
        columns: [
          { name: "id", type: "uuid", isPrimary: true, generationStrategy: "uuid", default: "uuid_generate_v4()" },
          { name: "organization_id", type: "uuid" },
          { name: "name", type: "varchar", length: "255" },
          { name: "email", type: "varchar", length: "255", isNullable: true },
          { name: "phone", type: "varchar", length: "50", isNullable: true },
          { name: "address", type: "text", isNullable: true },
          { name: "notes", type: "text", isNullable: true },
          { name: "status", type: "varchar", length: "20", default: "'active'" },
          { name: "total_orders", type: "int", default: 0 },
          { name: "total_spent", type: "decimal", precision: 12, scale: 2, default: 0 },
          { name: "last_order_at", type: "timestamptz", isNullable: true },
          { name: "loyalty_points", type: "int", default: 0 },
          { name: "tags", type: "jsonb", default: "'[]'" },
          { name: "created_at", type: "timestamptz", default: "now()" },
          { name: "updated_at", type: "timestamptz", default: "now()" },
        ],
      }),
      true
    );

    await queryRunner.createIndex("customers", new TableIndex({ name: "IDX_customer_org", columnNames: ["organization_id"] }));
    await queryRunner.createIndex("customers", new TableIndex({ name: "IDX_customer_org_email", columnNames: ["organization_id", "email"] }));
    await queryRunner.createForeignKey("customers", new TableForeignKey({
      name: "FK_customer_organization",
      columnNames: ["organization_id"],
      referencedTableName: "organizations",
      referencedColumnNames: ["id"],
      onDelete: "CASCADE",
    }));

    await queryRunner.createTable(
      new Table({
        name: "suppliers",
        columns: [
          { name: "id", type: "uuid", isPrimary: true, generationStrategy: "uuid", default: "uuid_generate_v4()" },
          { name: "organization_id", type: "uuid" },
          { name: "name", type: "varchar", length: "255" },
          { name: "contact_person", type: "varchar", length: "255", isNullable: true },
          { name: "email", type: "varchar", length: "255", isNullable: true },
          { name: "phone", type: "varchar", length: "50", isNullable: true },
          { name: "address", type: "text", isNullable: true },
          { name: "notes", type: "text", isNullable: true },
          { name: "status", type: "varchar", length: "20", default: "'active'" },
          { name: "total_orders", type: "int", default: 0 },
          { name: "total_spent", type: "decimal", precision: 12, scale: 2, default: 0 },
          { name: "outstanding_balance", type: "decimal", precision: 12, scale: 2, default: 0 },
          { name: "last_order_at", type: "timestamptz", isNullable: true },
          { name: "products_supplied", type: "jsonb", default: "'[]'" },
          { name: "created_at", type: "timestamptz", default: "now()" },
          { name: "updated_at", type: "timestamptz", default: "now()" },
        ],
      }),
      true
    );

    await queryRunner.createIndex("suppliers", new TableIndex({ name: "IDX_supplier_org", columnNames: ["organization_id"] }));
    await queryRunner.createForeignKey("suppliers", new TableForeignKey({
      name: "FK_supplier_organization",
      columnNames: ["organization_id"],
      referencedTableName: "organizations",
      referencedColumnNames: ["id"],
      onDelete: "CASCADE",
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("suppliers", true);
    await queryRunner.dropTable("customers", true);
  }
}
