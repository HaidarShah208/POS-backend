import { AppDataSource } from "../../config/data-source.js";
import { Users } from "../../models/Users.js";

const repo = () => AppDataSource.getRepository(Users);

export async function getByBranchId(branchId: string) {
  return repo().find({
    where: { branchId },
    select: ["id", "email", "name", "role", "branchId", "createdAt"],
    order: { createdAt: "DESC" },
  });
}

export async function getById(id: string) {
  return repo().findOne({
    where: { id },
    select: ["id", "email", "name", "role", "branchId", "createdAt"],
  });
}
