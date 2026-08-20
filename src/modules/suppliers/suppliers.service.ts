import { AppDataSource } from "../../config/data-source.js";
import { Suppliers } from "../../models/Suppliers.js";

const repo = () => AppDataSource.getRepository(Suppliers);

interface ListParams {
  organizationId: string;
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export async function getSuppliers(params: ListParams) {
  const { organizationId, search, status } = params;
  const page = Math.max(params.page ?? 1, 1);
  const limit = Math.min(Math.max(params.limit ?? 50, 1), 100);
  const skip = (page - 1) * limit;

  if (search && search.trim()) {
    const q = `%${search.trim()}%`;
    const qb = repo()
      .createQueryBuilder("s")
      .where("s.organizationId = :organizationId", { organizationId })
      .andWhere("(s.name ILIKE :q OR s.email ILIKE :q OR s.contactPerson ILIKE :q)", { q });
    if (status) qb.andWhere("s.status = :status", { status });
    qb.orderBy("s.createdAt", "DESC").skip(skip).take(limit);
    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
  }

  const where: Record<string, unknown> = { organizationId };
  if (status) where.status = status;

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

export async function create(data: Partial<Suppliers>, organizationId: string) {
  const supplier = repo().create({ ...data, organizationId });
  return repo().save(supplier);
}

export async function update(id: string, data: Partial<Suppliers>, organizationId: string) {
  const supplier = await repo().findOne({ where: { id, organizationId } });
  if (!supplier) return null;
  Object.assign(supplier, data);
  return repo().save(supplier);
}

export async function remove(id: string, organizationId: string) {
  const result = await repo().delete({ id, organizationId });
  return (result.affected ?? 0) > 0;
}
