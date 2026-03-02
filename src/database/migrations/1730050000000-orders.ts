import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class Orders1730050000000 implements MigrationInterface {
  name = "Orders1730050000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "orders",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            default: "uuid_generate_v4()",
          },
          {
            name: "branch_id",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "user_id",
            type: "uuid",
            isNullable: true,
          },
          {
            name: "order_number",
            type: "varchar",
            length: "50",
            isNullable: false,
            isUnique: true,
          },
          {
            name: "order_type",
            type: "varchar",
            length: "20",
            isNullable: false,
          },
          {
            name: "payment_method",
            type: "varchar",
            length: "20",
            isNullable: false,
          },
          {
            name: "subtotal",
            type: "decimal",
            precision: 12,
            scale: 2,
            default: 0,
            isNullable: false,
          },
          {
            name: "tax",
            type: "decimal",
            precision: 12,
            scale: 2,
            default: 0,
            isNullable: false,
          },
          {
            name: "discount",
            type: "decimal",
            precision: 12,
            scale: 2,
            default: 0,
            isNullable: false,
          },
          {
            name: "grand_total",
            type: "decimal",
            precision: 12,
            scale: 2,
            default: 0,
            isNullable: false,
          },
          {
            name: "status",
            type: "varchar",
            length: "20",
            default: "'pending'",
            isNullable: false,
          },
          {
            name: "token",
            type: "varchar",
            length: "20",
            isNullable: false,
            isUnique: true,
          },
          {
            name: "kitchen_status",
            type: "varchar",
            length: "20",
            default: "'NEW'",
            isNullable: false,
          },
          {
            name: "created_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
          {
            name: "updated_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
        ],
      }),
      true
    );
    await queryRunner.createForeignKey(
      "orders",
      new TableForeignKey({
        columnNames: ["branch_id"],
        referencedTableName: "branches",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      })
    );
    await queryRunner.createForeignKey(
      "orders",
      new TableForeignKey({
        columnNames: ["user_id"],
        referencedTableName: "users",
        referencedColumnNames: ["id"],
        onDelete: "SET NULL",
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("orders");
    if (table?.foreignKeys) {
      for (const fk of table.foreignKeys) {
        await queryRunner.dropForeignKey("orders", fk);
      }
    }
    await queryRunner.dropTable("orders");
  }
}
