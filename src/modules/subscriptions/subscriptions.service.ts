import { AppDataSource } from "../../config/data-source.js";
import { Plans } from "../../models/Plans.js";
import { Subscriptions } from "../../models/Subscriptions.js";
import { PaymentSubmissions } from "../../models/PaymentSubmissions.js";
import { Organizations } from "../../models/Organizations.js";
import type { PaymentMethod } from "../../models/PaymentSubmissions.js";
import { logAudit } from "../../services/audit.service.js";

const planRepo = () => AppDataSource.getRepository(Plans);
const subRepo = () => AppDataSource.getRepository(Subscriptions);
const payRepo = () => AppDataSource.getRepository(PaymentSubmissions);
const orgRepo = () => AppDataSource.getRepository(Organizations);

export async function getPlans() {
  return planRepo().find({
    where: { active: true },
    order: { price: "ASC" },
  });
}

export async function getMySubscription(orgId: string) {
  return subRepo().findOne({
    where: { organizationId: orgId },
    relations: ["plan"],
    order: { createdAt: "DESC" },
  });
}

interface SubmitPaymentData {
  planId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  accountTitle?: string;
  transactionId?: string;
  receiptImage?: string;
}

export async function submitPayment(data: SubmitPaymentData, orgId: string, actorId: string) {
  return AppDataSource.transaction(async (manager) => {
    const payment = manager.create(PaymentSubmissions, {
      organizationId: orgId,
      planId: data.planId,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      accountTitle: data.accountTitle ?? null,
      transactionId: data.transactionId ?? null,
      receiptImage: data.receiptImage ?? null,
      status: "PENDING",
    });
    const saved = await manager.save(payment);

    await manager.update(Subscriptions, { organizationId: orgId }, { status: "pending_verification" });

    logAudit({
      organizationId: orgId,
      actorId,
      action: "payment.submitted",
      resource: "payment_submission",
      resourceId: saved.id,
      meta: { planId: data.planId, amount: data.amount, paymentMethod: data.paymentMethod },
    });

    return saved;
  });
}

export async function getPaymentStatus(orgId: string) {
  return payRepo().findOne({
    where: { organizationId: orgId },
    order: { createdAt: "DESC" },
    relations: ["plan"],
  });
}

interface GetAllPaymentsParams {
  page?: number;
  limit?: number;
  status?: string;
}

export async function getAllPayments(params: GetAllPaymentsParams) {
  const page = Math.max(params.page ?? 1, 1);
  const limit = Math.min(Math.max(params.limit ?? 20, 1), 100);
  const skip = (page - 1) * limit;

  const qb = payRepo()
    .createQueryBuilder("p")
    .leftJoinAndSelect("p.organization", "org")
    .leftJoinAndSelect("p.plan", "plan")
    .orderBy("p.createdAt", "DESC");

  if (params.status) {
    qb.andWhere("p.status = :status", { status: params.status });
  }

  const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
}

export async function approvePayment(paymentId: string, actorId: string) {
  return AppDataSource.transaction(async (manager) => {
    const payment = await manager.findOne(PaymentSubmissions, { where: { id: paymentId } });
    if (!payment) return null;

    payment.status = "APPROVED";
    payment.reviewedBy = actorId;
    payment.reviewedAt = new Date();
    await manager.save(payment);

    await manager.update(
      Subscriptions,
      { organizationId: payment.organizationId },
      { status: "active", startsAt: new Date() }
    );

    await manager.update(
      Organizations,
      { id: payment.organizationId },
      { status: "active" }
    );

    logAudit({
      organizationId: payment.organizationId,
      actorId,
      action: "payment.approved",
      resource: "payment_submission",
      resourceId: paymentId,
    });

    return payment;
  });
}

export async function rejectPayment(paymentId: string, notes: string, actorId: string) {
  return AppDataSource.transaction(async (manager) => {
    const payment = await manager.findOne(PaymentSubmissions, { where: { id: paymentId } });
    if (!payment) return null;

    payment.status = "REJECTED";
    payment.reviewNotes = notes;
    payment.reviewedBy = actorId;
    payment.reviewedAt = new Date();
    await manager.save(payment);

    const subscription = await manager.findOne(Subscriptions, {
      where: { organizationId: payment.organizationId },
      order: { createdAt: "DESC" },
    });

    if (subscription) {
      const now = new Date();
      const trialExpired = subscription.trialEndsAt && subscription.trialEndsAt < now;
      subscription.status = trialExpired ? "expired" : "trialing";
      await manager.save(subscription);
    }

    logAudit({
      organizationId: payment.organizationId,
      actorId,
      action: "payment.rejected",
      resource: "payment_submission",
      resourceId: paymentId,
      meta: { notes },
    });

    return payment;
  });
}
