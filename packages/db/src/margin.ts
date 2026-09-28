import { and, eq } from "drizzle-orm";
import { getDb } from "./client.ts";
import { costs, projects } from "./schema.ts";

export type ProjectRow = typeof projects.$inferSelect;
export type CostRow = typeof costs.$inferSelect;
export type ProjectValues = Partial<Omit<ProjectRow, "id" | "updatedAt">>;

function database() {
  const db = getDb();
  if (!db) throw new Error("DATABASE_URL manquant");
  return db;
}

export async function findProject(id: string): Promise<ProjectRow | null> {
  const rows = await database().select().from(projects).where(eq(projects.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function upsertProject(id: string, values: ProjectValues): Promise<void> {
  await database()
    .insert(projects)
    .values({ id, ...values })
    .onConflictDoUpdate({ target: projects.id, set: { ...values, updatedAt: new Date() } });
}

export async function listCosts(projectId: string, productUrl: string): Promise<CostRow[]> {
  return database()
    .select()
    .from(costs)
    .where(and(eq(costs.projectId, projectId), eq(costs.productUrl, productUrl)));
}

export async function upsertCost(
  projectId: string,
  productUrl: string,
  line: string,
  amount: number,
  updatedBy: string,
): Promise<void> {
  const db = database();
  await db.insert(projects).values({ id: projectId }).onConflictDoNothing();
  await db
    .insert(costs)
    .values({ projectId, productUrl, line, amount, updatedBy })
    .onConflictDoUpdate({
      target: [costs.projectId, costs.productUrl, costs.line],
      set: { amount, updatedBy, updatedAt: new Date() },
    });
}

export async function deleteCost(projectId: string, productUrl: string, line: string): Promise<void> {
  await database()
    .delete(costs)
    .where(and(eq(costs.projectId, projectId), eq(costs.productUrl, productUrl), eq(costs.line, line)));
}
