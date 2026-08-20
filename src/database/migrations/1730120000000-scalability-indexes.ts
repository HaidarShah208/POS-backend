import { MigrationInterface, QueryRunner } from "typeorm";

export class ScalabilityIndexes1730120000000 implements MigrationInterface {
  name = "ScalabilityIndexes1730120000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "audit_logs" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "organization_id" uuid,
        "actor_id" uuid,
        "action" varchar(100) NOT NULL,
        "resource" varchar(100) NOT NULL,
        "resource_id" uuid,
        "meta" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_audit_org_created" ON "audit_logs" ("organization_id", "created_at" DESC)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_audit_actor_created" ON "audit_logs" ("actor_id", "created_at" DESC)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_audit_resource" ON "audit_logs" ("resource", "resource_id")`);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_orders_branch_created" ON "orders" ("branch_id", "created_at" DESC)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_orders_org_status_created" ON "orders" ("organization_id", "status", "created_at" DESC)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_orders_branch_kitchen_created" ON "orders" ("branch_id", "kitchen_status", "created_at" DESC)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_orders_org_branch_created" ON "orders" ("organization_id", "branch_id", "created_at" DESC)`);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_order_items_order" ON "order_items" ("order_id")`);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_products_org_category" ON "products" ("organization_id", "category_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_products_org_name" ON "products" ("organization_id", "name")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_products_org_status" ON "products" ("organization_id", "status")`);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_categories_org_sort" ON "categories" ("organization_id", "sort_order", "name")`);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_inventory_branch" ON "inventory" ("branch_id")`);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_stock_adj_inv_created" ON "stock_adjustments" ("inventory_id", "created_at" DESC)`);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_users_branch" ON "users" ("branch_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_users_org_branch" ON "users" ("organization_id", "branch_id")`);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_subscriptions_org_created" ON "subscriptions" ("organization_id", "created_at" DESC)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_subscriptions_status" ON "subscriptions" ("status")`);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_organizations_status" ON "organizations" ("status")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_organizations_created" ON "organizations" ("created_at" DESC)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_organizations_created"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_organizations_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_subscriptions_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_subscriptions_org_created"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_org_branch"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_branch"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_stock_adj_inv_created"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_inventory_branch"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_categories_org_sort"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_products_org_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_products_org_name"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_products_org_category"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_order_items_order"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_org_branch_created"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_branch_kitchen_created"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_org_status_created"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_branch_created"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_audit_resource"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_audit_actor_created"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_audit_org_created"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs"`);
  }
}
