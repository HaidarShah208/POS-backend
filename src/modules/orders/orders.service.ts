import { AppDataSource } from "../../config/data-source.js";
import { Orders } from "../../models/Orders.js";
import { OrderItems } from "../../models/OrderItems.js";
import { Inventory } from "../../models/Inventory.js";
import type { OrderType, PaymentMethod, OrderStatus } from "../../types/index.js";

const orderRepo = () => AppDataSource.getRepository(Orders);
const itemRepo = () => AppDataSource.getRepository(OrderItems);
const inventoryRepo = () => AppDataSource.getRepository(Inventory);

/** Calculate subtotal from items; optionally apply tax/discount to get grandTotal */
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
  const { branchId, userId, items, orderType, paymentMethod } = input;
  const calculated = calculateTotals(items);
  const subtotal = input.subtotal ?? calculated.subtotal;
  const tax = input.tax ?? 0;
  const discount = input.discount ?? 0;
  const grandTotal = input.grandTotal ?? subtotal + tax - discount;

  return await AppDataSource.transaction(async (manager) => {
    const orderRepository = manager.getRepository(Orders);
    const itemRepository = manager.getRepository(OrderItems);
    const invRepository = manager.getRepository(Inventory);

    const tokenNumber = await (async () => {
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const startOfDay = new Date(new Date().setHours(0, 0, 0, 0));
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
      const last = await orderRepository
        .createQueryBuilder("o")
        .where("o.branch_id = :branchId", { branchId })
        .andWhere("o.created_at >= :start", { start: startOfDay })
        .andWhere("o.created_at < :end", { end: endOfDay })
        .orderBy("o.created_at", "DESC")
        .getOne();
      const lastToken = last?.tokenNumber ?? "";
      const lastSeq = lastToken.startsWith(dateStr) ? parseInt(lastToken.split("-")[1] ?? "0", 10) : 0;
      return `${dateStr}-${String(lastSeq + 1).padStart(3, "0")}`;
    })();

    const order = orderRepository.create({
      branchId,
      userId: userId ?? null,
      orderNumber: tokenNumber,
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

    for (const it of items) {
      const inv = await invRepository.findOne({
        where: { productId: it.productId, branchId },
      });
      if (inv) {
        if (inv.currentStock < it.quantity) {
          throw new Error(`Insufficient stock for product ${it.productId}`);
        }
        inv.currentStock -= it.quantity;
        await invRepository.save(inv);
      }
    }

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

    return { orderId: order.id, tokenNumber };
  });
}

export interface GetOrdersParams {
  branchId?: string;
  status?: OrderStatus;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}

export interface PaginatedOrdersResult {
  data: Orders[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getOrders(params: GetOrdersParams = {}): Promise<PaginatedOrdersResult> {
  const { branchId, status, dateFrom, dateTo, page = 1, limit = 20 } = params;
  const skip = (page - 1) * limit;

  const qb = orderRepo()
    .createQueryBuilder("o")
    .leftJoinAndSelect("o.items", "items")
    .leftJoinAndSelect("o.branch", "branch")
    .leftJoinAndSelect("o.user", "user");

  if (branchId) {
    qb.andWhere("o.branchId = :branchId", { branchId });
  }
  if (status) {
    qb.andWhere("o.status = :status", { status });
  }
  if (dateFrom) {
    qb.andWhere("o.createdAt >= :dateFrom", { dateFrom });
  }
  if (dateTo) {
    qb.andWhere("o.createdAt < :dateTo", { dateTo });
  }

  qb.orderBy("o.createdAt", "DESC").skip(skip).take(limit);

  const [data, total] = await qb.getManyAndCount();

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function getByBranchId(branchId: string, limit = 50) {
  return orderRepo().find({
    where: { branchId },
    relations: ["items"],
    order: { createdAt: "DESC" },
    take: limit,
  });
}

export async function getById(id: string) {
  return orderRepo().findOne({
    where: { id },
    relations: ["items", "items.product", "branch", "user"],
  });
}

export async function getKitchenOrders(branchId: string) {
  return orderRepo().find({
    where: { branchId },
    relations: ["items"],
    order: { createdAt: "DESC" },
    take: 100,
  });
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus
): Promise<{ ok: boolean; error?: string }> {
  const order = await orderRepo().findOne({ where: { id: orderId } });
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
    order.kitchenStatus = newStatus === "completed" ? "READY" : "READY";
  }
  await orderRepo().save(order);
  return { ok: true };
}

export async function updateKitchenStatus(
  orderId: string,
  kitchenStatus: "NEW" | "PREPARING" | "READY"
): Promise<boolean> {
  const order = await orderRepo().findOne({ where: { id: orderId } });
  if (!order) return false;
  order.kitchenStatus = kitchenStatus;
  if (kitchenStatus === "READY") {
    order.status = "completed";
  }
  await orderRepo().save(order);
  return true;
}
