import "reflect-metadata";
import "dotenv/config";
import bcrypt from "bcrypt";
import { AppDataSource } from "../config/data-source.js";
import { Users } from "../models/Users.js";
import { Branches } from "../models/Branches.js";
import type { UserRole } from "../types/index.js";

const SALT_ROUNDS = 10;

const DEFAULT_BRANCH = {
  name: "Main Branch",
  address: "123 Main St",
  phone: null as string | null,
};

const DEFAULT_USERS = [
  { name: "Admin", email: "admin@pos.com", password: "admin123", role: "admin" as UserRole },
  { name: "Manager", email: "manager@pos.com", password: "manager123", role: "manager" as UserRole },
  { name: "Cashier", email: "cashier@pos.com", password: "cashier123", role: "cashier" as UserRole },
  { name: "Kitchen", email: "kitchen@pos.com", password: "kitchen123", role: "kitchen" as UserRole },
];

async function seed() {
  await AppDataSource.initialize();

  const branchRepo = AppDataSource.getRepository(Branches);
  const userRepo = AppDataSource.getRepository(Users);

  // Ensure default branch exists
  let branch = await branchRepo.findOne({ where: { name: DEFAULT_BRANCH.name } });
  if (!branch) {
    branch = branchRepo.create({
      name: DEFAULT_BRANCH.name,
      address: DEFAULT_BRANCH.address,
      phone: DEFAULT_BRANCH.phone,
    });
    await branchRepo.save(branch);
    console.log("Created default branch:", branch.name);
  } else {
    console.log("Using existing branch:", branch.name);
  }

  for (const u of DEFAULT_USERS) {
    const existing = await userRepo.findOne({ where: { email: u.email.toLowerCase() } });
    if (existing) {
      console.log("User already exists:", u.email);
      continue;
    }
    const passwordHash = await bcrypt.hash(u.password, SALT_ROUNDS);
    const user = userRepo.create({
      name: u.name,
      email: u.email.toLowerCase(),
      passwordHash,
      role: u.role,
      branchId: branch.id,
    });
    await userRepo.save(user);
    console.log("Created user:", u.email, "(", u.name, "-", u.role, ")");
  }

  await AppDataSource.destroy();
  console.log("Seed completed.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
