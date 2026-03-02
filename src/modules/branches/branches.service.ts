import { AppDataSource } from "../../config/data-source.js";
import { Branches } from "../../models/Branches.js";

const repo = () => AppDataSource.getRepository(Branches);

export async function getAll() {
  return repo().find({ order: { name: "ASC" } });
}

export async function getById(id: string) {
  return repo().findOne({ where: { id } });
}

export async function create(data: { name: string; address?: string; phone?: string }) {
  const branch = repo().create(data);
  return repo().save(branch);
}
