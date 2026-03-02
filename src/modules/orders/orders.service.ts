import { AppDataSource } from "../../config/data-source.js";
import { Orders } from "../../models/Orders.js";
import { OrderItems } from "../../models/OrderItems.js";
import type { OrderType, PaymentMethod } from "../../types/index.js";

const orderRepo = () => AppDataSource.getRepository(Orders);
const itemRepo = () => AppDataSource.getRepository(OrderItems);

/** Generate next order number for branch (e.g. #1001, #1002) */
async function nextOrderNumber(branchId: string): Promise<string> {
  const last = await orderRepo()
    .createQueryBuilder("o")
    .where("o.branch_id = :branchId", { branchId })
    .orderBy("o.created_at", "DESC")
    .getOne();
  const num = last?.orderNumber?.replace(/#/g, "") ?? "1000";
  const next = parseInt(num, 10) + 1;
  return `#${next}`;
}

/** Generate short token for kitchen display (same as order number) */
function tokenFromOrderNumber(orderNumber: string): string {
  return orderNumber;
}

export interface PlaceOrderInput {
  branchId: string;
  userId?: string | null;
  items: { productId: string; name: string; price: number; quantity: number; note?: string; modifiers?: { id: string; name: string; price: number }[] }[];
  subtotal: number;
  tax: number;
  discount: number;
  grandTotal: number;
  orderType: OrderType;
  paymentMethod: PaymentMethod;
}

export interface PlaceOrderResult {
  orderId: string;
  token: string;
}

export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  const orderNumber = await nextOrderNumber(input.branchId);
  const token = tokenFromOrderNumber(orderNumber);

  const order = orderRepo().create({
    branchId: input.branchId,
    userId: input.userId ?? null,
    orderNumber,
    token,
    orderType: input.orderType,
    paymentMethod: input.paymentMethod,
    subtotal: input.subtotal,
    tax: input.tax,
    discount: input.discount,
    grandTotal: input.grandTotal,
    status: "pending",
  });
  await orderRepo().save(order);

  const items = input.items.map((it) =>
    itemRepo().create({
      orderId: order.id,
      productId: it.productId,
      name: it.name,
      price: it.price,
      quantity: it.quantity,
      note: it.note ?? null,
      modifiers: it.modifiers ?? null,
    })
  );
  await itemRepo().save(items);

  return { orderId: order.id, token };
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
    relations: ["items"],
  });
}

/** Kitchen: list orders for display (pending / in progress) */
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
