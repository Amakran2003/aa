import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 32;
const SESSION_MS = 1000 * 60 * 60 * 24 * 14;
const DUMMY_HASH =
  "AAAAAAAAAAAAAAAAAAAAAA.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

export type Session = { email: string };

type Account = { email: string; hash: string };

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, KEY_LENGTH);
  return `${salt.toString("base64url")}.${hash.toString("base64url")}`;
}

function matches(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(".");
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "base64url");
  const actual = scryptSync(password, Buffer.from(salt, "base64url"), expected.length);
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

export function accounts(): Account[] {
  return (process.env.AA_ACCOUNTS ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .flatMap((entry) => {
      const splitAt = entry.indexOf(":");
      if (splitAt < 1) return [];
      const email = entry.slice(0, splitAt).trim().toLowerCase();
      const hash = entry.slice(splitAt + 1).trim();
      if (!email || !hash.includes(".")) return [];
      return [{ email, hash }];
    });
}

export function authConfigured(): boolean {
  return Boolean(process.env.AUTH_SECRET) && accounts().length > 0;
}

export function verifyLogin(email: string, password: string): boolean {
  const account = accounts().find((item) => item.email === email.trim().toLowerCase());
  return matches(password, account?.hash ?? DUMMY_HASH) && Boolean(account);
}

function secret(): string {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET manquant");
  return value;
}

export function sealSession(email: string, now = Date.now()): string {
  const body = Buffer.from(
    JSON.stringify({ email: email.toLowerCase(), exp: now + SESSION_MS }),
  ).toString("base64url");
  const signature = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${signature}`;
}

export function openSession(token: string | undefined, now = Date.now()): Session | null {
  if (!token || !process.env.AUTH_SECRET) return null;
  const splitAt = token.lastIndexOf(".");
  if (splitAt < 1) return null;
  const body = token.slice(0, splitAt);
  const signature = token.slice(splitAt + 1);
  const expected = createHmac("sha256", secret()).update(body).digest("base64url");
  const given = Buffer.from(signature);
  const wanted = Buffer.from(expected);
  if (given.length !== wanted.length || !timingSafeEqual(given, wanted)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString()) as {
      email?: unknown;
      exp?: unknown;
    };
    if (typeof parsed.email !== "string" || typeof parsed.exp !== "number") return null;
    if (parsed.exp < now) return null;
    return { email: parsed.email };
  } catch {
    return null;
  }
}
