import "reflect-metadata";
import "dotenv/config";
import bcrypt from "bcrypt";
import { AppDataSource } from "../config/data-source.js";
import { Users } from "../models/Users.js";
import { Branches } from "../models/Branches.js";
import type { UserRole } from "../types/index.js";

const SALT_ROUNDS = 10;

async function seed() {
  await AppDataSource.initialize();

  const branchRepo = AppDataSource.getRepository(Branches);
  const userRepo = AppDataSource.getRepository(Users);

  let superAdmin = await userRepo.findOne({ where: { email: "superadmin@pos.com" } });
  if (!superAdmin) {
    let saBranch = await branchRepo.findOne({ where: { name: "Platform" } });
    if (!saBranch) {
      saBranch = branchRepo.create({ name: "Platform", address: null, phone: null });
      await branchRepo.save(saBranch);
    }
    const saHash = await bcrypt.hash("superadmin123", SALT_ROUNDS);
    superAdmin = userRepo.create({
      name: "Super Admin",
      email: "superadmin@pos.com",
      passwordHash: saHash,
      role: "super_admin" as UserRole,
      branchId: saBranch.id,
      organizationId: null,
    });
    await userRepo.save(superAdmin);
    console.log("Created super admin: superadmin@pos.com / superadmin123");
  } else {
    console.log("Super admin already exists: superadmin@pos.com");
  }

  await AppDataSource.destroy();
  console.log("Seed completed. Only super admin is seeded.");
  console.log("Restaurants and staff should be created via the registration flow.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
