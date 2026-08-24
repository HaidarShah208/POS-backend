import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from "typeorm";

export class PaymentSubmissions1730170000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "payment_submissions",
        columns: [
          { name: "id", type: "uuid", isPrimary: true, generationStrategy: "uuid", default: "uuid_generate_v4()" },
          { name: "organization_id", type: "uuid" },
          { name: "plan_id", type: "uuid" },
          { name: "amount", type: "decimal", precision: 10, scale: 2 },
          { name: "payment_method", type: "varchar", length: "30" },
          { name: "account_title", type: "varchar", length: "255", isNullable: true },
          { name: "transaction_id", type: "varchar", length: "100", isNullable: true },
          { name: "receipt_image", type: "varchar", length: "500", isNullable: true },
          { name: "status", type: "varchar", length: "20", default: "'PENDING'" },
          { name: "review_notes", type: "text", isNullable: true },
          { name: "reviewed_by", type: "uuid", isNullable: true },
          { name: "reviewed_at", type: "timestamp", isNullable: true },
          { name: "created_at", type: "timestamptz", default: "now()" },
          { name: "updated_at", type: "timestamptz", default: "now()" },
        ],
      }),
      true
    );

    await queryRunner.createIndex("payment_submissions", new TableIndex({ name: "IDX_payment_submissions_organization", columnNames: ["organization_id"] }));
    await queryRunner.createIndex("payment_submissions", new TableIndex({ name: "IDX_payment_submissions_status", columnNames: ["status"] }));

    await queryRunner.createForeignKey("payment_submissions", new TableForeignKey({
      name: "FK_payment_submissions_organization",
      columnNames: ["organization_id"],
      referencedTableName: "organizations",
      referencedColumnNames: ["id"],
      onDelete: "CASCADE",
    }));
    await queryRunner.createForeignKey("payment_submissions", new TableForeignKey({
      name: "FK_payment_submissions_plan",
      columnNames: ["plan_id"],
      referencedTableName: "plans",
      referencedColumnNames: ["id"],
      onDelete: "RESTRICT",
    }));
    await queryRunner.createForeignKey("payment_submissions", new TableForeignKey({
      name: "FK_payment_submissions_reviewer",
      columnNames: ["reviewed_by"],
      referencedTableName: "users",
      referencedColumnNames: ["id"],
      onDelete: "SET NULL",
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("payment_submissions", true);
  }
}
