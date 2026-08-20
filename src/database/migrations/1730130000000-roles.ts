import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from "typeorm";

const SYSTEM_ROLES = [
  {
    name: "Super Admin",
    slug: "super_admin",
    description: "Platform-level access to manage all organizations",
    permissions: JSON.stringify(["admin_panel", "dashboard"]),
    is_system: true,
  },
  {
    name: "Owner",
    slug: "owner",
    description: "Full access to their restaurant organization",
    permissions: JSON.stringify([
      "dashboard", "pos", "orders", "kitchen", "products", "inventory",
      "reports", "analytics", "staff", "settings", "floor", "customers",
      "loyalty", "suppliers", "purchase_orders", "cash_register", "employees",
      "roles", "online_orders",
    ]),
    is_system: true,
  },
  {
    name: "Admin",
    slug: "admin",
    description: "Full access to all features and settings",
    permissions: JSON.stringify([
      "dashboard", "pos", "orders", "kitchen", "products", "inventory",
      "reports", "analytics", "staff", "settings", "floor", "customers",
      "loyalty", "suppliers", "purchase_orders", "cash_register", "employees",
      "roles", "online_orders",
    ]),
    is_system: true,
  },
  {
    name: "Cashier",
    slug: "cashier",
    description: "Access to POS, orders, floor, customers, loyalty, and cash register",
    permissions: JSON.stringify(["dashboard", "pos", "orders", "floor", "customers", "loyalty", "cash_register"]),
    is_system: true,
  },
  {
    name: "Kitchen Staff",
    slug: "kitchen",
    description: "Access to kitchen display only",
    permissions: JSON.stringify(["kitchen"]),
    is_system: true,
  },
];

export class Roles1730130000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "roles",
        columns: [
          { name: "id", type: "uuid", isPrimary: true, generationStrategy: "uuid", default: "uuid_generate_v4()" },
          { name: "organization_id", type: "uuid", isNullable: true },
          { name: "name", type: "varchar", length: "100" },
          { name: "slug", type: "varchar", length: "100" },
          { name: "description", type: "varchar", length: "255", isNullable: true },
          { name: "permissions", type: "jsonb", default: "'[]'" },
          { name: "is_system", type: "boolean", default: false },
          { name: "created_at", type: "timestamptz", default: "now()" },
          { name: "updated_at", type: "timestamptz", default: "now()" },
        ],
      }),
      true
    );

    await queryRunner.createIndex("roles", new TableIndex({
      name: "IDX_role_org_slug",
      columnNames: ["organization_id", "slug"],
      isUnique: true,
    }));

    await queryRunner.createForeignKey("roles", new TableForeignKey({
      name: "FK_role_organization",
      columnNames: ["organization_id"],
      referencedTableName: "organizations",
      referencedColumnNames: ["id"],
      onDelete: "CASCADE",
    }));

    for (const role of SYSTEM_ROLES) {
      await queryRunner.query(
        `INSERT INTO roles (name, slug, description, permissions, is_system, organization_id)
         VALUES ($1, $2, $3, $4::jsonb, $5, NULL)
         ON CONFLICT DO NOTHING`,
        [role.name, role.slug, role.description, role.permissions, role.is_system]
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("roles", true);
  }
}
