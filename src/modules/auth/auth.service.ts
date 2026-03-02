import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../../config/data-source.js";
import { Users } from "../../models/Users.js";
import type { UserRole } from "../../types/index.js";
import { env } from "../../config/env.js";
import type { JwtPayload } from "../../types/index.js";

const userRepo = () => AppDataSource.getRepository(Users);

const SALT_ROUNDS = 10;

export interface AuthUserResponse {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  branchId: string;
}

export interface LoginResult {
  user: AuthUserResponse;
  token: string;
}

export async function register(
  name: string,
  email: string,
  password: string,
  role: UserRole,
  branchId: string
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
  });
  await userRepo().save(user);
  return toAuthUser(user);
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const user = await userRepo().findOne({
    where: { email: email.toLowerCase() },
    select: ["id", "email", "name", "role", "branchId", "passwordHash"],
  });
  if (!user) throw new Error("Invalid email or password");

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new Error("Invalid email or password");

  const payload: JwtPayload = {
    sub: user.id,
    email: user.email,
    role: user.role as UserRole,
    branchId: user.branchId,
  };
  const token = jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"],
  });
  return { user: toAuthUser(user), token };
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
  };
}
