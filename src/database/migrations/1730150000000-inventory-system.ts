import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey, TableUnique } from "typeorm";

export class InventorySystem1730150000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "inventory_items",
        columns: [
          { name: "id", type: "uuid", isPrimary: true, generationStrategy: "uuid", default: "uuid_generate_v4()" },
          { name: "organization_id", type: "uuid" },
          { name: "product_id", type: "uuid", isNullable: true },
          { name: "name", type: "varchar", length: "255" },
          { name: "type", type: "varchar", length: "20" },
          { name: "unit", type: "varchar", length: "20" },
          { name: "current_quantity", type: "decimal", precision: 12, scale: 3, default: 0 },
          { name: "minimum_quantity", type: "decimal", precision: 12, scale: 3, default: 0 },
          { name: "cost_per_unit", type: "decimal", precision: 10, scale: 2, default: 0 },
          { name: "status", type: "varchar", length: "20", default: "'IN_STOCK'" },
          { name: "track_inventory", type: "boolean", default: true },
          { name: "track_expiry", type: "boolean", default: false },
          { name: "created_at", type: "timestamptz", default: "now()" },
          { name: "updated_at", type: "timestamptz", default: "now()" },
        ],
      }),
      true
    );

    await queryRunner.createIndex("inventory_items", new TableIndex({ name: "IDX_inventory_items_organization", columnNames: ["organization_id"] }));
    await queryRunner.createIndex("inventory_items", new TableIndex({ name: "IDX_inventory_items_product", columnNames: ["product_id"] }));
    await queryRunner.createIndex("inventory_items", new TableIndex({ name: "IDX_inventory_items_type", columnNames: ["type"] }));
    await queryRunner.createIndex("inventory_items", new TableIndex({ name: "IDX_inventory_items_status", columnNames: ["status"] }));
    await queryRunner.createIndex("inventory_items", new TableIndex({ name: "IDX_inventory_items_org_type", columnNames: ["organization_id", "type"] }));

    await queryRunner.createForeignKey("inventory_items", new TableForeignKey({
      name: "FK_inventory_items_organization",
      columnNames: ["organization_id"],
      referencedTableName: "organizations",
      referencedColumnNames: ["id"],
      onDelete: "CASCADE",
    }));
    await queryRunner.createForeignKey("inventory_items", new TableForeignKey({
      name: "FK_inventory_items_product",
      columnNames: ["product_id"],
      referencedTableName: "products",
      referencedColumnNames: ["id"],
      onDelete: "SET NULL",
    }));

    await queryRunner.createTable(
      new Table({
        name: "stock_movements",
        columns: [
          { name: "id", type: "uuid", isPrimary: true, generationStrategy: "uuid", default: "uuid_generate_v4()" },
          { name: "organization_id", type: "uuid" },
          { name: "inventory_item_id", type: "uuid" },
          { name: "type", type: "varchar", length: "30" },
          { name: "quantity", type: "decimal", precision: 12, scale: 3 },
          { name: "previous_quantity", type: "decimal", precision: 12, scale: 3 },
          { name: "new_quantity", type: "decimal", precision: 12, scale: 3 },
          { name: "reason", type: "varchar", length: "500", isNullable: true },
          { name: "reference_type", type: "varchar", length: "30", isNullable: true },
          { name: "reference_id", type: "uuid", isNullable: true },
          { name: "performed_by", type: "uuid", isNullable: true },
          { name: "notes", type: "text", isNullable: true },
          { name: "created_at", type: "timestamptz", default: "now()" },
        ],
      }),
      true
    );

    await queryRunner.createIndex("stock_movements", new TableIndex({ name: "IDX_stock_movements_org_created", columnNames: ["organization_id", "created_at"] }));
    await queryRunner.createIndex("stock_movements", new TableIndex({ name: "IDX_stock_movements_inventory_item", columnNames: ["inventory_item_id"] }));
    await queryRunner.createIndex("stock_movements", new TableIndex({ name: "IDX_stock_movements_ref", columnNames: ["reference_type", "reference_id"] }));

    await queryRunner.createForeignKey("stock_movements", new TableForeignKey({
      name: "FK_stock_movements_organization",
      columnNames: ["organization_id"],
      referencedTableName: "organizations",
      referencedColumnNames: ["id"],
      onDelete: "CASCADE",
    }));
    await queryRunner.createForeignKey("stock_movements", new TableForeignKey({
      name: "FK_stock_movements_inventory_item",
      columnNames: ["inventory_item_id"],
      referencedTableName: "inventory_items",
      referencedColumnNames: ["id"],
      onDelete: "CASCADE",
    }));
    await queryRunner.createForeignKey("stock_movements", new TableForeignKey({
      name: "FK_stock_movements_performed_by",
      columnNames: ["performed_by"],
      referencedTableName: "users",
      referencedColumnNames: ["id"],
      onDelete: "SET NULL",
    }));

    await queryRunner.createTable(
      new Table({
        name: "recipes",
        columns: [
          { name: "id", type: "uuid", isPrimary: true, generationStrategy: "uuid", default: "uuid_generate_v4()" },
          { name: "organization_id", type: "uuid" },
          { name: "product_id", type: "uuid" },
          { name: "name", type: "varchar", length: "255" },
          { name: "is_active", type: "boolean", default: true },
          { name: "estimated_cost", type: "decimal", precision: 10, scale: 2, default: 0 },
          { name: "created_at", type: "timestamptz", default: "now()" },
          { name: "updated_at", type: "timestamptz", default: "now()" },
        ],
      }),
      true
    );

    await queryRunner.createUniqueConstraint("recipes", new TableUnique({
      name: "UQ_recipes_org_product",
      columnNames: ["organization_id", "product_id"],
    }));

    await queryRunner.createForeignKey("recipes", new TableForeignKey({
      name: "FK_recipes_organization",
      columnNames: ["organization_id"],
      referencedTableName: "organizations",
      referencedColumnNames: ["id"],
      onDelete: "CASCADE",
    }));
    await queryRunner.createForeignKey("recipes", new TableForeignKey({
      name: "FK_recipes_product",
      columnNames: ["product_id"],
      referencedTableName: "products",
      referencedColumnNames: ["id"],
      onDelete: "CASCADE",
    }));

    await queryRunner.createTable(
      new Table({
        name: "recipe_ingredients",
        columns: [
          { name: "id", type: "uuid", isPrimary: true, generationStrategy: "uuid", default: "uuid_generate_v4()" },
          { name: "recipe_id", type: "uuid" },
          { name: "inventory_item_id", type: "uuid" },
          { name: "quantity", type: "decimal", precision: 12, scale: 3 },
          { name: "unit", type: "varchar", length: "20" },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey("recipe_ingredients", new TableForeignKey({
      name: "FK_recipe_ingredients_recipe",
      columnNames: ["recipe_id"],
      referencedTableName: "recipes",
      referencedColumnNames: ["id"],
      onDelete: "CASCADE",
    }));
    await queryRunner.createForeignKey("recipe_ingredients", new TableForeignKey({
      name: "FK_recipe_ingredients_inventory_item",
      columnNames: ["inventory_item_id"],
      referencedTableName: "inventory_items",
      referencedColumnNames: ["id"],
      onDelete: "CASCADE",
    }));

    await queryRunner.createTable(
      new Table({
        name: "waste_records",
        columns: [
          { name: "id", type: "uuid", isPrimary: true, generationStrategy: "uuid", default: "uuid_generate_v4()" },
          { name: "organization_id", type: "uuid" },
          { name: "inventory_item_id", type: "uuid" },
          { name: "quantity", type: "decimal", precision: 12, scale: 3 },
          { name: "reason", type: "varchar", length: "30" },
          { name: "notes", type: "text", isNullable: true },
          { name: "recorded_by", type: "uuid", isNullable: true },
          { name: "created_at", type: "timestamptz", default: "now()" },
        ],
      }),
      true
    );

    await queryRunner.createIndex("waste_records", new TableIndex({ name: "IDX_waste_records_org_created", columnNames: ["organization_id", "created_at"] }));

    await queryRunner.createForeignKey("waste_records", new TableForeignKey({
      name: "FK_waste_records_organization",
      columnNames: ["organization_id"],
      referencedTableName: "organizations",
      referencedColumnNames: ["id"],
      onDelete: "CASCADE",
    }));
    await queryRunner.createForeignKey("waste_records", new TableForeignKey({
      name: "FK_waste_records_inventory_item",
      columnNames: ["inventory_item_id"],
      referencedTableName: "inventory_items",
      referencedColumnNames: ["id"],
      onDelete: "CASCADE",
    }));
    await queryRunner.createForeignKey("waste_records", new TableForeignKey({
      name: "FK_waste_records_recorded_by",
      columnNames: ["recorded_by"],
      referencedTableName: "users",
      referencedColumnNames: ["id"],
      onDelete: "SET NULL",
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("waste_records", true);
    await queryRunner.dropTable("recipe_ingredients", true);
    await queryRunner.dropTable("recipes", true);
    await queryRunner.dropTable("stock_movements", true);
    await queryRunner.dropTable("inventory_items", true);
  }
}
