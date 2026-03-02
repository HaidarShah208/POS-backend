export type UserRole = "admin" | "cashier" | "kitchen";

export type OrderType = "dine-in" | "takeaway" | "delivery";

export type PaymentMethod = "cash" | "card" | "mobile" | "other";

export type OrderStatus = "pending" | "completed" | "cancelled";

export type KitchenOrderStatus = "NEW" | "PREPARING" | "READY";

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  branchId: string;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
