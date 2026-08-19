import { AppDataSource } from "../../config/data-source.js";
import { Organizations } from "../../models/Organizations.js";
import { Users } from "../../models/Users.js";
import { Orders } from "../../models/Orders.js";
import { Subscriptions } from "../../models/Subscriptions.js";
import type { OrganizationStatus } from "../../models/Organizations.js";

const orgRepo = () => AppDataSource.getRepository(Organizations);
const userRepo = () => AppDataSource.getRepository(Users);
const orderRepo = () => AppDataSource.getRepository(Orders);
const subRepo = () => AppDataSource.getRepository(Subscriptions);

export async function getPlatformStats() {
  const totalOrgs = await orgRepo().count();
  const activeOrgs = await orgRepo().count({ where: { status: "active" } });
  const trialOrgs = await orgRepo().count({ where: { status: "trial" } });
  const suspendedOrgs = await orgRepo().count({ where: { status: "suspended" } });
  const totalUsers = await userRepo().count();
  const totalOrders = await orderRepo().count();

  const revenueResult = await orderRepo()
    .createQueryBuilder("o")
    .select("COALESCE(SUM(o.grand_total), 0)", "total")
    .where("o.status != :cancelled", { cancelled: "cancelled" })
    .getRawOne();

  return {
    totalOrganizations: totalOrgs,
    activeOrganizations: activeOrgs,
    trialOrganizations: trialOrgs,
    suspendedOrganizations: suspendedOrgs,
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
  const { page = 1, limit = 20, search, status } = params;
  const skip = (page - 1) * limit;

  const qb = orgRepo()
    .createQueryBuilder("org")
    .loadRelationCountAndMap("org.userCount", "org.users")
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

  const orgsWithSub = await Promise.all(
    data.map(async (org) => {
      const subscription = await subRepo().findOne({
        where: { organizationId: org.id },
        relations: ["plan"],
        order: { createdAt: "DESC" },
      });
      return { ...org, subscription };
    })
  );

  return {
    data: orgsWithSub,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function getOrganizationById(id: string) {
  const org = await orgRepo().findOne({ where: { id } });
  if (!org) return null;

  const users = await userRepo().find({
    where: { organizationId: id },
    select: ["id", "email", "name", "role", "createdAt"],
    order: { createdAt: "DESC" },
  });

  const subscription = await subRepo().findOne({
    where: { organizationId: id },
    relations: ["plan"],
    order: { createdAt: "DESC" },
  });

  const orderStats = await orderRepo()
    .createQueryBuilder("o")
    .select("COUNT(*)", "count")
    .addSelect("COALESCE(SUM(o.grand_total), 0)", "revenue")
    .where("o.organization_id = :orgId", { orgId: id })
    .andWhere("o.status != :cancelled", { cancelled: "cancelled" })
    .getRawOne();

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

export async function updateOrganizationStatus(id: string, status: OrganizationStatus) {
  const org = await orgRepo().findOne({ where: { id } });
  if (!org) return null;
  org.status = status;
  return orgRepo().save(org);
}

export async function updateOrganization(
  id: string,
  data: Partial<{ name: string; phone: string; email: string; address: string; status: OrganizationStatus }>
) {
  const org = await orgRepo().findOne({ where: { id } });
  if (!org) return null;
  Object.assign(org, data);
  return orgRepo().save(org);
}
