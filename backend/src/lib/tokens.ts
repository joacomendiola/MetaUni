import crypto from "node:crypto";

export const REFRESH_COOKIE = "metauni_refresh";

export function generateRefreshToken(): string {
  return crypto.randomBytes(48).toString("hex");
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}
