import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableUnique } from "typeorm";

export class Inventory1730070000000 implements MigrationInterface {
  name = "Inventory1730070000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "inventory",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            default: "uuid_generate_v4()",
          },
          {
            name: "product_id",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "branch_id",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "current_stock",
            type: "int",
            default: 0,
            isNullable: false,
          },
          {
            name: "low_stock_threshold",
            type: "int",
            default: 0,
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
    await queryRunner.createUniqueConstraint(
      "inventory",
      new TableUnique({
        name: "UQ_inventory_product_branch",
        columnNames: ["product_id", "branch_id"],
      })
    );
    await queryRunner.createForeignKey(
      "inventory",
      new TableForeignKey({
        columnNames: ["product_id"],
        referencedTableName: "products",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      })
    );
    await queryRunner.createForeignKey(
      "inventory",
      new TableForeignKey({
        columnNames: ["branch_id"],
        referencedTableName: "branches",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("inventory");
    if (table?.foreignKeys) {
      for (const fk of table.foreignKeys) {
        await queryRunner.dropForeignKey("inventory", fk);
      }
    }
    await queryRunner.dropTable("inventory");
  }
}
