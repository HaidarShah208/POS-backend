import { AppDataSource } from "../../config/data-source.js";
import { PurchaseOrders } from "../../models/PurchaseOrders.js";
import { PurchaseOrderItems } from "../../models/PurchaseOrderItems.js";
import { InventoryItems } from "../../models/InventoryItems.js";
import { StockMovements } from "../../models/StockMovements.js";
import { logAudit } from "../../services/audit.service.js";
import type { CreatePurchaseOrderDto, ReceiveItemsDto, GetPurchaseOrdersQueryDto } from "./purchase-orders.dto.js";
import type { FindOptionsWhere } from "typeorm";

const poRepo = () => AppDataSource.getRepository(PurchaseOrders);

function recalculateStatus(qty: number, min: number): "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" {
  if (qty <= 0) return "OUT_OF_STOCK";
  if (qty <= min) return "LOW_STOCK";
  return "IN_STOCK";
}

export async function getPurchaseOrders(params: GetPurchaseOrdersQueryDto & { organizationId: string }) {
  const page = params.page || 1;
  const limit = params.limit || 20;
  const skip = (page - 1) * limit;

  const where: FindOptionsWhere<PurchaseOrders> = { organizationId: params.organizationId };
  if (params.status) {
    where.status = params.status as PurchaseOrders["status"];
  }
  if (params.supplierId) {
    where.supplierId = params.supplierId;
  }

  const [data, total] = await poRepo().findAndCount({
    where,
    relations: ["supplier", "items"],
    order: { createdAt: "DESC" },
    skip,
    take: limit,
  });

  return { data, total, page, limit };
}

export async function getPurchaseOrderById(id: string, orgId: string) {
  return poRepo().findOne({
    where: { id, organizationId: orgId },
    relations: ["supplier", "items", "items.inventoryItem"],
  });
}

export async function createPurchaseOrder(
  data: CreatePurchaseOrderDto,
  orgId: string,
  actorId: string
) {
  return AppDataSource.transaction(async (manager) => {
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;

    const count = await manager.getRepository(PurchaseOrders).count({
      where: { organizationId: orgId },
    });
    const seq = String(count + 1).padStart(3, "0");
    const orderNumber = `PO-${dateStr}-${seq}`;

    const po = manager.getRepository(PurchaseOrders).create({
      organizationId: orgId,
      supplierId: data.supplierId || null,
      orderNumber,
      status: "DRAFT",
      notes: data.notes || null,
      expectedDate: data.expectedDate || null,
    });
    await manager.getRepository(PurchaseOrders).save(po);

    let totalAmount = 0;
    const itemRepo = manager.getRepository(PurchaseOrderItems);

    for (const item of data.items) {
      const totalCost = parseFloat((item.orderedQuantity * item.unitCost).toFixed(2));
      const poItem = itemRepo.create({
        purchaseOrderId: po.id,
        inventoryItemId: item.inventoryItemId,
        orderedQuantity: item.orderedQuantity,
        unitCost: item.unitCost,
        totalCost,
      });
      await itemRepo.save(poItem);
      totalAmount += totalCost;
    }

    po.totalAmount = parseFloat(totalAmount.toFixed(2));
    await manager.getRepository(PurchaseOrders).save(po);

    logAudit({
      organizationId: orgId,
      actorId,
      action: "purchase_order.create",
      resource: "purchase_order",
      resourceId: po.id,
      meta: { orderNumber, totalAmount: po.totalAmount },
    });

    return manager.getRepository(PurchaseOrders).findOne({
      where: { id: po.id },
      relations: ["supplier", "items", "items.inventoryItem"],
    });
  });
}

export async function receiveItems(
  poId: string,
  data: ReceiveItemsDto,
  orgId: string,
  actorId: string
) {
  return AppDataSource.transaction(async (manager) => {
    const po = await manager.getRepository(PurchaseOrders).findOne({
      where: { id: poId, organizationId: orgId },
      relations: ["items"],
    });

    if (!po) {
      throw new Error("Purchase order not found");
    }

    if (po.status === "CANCELLED" || po.status === "RECEIVED") {
      throw new Error("Cannot receive items for this purchase order");
    }

    const poItemRepo = manager.getRepository(PurchaseOrderItems);
    const inventoryRepo = manager.getRepository(InventoryItems);
    const movementRepo = manager.getRepository(StockMovements);

    for (const receiveItem of data.items) {
      const poItem = await poItemRepo.findOne({
        where: { id: receiveItem.purchaseOrderItemId, purchaseOrderId: po.id },
      });

      if (!poItem) {
        throw new Error(`Purchase order item ${receiveItem.purchaseOrderItemId} not found`);
      }

      const lockResult = await manager.query(
        `SELECT * FROM inventory_items WHERE id = $1 FOR UPDATE`,
        [poItem.inventoryItemId]
      );

      if (!lockResult || lockResult.length === 0) {
        throw new Error(`Inventory item ${poItem.inventoryItemId} not found`);
      }

      const lockedItem = lockResult[0];
      const previousQuantity = Number(lockedItem.current_quantity);
      const newQuantity = previousQuantity + Number(receiveItem.receivedQuantity);

      poItem.receivedQuantity = Number(poItem.receivedQuantity) + Number(receiveItem.receivedQuantity);
      await poItemRepo.save(poItem);

      await inventoryRepo.update(poItem.inventoryItemId, {
        currentQuantity: newQuantity,
        status: recalculateStatus(newQuantity, Number(lockedItem.minimum_quantity)),
      });

      const movement = movementRepo.create({
        organizationId: orgId,
        inventoryItemId: poItem.inventoryItemId,
        type: "PURCHASE",
        quantity: receiveItem.receivedQuantity,
        previousQuantity,
        newQuantity,
        reason: `Received from PO ${po.orderNumber}`,
        referenceType: "PURCHASE_ORDER",
        referenceId: po.id,
        performedById: actorId,
      });
      await movementRepo.save(movement);
    }

    const updatedItems = await poItemRepo.find({
      where: { purchaseOrderId: po.id },
    });

    const allReceived = updatedItems.every(
      (item) => Number(item.receivedQuantity) >= Number(item.orderedQuantity)
    );
    const someReceived = updatedItems.some(
      (item) => Number(item.receivedQuantity) > 0
    );

    if (allReceived) {
      po.status = "RECEIVED";
      po.receivedDate = new Date().toISOString().split("T")[0];
    } else if (someReceived) {
      po.status = "PARTIAL";
    }

    await manager.getRepository(PurchaseOrders).save(po);

    logAudit({
      organizationId: orgId,
      actorId,
      action: "purchase_order.receive",
      resource: "purchase_order",
      resourceId: po.id,
      meta: { itemsReceived: data.items.length, newStatus: po.status },
    });

    return manager.getRepository(PurchaseOrders).findOne({
      where: { id: po.id },
      relations: ["supplier", "items", "items.inventoryItem"],
    });
  });
}

export async function cancelPurchaseOrder(
  id: string,
  orgId: string,
  actorId: string
) {
  const po = await poRepo().findOne({
    where: { id, organizationId: orgId },
  });

  if (!po) {
    throw new Error("Purchase order not found");
  }

  if (po.status !== "DRAFT" && po.status !== "SENT") {
    throw new Error("Only DRAFT or SENT purchase orders can be cancelled");
  }

  po.status = "CANCELLED";
  await poRepo().save(po);

  logAudit({
    organizationId: orgId,
    actorId,
    action: "purchase_order.cancel",
    resource: "purchase_order",
    resourceId: po.id,
    meta: { orderNumber: po.orderNumber },
  });

  return po;
}
