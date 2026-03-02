import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class Users1730030000000 implements MigrationInterface {
  name = "Users1730030000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "users",
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
            name: "email",
            type: "varchar",
            length: "255",
            isNullable: false,
            isUnique: true,
          },
          {
            name: "password_hash",
            type: "varchar",
            length: "255",
            isNullable: false,
          },
          {
            name: "name",
            type: "varchar",
            length: "255",
            isNullable: false,
          },
          {
            name: "role",
            type: "varchar",
            length: "20",
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
      "users",
      new TableForeignKey({
        columnNames: ["branch_id"],
        referencedTableName: "branches",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("users");
    const fk = table?.foreignKeys.find((k) => k.columnNames.indexOf("branch_id") !== -1);
    if (fk) await queryRunner.dropForeignKey("users", fk);
    await queryRunner.dropTable("users");
  }
}
