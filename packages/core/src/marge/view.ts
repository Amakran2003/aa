import type { MarginView } from "@aa/contracts";
import { recall } from "../fiche/memory.ts";
import { marginOf, type LotValues } from "./compute.ts";
import { cellsOf } from "./lot.ts";
import { projectSettings, savedCells } from "./store.ts";

export async function marginView(productUrl: string): Promise<MarginView | null> {
  const [sheet, project, saved] = await Promise.all([recall(productUrl), projectSettings(), savedCells(productUrl)]);
  if (!sheet) return null;
  const cells = cellsOf(sheet, saved);
  const lot = Object.fromEntries(cells.map((cell) => [cell.line, cell.value])) as LotValues;
  return { productUrl, project, cells, result: marginOf(project, lot) };
}
