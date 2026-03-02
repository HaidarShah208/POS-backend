import { Branches } from "../models/Branches.js";
import { Users } from "../models/Users.js";
import { Categories } from "../models/Categories.js";
import { Products } from "../models/Products.js";
import { Orders } from "../models/Orders.js";
import { OrderItems } from "../models/OrderItems.js";
import { Inventory } from "../models/Inventory.js";
import { StockAdjustments } from "../models/StockAdjustments.js";

export const entities = [
  Branches,
  Users,
  Categories,
  Products,
  Orders,
  OrderItems,
  Inventory,
  StockAdjustments,
];
