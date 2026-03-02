import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class OrderItems1730060000000 implements MigrationInterface {
  name = "OrderItems1730060000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "order_items",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            default: "uuid_generate_v4()",
          },
          {
            name: "order_id",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "product_id",
            type: "uuid",
            isNullable: true,
          },
          {
            name: "name",
            type: "varchar",
            length: "255",
            isNullable: false,
          },
          {
            name: "price",
            type: "decimal",
            precision: 10,
            scale: 2,
            default: 0,
            isNullable: false,
          },
          {
            name: "quantity",
            type: "int",
            default: 1,
            isNullable: false,
          },
          {
            name: "note",
            type: "text",
            isNullable: true,
          },
          {
            name: "modifiers",
            type: "jsonb",
            isNullable: true,
          },
        ],
      }),
      true
    );
    await queryRunner.createForeignKey(
      "order_items",
      new TableForeignKey({
        columnNames: ["order_id"],
        referencedTableName: "orders",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("order_items");
    const fk = table?.foreignKeys.find((k) => k.columnNames.indexOf("order_id") !== -1);
    if (fk) await queryRunner.dropForeignKey("order_items", fk);
    await queryRunner.dropTable("order_items");
  }
}
