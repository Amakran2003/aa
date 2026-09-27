import { eq } from "drizzle-orm";
import { getDb } from "./client.ts";
import { sheets } from "./schema.ts";

export async function findSheet(url: string): Promise<unknown | null> {
  const db = getDb();
  if (!db) return null;
  const rows = await db.select({ payload: sheets.payload }).from(sheets).where(eq(sheets.url, url)).limit(1);
  return rows[0]?.payload ?? null;
}

export async function upsertSheet(url: string, payload: unknown, htmlKey: string | null): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db
    .insert(sheets)
    .values({ url, payload, htmlKey })
    .onConflictDoUpdate({
      target: sheets.url,
      set: { payload, htmlKey, updatedAt: new Date() },
    });
}
