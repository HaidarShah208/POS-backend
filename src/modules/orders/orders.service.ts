import { AppDataSource } from "../../config/data-source.js";
import { Orders } from "../../models/Orders.js";
import { OrderItems } from "../../models/OrderItems.js";
import { Inventory } from "../../models/Inventory.js";
import { logAudit } from "../../services/audit.service.js";
import type { OrderType, PaymentMethod, OrderStatus } from "../../types/index.js";

const orderRepo = () => AppDataSource.getRepository(Orders);

function calculateTotals(items: { price: number; quantity: number; modifiers?: { price: number }[] }[]) {
  let subtotal = 0;
  for (const it of items) {
    const itemTotal = Number(it.price) * it.quantity;
    const modTotal = (it.modifiers ?? []).reduce((s, m) => s + Number(m.price), 0) * it.quantity;
    subtotal += itemTotal + modTotal;
  }
  return { subtotal };
}

const VALID_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["accepted", "cancelled"],
  accepted: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export interface PlaceOrderInput {
  branchId: string;
  userId?: string | null;
  organizationId?: string | null;
  idempotencyKey?: string | null;
  items: {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    note?: string;
    modifiers?: { id: string; name: string; price: number }[];
  }[];
  subtotal?: number;
  tax?: number;
  discount?: number;
  grandTotal?: number;
  orderType: OrderType;
  paymentMethod: PaymentMethod;
}

export interface PlaceOrderResult {
  orderId: string;
  tokenNumber: string;
}

export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  const { branchId, userId, organizationId, idempotencyKey, items, orderType, paymentMethod } = input;

  if (idempotencyKey) {
    const existing = await orderRepo().findOne({
      where: { orderNumber: idempotencyKey },
      select: ["id", "tokenNumber"],
    });
    if (existing) {
      return { orderId: existing.id, tokenNumber: existing.tokenNumber };
    }
  }

  const calculated = calculateTotals(items);
  const subtotal = input.subtotal ?? calculated.subtotal;
  const tax = input.tax ?? 0;
  const discount = input.discount ?? 0;
  const grandTotal = input.grandTotal ?? subtotal + tax - discount;

  return await AppDataSource.transaction("SERIALIZABLE", async (manager) => {
    const orderRepository = manager.getRepository(Orders);
    const itemRepository = manager.getRepository(OrderItems);

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const startOfDay = new Date(new Date().setHours(0, 0, 0, 0));
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const lastOrder = await orderRepository
      .createQueryBuilder("o")
      .where("o.branch_id = :branchId", { branchId })
      .andWhere("o.created_at >= :start", { start: startOfDay })
      .andWhere("o.created_at < :end", { end: endOfDay })
      .orderBy("o.createdAt", "DESC")
      .select(["o.tokenNumber"])
      .getOne();

    const lastToken = lastOrder?.tokenNumber ?? "";
    const lastSeq = lastToken.startsWith(dateStr) ? parseInt(lastToken.split("-")[1] ?? "0", 10) : 0;
    const tokenNumber = `${dateStr}-${String(lastSeq + 1).padStart(3, "0")}`;

    for (const it of items) {
      const result = await manager.query(
        `UPDATE inventory SET current_stock = current_stock - $1, updated_at = now()
         WHERE product_id = $2 AND branch_id = $3 AND current_stock >= $1`,
        [it.quantity, it.productId, branchId]
      );
      if (result[1] === 0) {
        const inv = await manager.query(
          `SELECT current_stock FROM inventory WHERE product_id = $1 AND branch_id = $2`,
          [it.productId, branchId]
        );
        if (inv.length > 0) {
          throw new Error(`Insufficient stock for product ${it.name}. Available: ${inv[0].current_stock}`);
        }
      }
    }

    const order = orderRepository.create({
      branchId,
      userId: userId ?? null,
      organizationId: organizationId ?? null,
      orderNumber: idempotencyKey || tokenNumber,
      tokenNumber,
      orderType,
      paymentMethod,
      subtotal,
      tax,
      discount,
      grandTotal,
      status: "pending",
    });
    await orderRepository.save(order);

    const orderItems = items.map((it) =>
      itemRepository.create({
        orderId: order.id,
        productId: it.productId,
        name: it.name,
        price: it.price,
        quantity: it.quantity,
        note: it.note ?? null,
        modifiers: it.modifiers ?? null,
      })
    );
    await itemRepository.save(orderItems);

    logAudit({
      organizationId,
      actorId: userId,
      action: "order.created",
      resource: "order",
      resourceId: order.id,
      meta: { tokenNumber, grandTotal, itemCount: items.length },
    });

    return { orderId: order.id, tokenNumber };
  });
}

export interface GetOrdersParams {
  branchId?: string;
  organizationId?: string | null;
  status?: OrderStatus;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export interface PaginatedOrdersResult {
  data: Orders[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const ALLOWED_ORDER_SORTS = new Set(["createdAt", "grandTotal", "status", "orderType"]);
const SORT_COLUMN_MAP: Record<string, string> = {
  createdAt: "o.createdAt",
  grandTotal: "o.grandTotal",
  status: "o.status",
  orderType: "o.orderType",
};

export async function getOrders(params: GetOrdersParams = {}): Promise<PaginatedOrdersResult> {
  const {
    branchId, organizationId, status, dateFrom, dateTo, search,
    page = 1,
    sortBy = "createdAt",
    sortOrder = "DESC",
  } = params;
  const limit = Math.min(Math.max(params.limit ?? 20, 1), 100);
  const skip = (page - 1) * limit;

  const qb = orderRepo()
    .createQueryBuilder("o")
    .leftJoinAndSelect("o.items", "items")
    .leftJoinAndSelect("o.branch", "branch")
    .leftJoin("o.user", "user")
    .addSelect(["user.id", "user.name", "user.email", "user.role"]);

  if (organizationId) {
    qb.andWhere("o.organization_id = :organizationId", { organizationId });
  }
  if (branchId) {
    qb.andWhere("o.branch_id = :branchId", { branchId });
  }
  if (status) {
    qb.andWhere("o.status = :status", { status });
  }
  if (dateFrom) {
    qb.andWhere("o.created_at >= :dateFrom", { dateFrom });
  }
  if (dateTo) {
    qb.andWhere("o.created_at < :dateTo", { dateTo });
  }
  if (search && search.trim()) {
    qb.andWhere("(o.order_number ILIKE :search OR o.token_number ILIKE :search)", {
      search: `%${search.trim()}%`,
    });
  }

  const sortCol = ALLOWED_ORDER_SORTS.has(sortBy) ? SORT_COLUMN_MAP[sortBy] : "o.createdAt";
  const direction = sortOrder === "ASC" ? "ASC" : "DESC";
  qb.orderBy(sortCol, direction).skip(skip).take(limit);

  const [data, total] = await qb.getManyAndCount();

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function getByBranchId(branchId: string, limit = 50, organizationId?: string | null) {
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const where: Record<string, unknown> = { branchId };
  if (organizationId) where.organizationId = organizationId;
  return orderRepo().find({
    where,
    relations: ["items"],
    order: { createdAt: "DESC" },
    take: safeLimit,
  });
}

export async function getById(id: string, organizationId?: string | null) {
  const where: Record<string, unknown> = { id };
  if (organizationId) where.organizationId = organizationId;
  return orderRepo().findOne({
    where,
    relations: ["items", "items.product", "branch", "user"],
  });
}

export async function getKitchenOrders(branchId: string, organizationId?: string | null) {
  const qb = orderRepo()
    .createQueryBuilder("o")
    .leftJoinAndSelect("o.items", "items")
    .where("o.branch_id = :branchId", { branchId })
    .andWhere("o.kitchen_status IN (:...statuses)", { statuses: ["NEW", "PREPARING"] })
    .orderBy("o.createdAt", "ASC")
    .take(100);

  if (organizationId) {
    qb.andWhere("o.organization_id = :organizationId", { organizationId });
  }

  return qb.getMany();
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  organizationId?: string | null,
  actorId?: string | null
): Promise<{ ok: boolean; error?: string }> {
  const where: Record<string, unknown> = { id: orderId };
  if (organizationId) where.organizationId = organizationId;
  const order = await orderRepo().findOne({ where });
  if (!order) return { ok: false, error: "Order not found" };

  const allowed = VALID_STATUS_TRANSITIONS[order.status as OrderStatus];
  if (!allowed?.includes(newStatus)) {
    return {
      ok: false,
      error: `Cannot transition from ${order.status} to ${newStatus}`,
    };
  }

  order.status = newStatus;
  if (newStatus === "ready" || newStatus === "completed") {
    order.kitchenStatus = "READY";
  }
  await orderRepo().save(order);

  logAudit({
    organizationId,
    actorId,
    action: "order.status_changed",
    resource: "order",
    resourceId: orderId,
    meta: { from: order.status, to: newStatus },
  });

  return { ok: true };
}

export async function updateKitchenStatus(
  orderId: string,
  kitchenStatus: "NEW" | "PREPARING" | "READY",
  organizationId?: string | null
): Promise<boolean> {
  const where: Record<string, unknown> = { id: orderId };
  if (organizationId) where.organizationId = organizationId;
  const order = await orderRepo().findOne({ where });
  if (!order) return false;
  order.kitchenStatus = kitchenStatus;
  if (kitchenStatus === "READY") {
    order.status = "completed";
  }
  await orderRepo().save(order);
  return true;
}
