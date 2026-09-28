import { z } from "zod";
import { productLink } from "../auth/login.ts";

export const COST_LINES = [
  "quantity",
  "factory",
  "volume",
  "weight",
  "freight",
  "inland",
  "broker",
  "duties",
  "vat",
] as const;

export type CostLine = (typeof COST_LINES)[number];

export const LOT_COSTS = ["freight", "inland", "broker", "duties", "vat"] as const satisfies readonly CostLine[];

export const COST_LABEL: Record<CostLine, string> = {
  quantity: "Quantité",
  factory: "Prix usine",
  volume: "Volume du lot",
  weight: "Poids du lot",
  freight: "Fret jusqu'au port",
  inland: "Port → adresse",
  broker: "Commissionnaire en douane",
  duties: "Droits de douane",
  vat: "TVA import",
};

export const COST_UNIT: Record<CostLine, string> = {
  quantity: "pièces",
  factory: "€ par pièce",
  volume: "m³",
  weight: "kg",
  freight: "€ pour le lot",
  inland: "€ pour le lot",
  broker: "€ pour le lot",
  duties: "€ pour le lot",
  vat: "€ pour le lot",
};

export type ProjectSettings = {
  budgetTotal: number | null;
  setAside: number | null;
  salePrice: number | null;
  contributionRate: number | null;
  paymentRate: number | null;
  marginFloor: number | null;
  unitCap: number | null;
  updatedBy: string | null;
};

export type SettingKey = Exclude<keyof ProjectSettings, "updatedBy" | "unitCap">;

export const SETTING_LABEL: Record<SettingKey, string> = {
  budgetTotal: "Budget total",
  setAside: "Part mise de côté",
  salePrice: "Prix de vente visé",
  contributionRate: "Taux de cotisations",
  paymentRate: "Frais de paiement",
  marginFloor: "Seuil de marge nette",
};

export type CellSource = "fiche" | "saisie";

export type CostCell = {
  line: CostLine;
  value: number | null;
  source: CellSource | null;
  note: string | null;
  by: string | null;
};

export type MissingItem = { key: CostLine | SettingKey; label: string };

export type MarginVerdict = "incomplete" | "over-budget" | "over-target" | "below-floor" | "holds";

export type MarginResult = {
  envelope: number | null;
  quantity: number | null;
  known: number;
  cash: number | null;
  unitCost: number | null;
  unitAtLeast: number | null;
  freightShare: number | null;
  ceiling: number | null;
  netPerUnit: number | null;
  netRate: number | null;
  missing: MissingItem[];
  verdict: MarginVerdict;
  reason: string | null;
};

export type MarginView = {
  productUrl: string;
  project: ProjectSettings;
  cells: CostCell[];
  result: MarginResult;
};

function decimal(value: unknown): unknown {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return value;
  const cleaned = value.replace(/[\s\u00a0\u202f€%]/g, "").replace(",", ".");
  return cleaned === "" ? null : Number(cleaned);
}

function number(message: string) {
  return z.number({ invalid_type_error: message, required_error: message }).finite(message);
}

const zeroOrMore = (message: string) => z.preprocess(decimal, number(message).nonnegative(message).nullable());
const aboveZero = (message: string) => z.preprocess(decimal, number(message).positive(message).nullable());
const percent = (message: string) => z.preprocess(decimal, number(message).min(0, message).max(100, message).nullable());

export const projectInput = z
  .object({
    budgetTotal: aboveZero("Le budget total est un montant en euros, supérieur à zéro."),
    setAside: zeroOrMore("La part mise de côté est un montant en euros, zéro ou plus."),
    salePrice: aboveZero("Le prix de vente visé est un montant en euros, supérieur à zéro."),
    contributionRate: percent("Le taux de cotisations est un pourcentage entre 0 et 100."),
    paymentRate: percent("Les frais de paiement sont un pourcentage entre 0 et 100."),
    marginFloor: percent("Le seuil de marge est un pourcentage entre 0 et 100."),
    unitCap: aboveZero("Le coût rendu maximum est un montant en euros, supérieur à zéro."),
  })
  .refine((value) => value.budgetTotal === null || value.setAside === null || value.setAside <= value.budgetTotal, {
    message: "La part mise de côté dépasse le budget total.",
    path: ["setAside"],
  });

export type ProjectInput = z.infer<typeof projectInput>;

export const budgetTotalInput = aboveZero("Le budget total est un montant en euros, supérieur à zéro.");

export const costInput = z
  .object({
    productUrl: productLink,
    line: z.enum(COST_LINES),
    amount: zeroOrMore("Indique un nombre, zéro ou plus."),
  })
  .refine((value) => value.line !== "quantity" || value.amount === null || (Number.isInteger(value.amount) && value.amount >= 1), {
    message: "La quantité est un nombre entier de pièces, au moins 1.",
    path: ["amount"],
  });

export type CostInput = z.infer<typeof costInput>;
