import { MigrationInterface, QueryRunner } from "typeorm";

export class OrdersTokenNumber1730090000000 implements MigrationInterface {
  name = "OrdersTokenNumber1730090000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.renameColumn("orders", "token", "token_number");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.renameColumn("orders", "token_number", "token");
  }
}
