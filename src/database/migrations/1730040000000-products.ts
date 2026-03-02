import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class Products1730040000000 implements MigrationInterface {
  name = "Products1730040000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "products",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            default: "uuid_generate_v4()",
          },
          {
            name: "category_id",
            type: "uuid",
            isNullable: false,
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
            name: "cost",
            type: "decimal",
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: "sku",
            type: "varchar",
            length: "100",
            isNullable: true,
          },
          {
            name: "barcode",
            type: "varchar",
            length: "100",
            isNullable: true,
          },
          {
            name: "image",
            type: "varchar",
            length: "500",
            isNullable: true,
          },
          {
            name: "description",
            type: "text",
            isNullable: true,
          },
          {
            name: "status",
            type: "varchar",
            length: "20",
            default: "'active'",
            isNullable: false,
          },
          {
            name: "modifiers",
            type: "jsonb",
            isNullable: true,
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
      "products",
      new TableForeignKey({
        columnNames: ["category_id"],
        referencedTableName: "categories",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("products");
    const fk = table?.foreignKeys.find((k) => k.columnNames.indexOf("category_id") !== -1);
    if (fk) await queryRunner.dropForeignKey("products", fk);
    await queryRunner.dropTable("products");
  }
}
