import { AppDataSource } from "../../config/data-source.js";
import { Organizations } from "../../models/Organizations.js";
import { Users } from "../../models/Users.js";
import { Orders } from "../../models/Orders.js";
import { Subscriptions } from "../../models/Subscriptions.js";
import type { OrganizationStatus } from "../../models/Organizations.js";
import { logAudit } from "../../services/audit.service.js";

const orgRepo = () => AppDataSource.getRepository(Organizations);
const userRepo = () => AppDataSource.getRepository(Users);
const orderRepo = () => AppDataSource.getRepository(Orders);
const subRepo = () => AppDataSource.getRepository(Subscriptions);

export async function getPlatformStats() {
  const [orgStats, totalUsers, totalOrders, revenueResult] = await Promise.all([
    orgRepo()
      .createQueryBuilder("org")
      .select("org.status", "status")
      .addSelect("COUNT(*)", "count")
      .groupBy("org.status")
      .getRawMany<{ status: string; count: string }>(),
    userRepo().count(),
    orderRepo().count(),
    orderRepo()
      .createQueryBuilder("o")
      .select("COALESCE(SUM(o.grand_total), 0)", "total")
      .where("o.status != :cancelled", { cancelled: "cancelled" })
      .getRawOne<{ total: string }>(),
  ]);

  const statusCounts: Record<string, number> = {};
  for (const row of orgStats) {
    statusCounts[row.status] = parseInt(row.count, 10);
  }

  return {
    totalOrganizations: Object.values(statusCounts).reduce((a, b) => a + b, 0),
    activeOrganizations: statusCounts["active"] ?? 0,
    trialOrganizations: statusCounts["trial"] ?? 0,
    suspendedOrganizations: statusCounts["suspended"] ?? 0,
    totalUsers,
    totalOrders,
    totalRevenue: parseFloat(revenueResult?.total || "0"),
  };
}

export interface GetOrganizationsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: OrganizationStatus;
}

export async function getOrganizations(params: GetOrganizationsParams = {}) {
  const { search, status } = params;
  const limit = Math.min(Math.max(params.limit ?? 20, 1), 100);
  const page = params.page ?? 1;
  const skip = (page - 1) * limit;

  const qb = orgRepo()
    .createQueryBuilder("org")
    .loadRelationCountAndMap("org.userCount", "org.users")
    .leftJoinAndMapOne(
      "org.subscription",
      Subscriptions,
      "sub",
      "sub.organization_id = org.id"
    )
    .leftJoinAndSelect("sub.plan", "plan")
    .orderBy("org.createdAt", "DESC");

  if (status) {
    qb.andWhere("org.status = :status", { status });
  }

  if (search && search.trim()) {
    qb.andWhere("(org.name ILIKE :search OR org.slug ILIKE :search OR org.email ILIKE :search)", {
      search: `%${search.trim()}%`,
    });
  }

  const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function getOrganizationById(id: string) {
  const org = await orgRepo().findOne({ where: { id } });
  if (!org) return null;

  const [users, subscription, orderStats] = await Promise.all([
    userRepo().find({
      where: { organizationId: id },
      select: ["id", "email", "name", "role", "createdAt"],
      order: { createdAt: "DESC" },
    }),
    subRepo().findOne({
      where: { organizationId: id },
      relations: ["plan"],
      order: { createdAt: "DESC" },
    }),
    orderRepo()
      .createQueryBuilder("o")
      .select("COUNT(*)", "count")
      .addSelect("COALESCE(SUM(o.grand_total), 0)", "revenue")
      .where("o.organization_id = :orgId", { orgId: id })
      .andWhere("o.status != :cancelled", { cancelled: "cancelled" })
      .getRawOne<{ count: string; revenue: string }>(),
  ]);

  return {
    ...org,
    users,
    subscription,
    stats: {
      totalOrders: parseInt(orderStats?.count || "0"),
      totalRevenue: parseFloat(orderStats?.revenue || "0"),
      totalUsers: users.length,
    },
  };
}

export async function updateOrganizationStatus(id: string, status: OrganizationStatus, actorId?: string | null) {
  const org = await orgRepo().findOne({ where: { id } });
  if (!org) return null;
  const previous = org.status;
  org.status = status;
  const saved = await orgRepo().save(org);

  if (status === "active") {
    const sub = await subRepo().findOne({ where: { organizationId: id }, order: { createdAt: "DESC" } });
    if (sub && sub.status !== "active") {
      sub.status = "active";
      sub.startsAt = new Date();
      await subRepo().save(sub);
    }
  } else if (status === "suspended") {
    const sub = await subRepo().findOne({ where: { organizationId: id }, order: { createdAt: "DESC" } });
    if (sub && sub.status !== "suspended") {
      sub.status = "suspended";
      await subRepo().save(sub);
    }
  }

  logAudit({ actorId, action: "organization.status_changed", resource: "organization", resourceId: id, meta: { from: previous, to: status } });
  return saved;
}

export async function updateOrganization(
  id: string,
  data: Partial<{ name: string; phone: string; email: string; address: string; status: OrganizationStatus }>,
  actorId?: string | null
) {
  const org = await orgRepo().findOne({ where: { id } });
  if (!org) return null;
  Object.assign(org, data);
  const saved = await orgRepo().save(org);
  logAudit({ actorId, action: "organization.updated", resource: "organization", resourceId: id });
  return saved;
}
