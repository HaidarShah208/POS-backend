import { AppDataSource } from "../../config/data-source.js";
import { Branches } from "../../models/Branches.js";

const repo = () => AppDataSource.getRepository(Branches);

export async function getAll(organizationId?: string | null) {
  const where: Record<string, unknown> = {};
  if (organizationId) where.organizationId = organizationId;
  return repo().find({ where, order: { name: "ASC" } });
}

export async function getById(id: string, organizationId?: string | null) {
  const where: Record<string, unknown> = { id };
  if (organizationId) where.organizationId = organizationId;
  return repo().findOne({ where });
}

export async function create(data: { name: string; address?: string; phone?: string }, organizationId?: string | null) {
  const branch = repo().create({
    ...data,
    organizationId: organizationId || null,
  });
  return repo().save(branch);
}
