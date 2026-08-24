import "reflect-metadata";
import "dotenv/config";
import bcrypt from "bcrypt";
import { AppDataSource } from "../config/data-source.js";
import { Users } from "../models/Users.js";
import { Branches } from "../models/Branches.js";
import { Plans } from "../models/Plans.js";
import type { UserRole } from "../types/index.js";

const SALT_ROUNDS = 10;

async function reset() {
  await AppDataSource.initialize();

  console.log("Truncating all tables...");

  await AppDataSource.query(`
    DO $$ DECLARE
      r RECORD;
    BEGIN
      FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename != 'migrations')
      LOOP
        EXECUTE 'TRUNCATE TABLE "' || r.tablename || '" CASCADE';
      END LOOP;
    END $$;
  `);

  console.log("All tables cleared.");

  const branchRepo = AppDataSource.getRepository(Branches);
  const userRepo = AppDataSource.getRepository(Users);
  const planRepo = AppDataSource.getRepository(Plans);

  const saBranch = branchRepo.create({ name: "Platform", address: null, phone: null });
  await branchRepo.save(saBranch);

  const saHash = await bcrypt.hash("superadmin123", SALT_ROUNDS);
  const superAdmin = userRepo.create({
    name: "Super Admin",
    email: "superadmin@pos.com",
    passwordHash: saHash,
    role: "super_admin" as UserRole,
    branchId: saBranch.id,
    organizationId: null,
  });
  await userRepo.save(superAdmin);
  console.log("Created super admin: superadmin@pos.com / superadmin123");

  const defaultPlans = [
    { name: "Free Trial", slug: "free_trial", price: 0, features: { list: ["14-day free trial", "All features included", "No credit card required"] }, limits: { branches: 1, users: 5 }, active: true },
    { name: "Starter", slug: "starter", price: 49.99, features: { list: ["Up to 1 branch", "Up to 5 staff members", "Basic POS features", "Email support"] }, limits: { branches: 1, users: 5 }, active: true },
    { name: "Professional", slug: "professional", price: 79.99, features: { list: ["Up to 3 branches", "Up to 15 staff members", "Full POS + Kitchen Display", "Inventory management", "Priority support"] }, limits: { branches: 3, users: 15 }, active: true },
    { name: "Enterprise", slug: "enterprise", price: 149.99, features: { list: ["Unlimited branches", "Unlimited staff", "All features included", "Advanced analytics", "24/7 dedicated support"] }, limits: { branches: -1, users: -1 }, active: true },
  ];

  for (const p of defaultPlans) {
    await planRepo.save(planRepo.create(p));
  }
  console.log("Created default plans: Starter, Professional, Enterprise");

  await AppDataSource.destroy();
  console.log("Database reset complete.");
  process.exit(0);
}

reset().catch((err) => {
  console.error("Reset failed:", err);
  process.exit(1);
});
