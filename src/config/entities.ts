import { Organizations } from "../models/Organizations.js";
import { Plans } from "../models/Plans.js";
import { Subscriptions } from "../models/Subscriptions.js";
import { Branches } from "../models/Branches.js";
import { Users } from "../models/Users.js";
import { Categories } from "../models/Categories.js";
import { Products } from "../models/Products.js";
import { Orders } from "../models/Orders.js";
import { OrderItems } from "../models/OrderItems.js";
import { Inventory } from "../models/Inventory.js";
import { StockAdjustments } from "../models/StockAdjustments.js";
import { AuditLogs } from "../models/AuditLogs.js";
import { Roles } from "../models/Roles.js";
import { Suppliers } from "../models/Suppliers.js";
import { InventoryItems } from "../models/InventoryItems.js";
import { StockMovements } from "../models/StockMovements.js";
import { Recipes } from "../models/Recipes.js";
import { RecipeIngredients } from "../models/RecipeIngredients.js";
import { WasteRecords } from "../models/WasteRecords.js";
import { PurchaseOrders } from "../models/PurchaseOrders.js";
import { PurchaseOrderItems } from "../models/PurchaseOrderItems.js";
import { PaymentSubmissions } from "../models/PaymentSubmissions.js";

export const entities = [
  Organizations,
  Plans,
  Subscriptions,
  Branches,
  Users,
  Categories,
  Products,
  Orders,
  OrderItems,
  Inventory,
  StockAdjustments,
  AuditLogs,
  Roles,
  Suppliers,
  InventoryItems,
  StockMovements,
  Recipes,
  RecipeIngredients,
  WasteRecords,
  PurchaseOrders,
  PurchaseOrderItems,
  PaymentSubmissions,
];
