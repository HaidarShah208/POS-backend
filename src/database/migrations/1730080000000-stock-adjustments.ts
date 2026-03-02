import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class StockAdjustments1730080000000 implements MigrationInterface {
  name = "StockAdjustments1730080000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "stock_adjustments",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            default: "uuid_generate_v4()",
          },
          {
            name: "inventory_id",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "type",
            type: "varchar",
            length: "20",
            isNullable: false,
          },
          {
            name: "quantity",
            type: "int",
            isNullable: false,
          },
          {
            name: "reason",
            type: "varchar",
            length: "500",
            isNullable: false,
          },
          {
            name: "created_by",
            type: "uuid",
            isNullable: true,
          },
          {
            name: "created_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
        ],
      }),
      true
    );
    await queryRunner.createForeignKey(
      "stock_adjustments",
      new TableForeignKey({
        columnNames: ["inventory_id"],
        referencedTableName: "inventory",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      })
    );
    await queryRunner.createForeignKey(
      "stock_adjustments",
      new TableForeignKey({
        columnNames: ["created_by"],
        referencedTableName: "users",
        referencedColumnNames: ["id"],
        onDelete: "SET NULL",
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("stock_adjustments");
    if (table?.foreignKeys) {
      for (const fk of table.foreignKeys) {
        await queryRunner.dropForeignKey("stock_adjustments", fk);
      }
    }
    await queryRunner.dropTable("stock_adjustments");
  }
}
