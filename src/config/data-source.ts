import "reflect-metadata";
import "dotenv/config";
import { DataSource } from "typeorm";
import { env, isDev, isProd } from "./env.js";
import { entities } from "./entities.js";
import { Branches1730010000000 } from "../database/migrations/1730010000000-branches.js";
import { Categories1730020000000 } from "../database/migrations/1730020000000-categories.js";
import { Users1730030000000 } from "../database/migrations/1730030000000-users.js";
import { Products1730040000000 } from "../database/migrations/1730040000000-products.js";
import { Orders1730050000000 } from "../database/migrations/1730050000000-orders.js";
import { OrderItems1730060000000 } from "../database/migrations/1730060000000-order-items.js";
import { Inventory1730070000000 } from "../database/migrations/1730070000000-inventory.js";
import { StockAdjustments1730080000000 } from "../database/migrations/1730080000000-stock-adjustments.js";
import { OrdersTokenNumber1730090000000 } from "../database/migrations/1730090000000-orders-token-number.js";
import { MultiTenancy1730100000000 } from "../database/migrations/1730100000000-multi-tenancy.js";
import { BackfillOrganization1730110000000 } from "../database/migrations/1730110000000-backfill-organization.js";
import { ScalabilityIndexes1730120000000 } from "../database/migrations/1730120000000-scalability-indexes.js";
import { Roles1730130000000 } from "../database/migrations/1730130000000-roles.js";
import { CustomersSuppliers1730140000000 } from "../database/migrations/1730140000000-customers-suppliers.js";
import { InventorySystem1730150000000 } from "../database/migrations/1730150000000-inventory-system.js";
import { PurchaseOrders1730160000000 } from "../database/migrations/1730160000000-purchase-orders.js";
import { PaymentSubmissions1730170000000 } from "../database/migrations/1730170000000-payment-submissions.js";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: env.databaseUrl,
  synchronize: false,
  logging: isDev ? true : ["error", "warn"],
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
    OrdersTokenNumber1730090000000,
    MultiTenancy1730100000000,
    BackfillOrganization1730110000000,
    ScalabilityIndexes1730120000000,
    Roles1730130000000,
    CustomersSuppliers1730140000000,
    InventorySystem1730150000000,
    PurchaseOrders1730160000000,
    PaymentSubmissions1730170000000,
  ],
  migrationsTableName: "migrations",
  subscribers: [],
  extra: {
    max: env.dbPoolMax,
    min: env.dbPoolMin,
    connectionTimeoutMillis: env.dbConnectionTimeout,
    idleTimeoutMillis: env.dbIdleTimeout,
  },
  ...(isProd && env.databaseUrl.includes("sslmode=require")
    ? { ssl: { rejectUnauthorized: false } }
    : {}),
});

export default AppDataSource;
