import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.ts";

type Database = PostgresJsDatabase<typeof schema>;

const globalForDb = globalThis as { aaSql?: ReturnType<typeof postgres>; aaDb?: Database };

export function getDb(): Database | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  if (!globalForDb.aaDb) {
    globalForDb.aaSql = postgres(url, { max: 4, connect_timeout: 2 });
    globalForDb.aaDb = drizzle(globalForDb.aaSql, { schema });
  }
  return globalForDb.aaDb;
}

export { schema };
