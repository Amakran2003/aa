"use server";

import { cookies } from "next/headers";
import type { MarginView } from "@aa/contracts";
import { budgetTotalInput, costInput, projectInput, sessionCookie } from "@aa/contracts";
import { marginView, openSession, saveBudgetTotal, saveCost, saveProjectSettings } from "@aa/core";

export type MarginResponse = {
  error?: string;
  fieldErrors?: Record<string, string>;
  view?: MarginView;
};

const EXPIRED = "La session a expiré. Reconnecte-toi.";
const FAILED = "La base n'a pas répondu. Réessaie.";

async function author(): Promise<string | null> {
  const token = (await cookies()).get(sessionCookie)?.value;
  return openSession(token)?.email ?? null;
}

async function viewOf(productUrl: string): Promise<MarginResponse> {
  const view = await marginView(productUrl);
  return view ? { view } : { error: "Fiche introuvable. Relance l'analyse du lien." };
}

export async function loadMargin(productUrl: string): Promise<MarginResponse> {
  if (!(await author())) return { error: EXPIRED };
  try {
    return await viewOf(productUrl);
  } catch (error) {
    console.error("Marge non lue :", error);
    return { error: FAILED };
  }
}

export async function saveBudget(productUrl: string, values: Record<string, string>): Promise<MarginResponse> {
  const by = await author();
  if (!by) return { error: EXPIRED };
  const parsed = projectInput.safeParse(values);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "");
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { error: "Vérifie les champs signalés.", fieldErrors };
  }
  try {
    await saveProjectSettings(parsed.data, by);
    return await viewOf(productUrl);
  } catch (error) {
    console.error("Budget non enregistré :", error);
    return { error: FAILED };
  }
}

export async function saveCostCell(productUrl: string, line: string, amount: string): Promise<MarginResponse> {
  const by = await author();
  if (!by) return { error: EXPIRED };
  const parsed = costInput.safeParse({ productUrl, line, amount });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Valeur refusée." };
  try {
    await saveCost(parsed.data.productUrl, parsed.data.line, parsed.data.amount, by);
    return await viewOf(productUrl);
  } catch (error) {
    console.error("Case non enregistrée :", error);
    return { error: FAILED };
  }
}

export async function keepBudgetTotal(amount: number): Promise<void> {
  const by = await author();
  if (!by) return;
  const parsed = budgetTotalInput.safeParse(amount);
  if (!parsed.success || parsed.data === null) return;
  try {
    await saveBudgetTotal(parsed.data, by);
  } catch (error) {
    console.error("Budget total non enregistré :", error);
  }
}
