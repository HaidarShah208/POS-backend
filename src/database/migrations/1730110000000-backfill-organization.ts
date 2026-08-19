import { MigrationInterface, QueryRunner } from "typeorm";

export class BackfillOrganization1730110000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const branches = await queryRunner.query(`SELECT "id", "name" FROM "branches" LIMIT 1`);
    if (!branches.length) return;

    const branch = branches[0];
    const orgSlug = "default-restaurant";

    await queryRunner.query(`
      INSERT INTO "organizations" ("id", "name", "slug", "status")
      VALUES (uuid_generate_v4(), $1, $2, 'active')
    `, [branch.name || "Default Restaurant", orgSlug]);

    const orgs = await queryRunner.query(`SELECT "id" FROM "organizations" WHERE "slug" = $1`, [orgSlug]);
    const orgId = orgs[0].id;

    await queryRunner.query(`UPDATE "branches" SET "organization_id" = $1 WHERE "organization_id" IS NULL`, [orgId]);
    await queryRunner.query(`UPDATE "users" SET "organization_id" = $1 WHERE "organization_id" IS NULL`, [orgId]);
    await queryRunner.query(`UPDATE "categories" SET "organization_id" = $1 WHERE "organization_id" IS NULL`, [orgId]);
    await queryRunner.query(`UPDATE "products" SET "organization_id" = $1 WHERE "organization_id" IS NULL`, [orgId]);
    await queryRunner.query(`UPDATE "orders" SET "organization_id" = $1 WHERE "organization_id" IS NULL`, [orgId]);

    const plans = await queryRunner.query(`SELECT "id" FROM "plans" WHERE "slug" = 'professional'`);
    if (plans.length) {
      await queryRunner.query(`
        INSERT INTO "subscriptions" ("organization_id", "plan_id", "status", "starts_at")
        VALUES ($1, $2, 'active', now())
      `, [orgId, plans[0].id]);
    }

    const existingAdmin = await queryRunner.query(`
      SELECT "id" FROM "users" WHERE "role" = 'admin' AND "organization_id" = $1 LIMIT 1
    `, [orgId]);
    if (existingAdmin.length) {
      await queryRunner.query(`UPDATE "users" SET "role" = 'owner' WHERE "id" = $1`, [existingAdmin[0].id]);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const orgs = await queryRunner.query(`SELECT "id" FROM "organizations" WHERE "slug" = 'default-restaurant'`);
    if (!orgs.length) return;
    const orgId = orgs[0].id;

    await queryRunner.query(`UPDATE "users" SET "role" = 'admin' WHERE "role" = 'owner' AND "organization_id" = $1`, [orgId]);
    await queryRunner.query(`DELETE FROM "subscriptions" WHERE "organization_id" = $1`, [orgId]);

    await queryRunner.query(`UPDATE "orders" SET "organization_id" = NULL WHERE "organization_id" = $1`, [orgId]);
    await queryRunner.query(`UPDATE "products" SET "organization_id" = NULL WHERE "organization_id" = $1`, [orgId]);
    await queryRunner.query(`UPDATE "categories" SET "organization_id" = NULL WHERE "organization_id" = $1`, [orgId]);
    await queryRunner.query(`UPDATE "users" SET "organization_id" = NULL WHERE "organization_id" = $1`, [orgId]);
    await queryRunner.query(`UPDATE "branches" SET "organization_id" = NULL WHERE "organization_id" = $1`, [orgId]);

    await queryRunner.query(`DELETE FROM "organizations" WHERE "id" = $1`, [orgId]);
  }
}
