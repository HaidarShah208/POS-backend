import { AppDataSource } from "../../config/data-source.js";
import { Customers } from "../../models/Customers.js";

const repo = () => AppDataSource.getRepository(Customers);

interface ListParams {
  organizationId: string;
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export async function getCustomers(params: ListParams) {
  const { organizationId, search, status } = params;
  const page = Math.max(params.page ?? 1, 1);
  const limit = Math.min(Math.max(params.limit ?? 50, 1), 100);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { organizationId };
  if (status) where.status = status;

  if (search && search.trim()) {
    const q = `%${search.trim()}%`;
    const qb = repo()
      .createQueryBuilder("c")
      .where("c.organizationId = :organizationId", { organizationId })
      .andWhere("(c.name ILIKE :q OR c.email ILIKE :q OR c.phone ILIKE :q)", { q });
    if (status) qb.andWhere("c.status = :status", { status });
    qb.orderBy("c.createdAt", "DESC").skip(skip).take(limit);
    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
  }

  const [data, total] = await repo().findAndCount({
    where,
    order: { createdAt: "DESC" },
    skip,
    take: limit,
  });
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
}

export async function getById(id: string, organizationId: string) {
  return repo().findOne({ where: { id, organizationId } });
}

export async function create(data: Partial<Customers>, organizationId: string) {
  const customer = repo().create({ ...data, organizationId });
  return repo().save(customer);
}

export async function update(id: string, data: Partial<Customers>, organizationId: string) {
  const customer = await repo().findOne({ where: { id, organizationId } });
  if (!customer) return null;
  Object.assign(customer, data);
  return repo().save(customer);
}

export async function remove(id: string, organizationId: string) {
  const result = await repo().delete({ id, organizationId });
  return (result.affected ?? 0) > 0;
}
