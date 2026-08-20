import { AppDataSource } from "../../config/data-source.js";
import { Users } from "../../models/Users.js";
import { Not } from "typeorm";

const repo = () => AppDataSource.getRepository(Users);

const SAFE_SELECT: (keyof Users)[] = ["id", "email", "name", "role", "branchId", "organizationId", "createdAt", "updatedAt"];

export async function getByBranchId(branchId: string, organizationId?: string | null) {
  const where: Record<string, unknown> = { branchId };
  if (organizationId) where.organizationId = organizationId;
  return repo().find({ where, select: SAFE_SELECT, order: { createdAt: "DESC" } });
}

export async function getById(id: string, organizationId?: string | null) {
  const where: Record<string, unknown> = { id };
  if (organizationId) where.organizationId = organizationId;
  return repo().findOne({ where, select: SAFE_SELECT });
}

export async function getByOrganizationId(organizationId: string) {
  return repo().find({
    where: { organizationId, role: Not("super_admin") },
    select: SAFE_SELECT,
    order: { createdAt: "DESC" },
  });
}

export async function deleteUser(id: string, organizationId: string, actorId: string): Promise<boolean> {
  if (id === actorId) throw new Error("Cannot delete your own account");

  const user = await repo().findOne({ where: { id, organizationId }, select: ["id", "role"] });
  if (!user) return false;
  if (user.role === "owner") throw new Error("Cannot delete the organization owner");

  const result = await repo().delete({ id, organizationId });
  return (result.affected ?? 0) > 0;
}
