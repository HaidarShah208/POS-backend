import { AppDataSource } from "../../config/data-source.js";
import { Users } from "../../models/Users.js";

const repo = () => AppDataSource.getRepository(Users);

export async function getByBranchId(branchId: string, organizationId?: string | null) {
  const where: Record<string, unknown> = { branchId };
  if (organizationId) where.organizationId = organizationId;
  return repo().find({
    where,
    select: ["id", "email", "name", "role", "branchId", "organizationId", "createdAt"],
    order: { createdAt: "DESC" },
  });
}

export async function getById(id: string, organizationId?: string | null) {
  const where: Record<string, unknown> = { id };
  if (organizationId) where.organizationId = organizationId;
  return repo().findOne({
    where,
    select: ["id", "email", "name", "role", "branchId", "organizationId", "createdAt"],
  });
}

export async function getByOrganizationId(organizationId: string) {
  return repo().find({
    where: { organizationId },
    select: ["id", "email", "name", "role", "branchId", "organizationId", "createdAt"],
    order: { createdAt: "DESC" },
  });
}
