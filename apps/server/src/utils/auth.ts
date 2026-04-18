import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export type SessionPayload = {
  userId: string;
  role: "student" | "mentor" | "admin";
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export function signSession(payload: SessionPayload) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: "7d" });
}

export function verifySession(token: string) {
  return jwt.verify(token, env.jwtSecret) as SessionPayload;
}
