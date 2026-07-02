import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../config/env.js";

export type SessionPayload = {
  userId: string;
  role: "student" | "mentor" | "admin";
  sessionId?: string;
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export function signSession(payload: SessionPayload) {
  const sessionId = payload.sessionId ?? crypto.randomUUID();
  return jwt.sign({ ...payload, sessionId }, env.jwtSecret, { expiresIn: "7d", jwtid: sessionId });
}

export function verifySession(token: string) {
  return jwt.verify(token, env.jwtSecret) as SessionPayload;
}
