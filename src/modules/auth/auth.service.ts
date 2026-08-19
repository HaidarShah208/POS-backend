import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../../config/data-source.js";
import { Users } from "../../models/Users.js";
import { Organizations } from "../../models/Organizations.js";
import { Branches } from "../../models/Branches.js";
import { Subscriptions } from "../../models/Subscriptions.js";
import { Plans } from "../../models/Plans.js";
import type { UserRole } from "../../types/index.js";
import { env } from "../../config/env.js";
import type { JwtPayload } from "../../types/index.js";

const userRepo = () => AppDataSource.getRepository(Users);
const orgRepo = () => AppDataSource.getRepository(Organizations);
const branchRepo = () => AppDataSource.getRepository(Branches);
const subscriptionRepo = () => AppDataSource.getRepository(Subscriptions);
const planRepo = () => AppDataSource.getRepository(Plans);

const SALT_ROUNDS = 10;

export interface AuthUserResponse {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  branchId: string;
  organizationId: string | null;
}

export interface LoginResult {
  user: AuthUserResponse;
  token: string;
  subscription?: {
    status: string;
    planSlug: string;
    trialEndsAt: string | null;
  };
}

export interface RegisterOrgInput {
  restaurantName: string;
  ownerName: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
}

export async function register(
  name: string,
  email: string,
  password: string,
  role: UserRole,
  branchId: string,
  organizationId?: string
): Promise<AuthUserResponse> {
  const existing = await userRepo().findOne({ where: { email: email.toLowerCase() } });
  if (existing) throw new Error("Email already registered");

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = userRepo().create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    role,
    branchId,
    organizationId: organizationId || null,
  });
  await userRepo().save(user);
  return toAuthUser(user);
}

export async function registerOrganization(input: RegisterOrgInput): Promise<LoginResult> {
  const existing = await userRepo().findOne({ where: { email: input.email.toLowerCase() } });
  if (existing) throw new Error("Email already registered");

  const slug = input.restaurantName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const existingOrg = await orgRepo().findOne({ where: { slug } });
  if (existingOrg) throw new Error("Restaurant name already taken");

  return AppDataSource.transaction(async (manager) => {
    const org = manager.create(Organizations, {
      name: input.restaurantName,
      slug,
      phone: input.phone || null,
      email: input.email.toLowerCase(),
      address: input.address || null,
      status: "trial",
    });
    await manager.save(org);

    const branch = manager.create(Branches, {
      name: "Main Branch",
      organizationId: org.id,
      address: input.address || null,
      phone: input.phone || null,
    });
    await manager.save(branch);

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
    const owner = manager.create(Users, {
      name: input.ownerName,
      email: input.email.toLowerCase(),
      passwordHash,
      role: "owner" as UserRole,
      branchId: branch.id,
      organizationId: org.id,
    });
    await manager.save(owner);

    const trialPlan = await manager.findOne(Plans, { where: { slug: "free_trial" } });
    if (!trialPlan) throw new Error("Trial plan not found");

    const now = new Date();
    const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const subscription = manager.create(Subscriptions, {
      organizationId: org.id,
      planId: trialPlan.id,
      status: "trialing",
      trialStartsAt: now,
      trialEndsAt: trialEnd,
    });
    await manager.save(subscription);

    const payload: JwtPayload = {
      sub: owner.id,
      email: owner.email,
      role: owner.role as UserRole,
      branchId: branch.id,
      organizationId: org.id,
    };
    const token = signToken(payload);

    return {
      user: toAuthUser(owner),
      token,
      subscription: {
        status: subscription.status,
        planSlug: trialPlan.slug,
        trialEndsAt: trialEnd.toISOString(),
      },
    };
  });
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const user = await userRepo().findOne({
    where: { email: email.toLowerCase() },
    select: ["id", "email", "name", "role", "branchId", "organizationId", "passwordHash"],
  });
  if (!user) throw new Error("Invalid email or password");

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new Error("Invalid email or password");

  const payload: JwtPayload = {
    sub: user.id,
    email: user.email,
    role: user.role as UserRole,
    branchId: user.branchId,
    organizationId: user.organizationId,
  };
  const token = jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"],
  });

  let subscription: LoginResult["subscription"];
  if (user.organizationId) {
    const sub = await subscriptionRepo().findOne({
      where: { organizationId: user.organizationId },
      relations: ["plan"],
      order: { createdAt: "DESC" },
    });
    if (sub) {
      subscription = {
        status: sub.status,
        planSlug: (sub.plan as Plans)?.slug || "free_trial",
        trialEndsAt: sub.trialEndsAt?.toISOString() || null,
      };
    }
  }

  return { user: toAuthUser(user), token, subscription };
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"],
  });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwtSecret) as JwtPayload;
}

export async function findUserById(id: string): Promise<AuthUserResponse | null> {
  const user = await userRepo().findOne({ where: { id } });
  return user ? toAuthUser(user) : null;
}

function toAuthUser(user: Users): AuthUserResponse {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as UserRole,
    branchId: user.branchId,
    organizationId: user.organizationId,
  };
}
