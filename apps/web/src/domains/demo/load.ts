"use server";

import { DEMO_BUDGET, DEMO_FACTORY, DEMO_URL, demoSheet, demoSuppliers } from "@aa/core";
import type { ProductSheet } from "@aa/contracts";

export async function loadDemo(): Promise<{
  sheet: ProductSheet;
  suppliers: ProductSheet[];
  budget: number;
  factory: string;
  url: string;
}> {
  const sheet = demoSheet(DEMO_URL);
  if (!sheet) throw new Error("La démo n'est pas disponible.");
  return { sheet, suppliers: demoSuppliers(), budget: DEMO_BUDGET, factory: DEMO_FACTORY, url: DEMO_URL };
}
