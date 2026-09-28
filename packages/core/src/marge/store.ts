import type { CostLine, ProjectInput, ProjectSettings } from "@aa/contracts";
import { COST_LINES } from "@aa/contracts";
import { deleteCost, findProject, listCosts, upsertCost, upsertProject } from "@aa/db";
import type { SavedCells } from "./lot.ts";

export const PROJECT_ID = "principal";

const EMPTY: ProjectSettings = {
  budgetTotal: null,
  setAside: null,
  salePrice: null,
  contributionRate: null,
  paymentRate: null,
  marginFloor: null,
  unitCap: null,
  updatedBy: null,
};

export async function projectSettings(): Promise<ProjectSettings> {
  const row = await findProject(PROJECT_ID);
  if (!row) return EMPTY;
  return {
    budgetTotal: row.budgetTotal,
    setAside: row.setAside,
    salePrice: row.salePrice,
    contributionRate: row.contributionRate,
    paymentRate: row.paymentRate,
    marginFloor: row.marginFloor,
    unitCap: row.unitCap,
    updatedBy: row.updatedBy,
  };
}

export async function saveProjectSettings(input: ProjectInput, by: string): Promise<void> {
  await upsertProject(PROJECT_ID, { ...input, updatedBy: by });
}

export async function saveBudgetTotal(amount: number, by: string): Promise<void> {
  await upsertProject(PROJECT_ID, { budgetTotal: amount, updatedBy: by });
}

export async function savedCells(productUrl: string): Promise<SavedCells> {
  const rows = await listCosts(PROJECT_ID, productUrl);
  const known = new Set<string>(COST_LINES);
  const saved: SavedCells = {};
  for (const row of rows) {
    if (known.has(row.line)) saved[row.line as CostLine] = { value: row.amount, by: row.updatedBy };
  }
  return saved;
}

export async function saveCost(productUrl: string, line: CostLine, amount: number | null, by: string): Promise<void> {
  if (amount === null) await deleteCost(PROJECT_ID, productUrl, line);
  else await upsertCost(PROJECT_ID, productUrl, line, amount, by);
}
