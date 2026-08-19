export type UserRole = "super_admin" | "owner" | "admin" | "manager" | "cashier" | "kitchen";

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
  organizationId: string | null;
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
