import "reflect-metadata";
import "dotenv/config";
import { DataSource } from "typeorm";
import { env, isDev } from "./env.js";
import { entities } from "./entities.js";
import { Branches1730010000000 } from "../database/migrations/1730010000000-branches.js";
import { Categories1730020000000 } from "../database/migrations/1730020000000-categories.js";
import { Users1730030000000 } from "../database/migrations/1730030000000-users.js";
import { Products1730040000000 } from "../database/migrations/1730040000000-products.js";
import { Orders1730050000000 } from "../database/migrations/1730050000000-orders.js";
import { OrderItems1730060000000 } from "../database/migrations/1730060000000-order-items.js";
import { Inventory1730070000000 } from "../database/migrations/1730070000000-inventory.js";
import { StockAdjustments1730080000000 } from "../database/migrations/1730080000000-stock-adjustments.js";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: env.databaseUrl,
  synchronize: false,
  logging: isDev,
  entities,
  migrations: [
    Branches1730010000000,
    Categories1730020000000,
    Users1730030000000,
    Products1730040000000,
    Orders1730050000000,
    OrderItems1730060000000,
    Inventory1730070000000,
    StockAdjustments1730080000000,
  ],
  migrationsTableName: "migrations",
  subscribers: [],
});

// For TypeORM CLI (migration:generate, migration:run)
export default AppDataSource;
