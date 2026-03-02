export type UserRole = "admin" | "manager" | "cashier" | "kitchen";

export type OrderType = "dine-in" | "takeaway" | "delivery";

export type PaymentMethod = "cash" | "card" | "mobile";

export type OrderStatus =
  | "pending"
  | "accepted"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";

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
