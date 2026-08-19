import { MigrationInterface, QueryRunner } from "typeorm";

export class MultiTenancy1730100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "organizations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" varchar(255) NOT NULL,
        "slug" varchar(255) NOT NULL,
        "logo" varchar(500),
        "phone" varchar(50),
        "email" varchar(255),
        "address" text,
        "status" varchar(20) NOT NULL DEFAULT 'trial',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_organizations" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_organizations_slug" UNIQUE ("slug")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "plans" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" varchar(100) NOT NULL,
        "slug" varchar(100) NOT NULL,
        "price" decimal(10,2) NOT NULL DEFAULT 0,
        "features" jsonb,
        "limits" jsonb,
        "active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_plans" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_plans_slug" UNIQUE ("slug")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "subscriptions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "organization_id" uuid NOT NULL,
        "plan_id" uuid NOT NULL,
        "status" varchar(20) NOT NULL DEFAULT 'trialing',
        "trial_starts_at" TIMESTAMP,
        "trial_ends_at" TIMESTAMP,
        "starts_at" TIMESTAMP,
        "expires_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_subscriptions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_subscriptions_organization" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_subscriptions_plan" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`ALTER TABLE "branches" ADD COLUMN "organization_id" uuid`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "organization_id" uuid`);
    await queryRunner.query(`ALTER TABLE "categories" ADD COLUMN "organization_id" uuid`);
    await queryRunner.query(`ALTER TABLE "products" ADD COLUMN "organization_id" uuid`);
    await queryRunner.query(`ALTER TABLE "orders" ADD COLUMN "organization_id" uuid`);

    await queryRunner.query(`CREATE INDEX "IDX_branches_organization" ON "branches" ("organization_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_users_organization" ON "users" ("organization_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_categories_organization" ON "categories" ("organization_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_products_organization" ON "products" ("organization_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_orders_organization" ON "orders" ("organization_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_subscriptions_organization" ON "subscriptions" ("organization_id")`);

    await queryRunner.query(`
      ALTER TABLE "branches" ADD CONSTRAINT "FK_branches_organization"
      FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "users" ADD CONSTRAINT "FK_users_organization"
      FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "categories" ADD CONSTRAINT "FK_categories_organization"
      FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "products" ADD CONSTRAINT "FK_products_organization"
      FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "orders" ADD CONSTRAINT "FK_orders_organization"
      FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      INSERT INTO "plans" ("name", "slug", "price", "features", "limits", "active")
      VALUES
        ('Free Trial', 'free_trial', 0, '{"all_features": true}', '{"products": 50, "users": 5}', true),
        ('Starter', 'starter', 29.99, '{"all_features": true}', '{"products": 200, "users": 10}', true),
        ('Professional', 'professional', 79.99, '{"all_features": true, "priority_support": true}', '{"products": 1000, "users": 50}', true),
        ('Enterprise', 'enterprise', 199.99, '{"all_features": true, "priority_support": true, "dedicated_account": true}', '{"products": -1, "users": -1}', true)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "FK_orders_organization"`);
    await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "FK_products_organization"`);
    await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT IF EXISTS "FK_categories_organization"`);
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "FK_users_organization"`);
    await queryRunner.query(`ALTER TABLE "branches" DROP CONSTRAINT IF EXISTS "FK_branches_organization"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_organization"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_products_organization"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_categories_organization"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_organization"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_branches_organization"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_subscriptions_organization"`);

    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "organization_id"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "organization_id"`);
    await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN IF EXISTS "organization_id"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "organization_id"`);
    await queryRunner.query(`ALTER TABLE "branches" DROP COLUMN IF EXISTS "organization_id"`);

    await queryRunner.query(`DROP TABLE IF EXISTS "subscriptions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "plans"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "organizations"`);
  }
}
