import "reflect-metadata";
import "dotenv/config";
import bcrypt from "bcrypt";
import { AppDataSource } from "../config/data-source.js";
import { Users } from "../models/Users.js";
import { Branches } from "../models/Branches.js";
import { Organizations } from "../models/Organizations.js";
import { Plans } from "../models/Plans.js";
import { Subscriptions } from "../models/Subscriptions.js";
import { Categories } from "../models/Categories.js";
import { Products } from "../models/Products.js";
import type { UserRole } from "../types/index.js";

const SALT_ROUNDS = 10;

async function seed() {
  await AppDataSource.initialize();

  const orgRepo = AppDataSource.getRepository(Organizations);
  const branchRepo = AppDataSource.getRepository(Branches);
  const userRepo = AppDataSource.getRepository(Users);
  const planRepo = AppDataSource.getRepository(Plans);
  const subRepo = AppDataSource.getRepository(Subscriptions);
  const catRepo = AppDataSource.getRepository(Categories);
  const productRepo = AppDataSource.getRepository(Products);

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
    console.log("Created super admin: superadmin@pos.com");
  } else {
    console.log("Super admin already exists");
  }

  let org = await orgRepo.findOne({ where: { slug: "demo-restaurant" } });
  if (!org) {
    org = orgRepo.create({
      name: "Demo Restaurant",
      slug: "demo-restaurant",
      email: "owner@demo.com",
      phone: "+1234567890",
      address: "456 Demo Ave",
      status: "active",
    });
    await orgRepo.save(org);
    console.log("Created demo organization:", org.name);
  } else {
    console.log("Using existing demo organization:", org.name);
  }

  let branch = await branchRepo.findOne({ where: { name: "Main Branch", organizationId: org.id } });
  if (!branch) {
    branch = branchRepo.create({
      name: "Main Branch",
      address: "456 Demo Ave",
      phone: "+1234567890",
      organizationId: org.id,
    });
    await branchRepo.save(branch);
    console.log("Created demo branch:", branch.name);
  }

  const plan = await planRepo.findOne({ where: { slug: "professional" } });
  if (plan) {
    const existingSub = await subRepo.findOne({ where: { organizationId: org.id } });
    if (!existingSub) {
      const sub = subRepo.create({
        organizationId: org.id,
        planId: plan.id,
        status: "active",
        startsAt: new Date(),
      });
      await subRepo.save(sub);
      console.log("Created professional subscription for demo org");
    }
  }

  const demoUsers: { name: string; email: string; password: string; role: UserRole }[] = [
    { name: "Owner", email: "owner@demo.com", password: "owner123", role: "owner" },
    { name: "Admin", email: "admin@demo.com", password: "admin123", role: "admin" },
    { name: "Cashier", email: "cashier@demo.com", password: "cashier123", role: "cashier" },
    { name: "Kitchen", email: "kitchen@demo.com", password: "kitchen123", role: "kitchen" },
  ];

  for (const u of demoUsers) {
    const existing = await userRepo.findOne({ where: { email: u.email } });
    if (existing) {
      console.log("User already exists:", u.email);
      continue;
    }
    const passwordHash = await bcrypt.hash(u.password, SALT_ROUNDS);
    const user = userRepo.create({
      name: u.name,
      email: u.email,
      passwordHash,
      role: u.role,
      branchId: branch.id,
      organizationId: org.id,
    });
    await userRepo.save(user);
    console.log("Created user:", u.email, "(", u.name, "-", u.role, ")");
  }

  const demoCategories = [
    { name: "Burgers", slug: "burgers" },
    { name: "Beverages", slug: "beverages" },
    { name: "Sides", slug: "sides" },
    { name: "Desserts", slug: "desserts" },
  ];

  for (const c of demoCategories) {
    const existing = await catRepo.findOne({ where: { slug: c.slug, organizationId: org.id } });
    if (existing) continue;
    const cat = catRepo.create({ ...c, organizationId: org.id, sortOrder: 0 });
    await catRepo.save(cat);
    console.log("Created category:", c.name);
  }

  const burgersCategory = await catRepo.findOne({ where: { slug: "burgers", organizationId: org.id } });
  const beveragesCategory = await catRepo.findOne({ where: { slug: "beverages", organizationId: org.id } });

  if (burgersCategory) {
    const existing = await productRepo.findOne({ where: { name: "Classic Burger", organizationId: org.id } });
    if (!existing) {
      const products = [
        { name: "Classic Burger", price: 9.99, categoryId: burgersCategory.id },
        { name: "Cheese Burger", price: 11.99, categoryId: burgersCategory.id },
        { name: "Double Burger", price: 14.99, categoryId: burgersCategory.id },
      ];
      for (const p of products) {
        const prod = productRepo.create({ ...p, organizationId: org.id, status: "active" });
        await productRepo.save(prod);
        console.log("Created product:", p.name);
      }
    }
  }

  if (beveragesCategory) {
    const existing = await productRepo.findOne({ where: { name: "Cola", organizationId: org.id } });
    if (!existing) {
      const products = [
        { name: "Cola", price: 2.99, categoryId: beveragesCategory.id },
        { name: "Fresh Juice", price: 4.99, categoryId: beveragesCategory.id },
      ];
      for (const p of products) {
        const prod = productRepo.create({ ...p, organizationId: org.id, status: "active" });
        await productRepo.save(prod);
        console.log("Created product:", p.name);
      }
    }
  }

  await AppDataSource.destroy();
  console.log("Seed completed.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
