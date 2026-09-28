import type { CostLine, MarginResult, MissingItem, ProjectSettings, SettingKey } from "@aa/contracts";
import { COST_LABEL, LOT_COSTS, SETTING_LABEL } from "@aa/contracts";
import { formatMoney } from "../money.ts";

export type LotValues = Record<CostLine, number | null>;

const REQUIRED_SETTINGS: SettingKey[] = [
  "budgetTotal",
  "setAside",
  "salePrice",
  "contributionRate",
  "paymentRate",
  "marginFloor",
];

const euros = (amount: number) => formatMoney(amount, "EUR");

export function netMargin(
  salePrice: number,
  unitCost: number,
  contributionRate: number,
  paymentRate: number,
): { perUnit: number; rate: number } {
  const perUnit = salePrice - unitCost - (salePrice * (contributionRate + paymentRate)) / 100;
  return { perUnit, rate: perUnit / salePrice };
}

export function marginOf(project: ProjectSettings, lot: LotValues): MarginResult {
  const missing: MissingItem[] = [];
  for (const line of ["quantity", "factory", "volume", "weight", ...LOT_COSTS] as const) {
    if (lot[line] === null) missing.push({ key: line, label: COST_LABEL[line] });
  }
  for (const key of REQUIRED_SETTINGS) {
    if (project[key] === null) missing.push({ key, label: SETTING_LABEL[key] });
  }

  const quantity = lot.quantity !== null && lot.quantity > 0 ? lot.quantity : null;
  const envelope =
    project.budgetTotal !== null && project.setAside !== null ? project.budgetTotal - project.setAside : null;
  const lotCosts = LOT_COSTS.reduce((sum, line) => sum + (lot[line] ?? 0), 0);
  const lotComplete = LOT_COSTS.every((line) => lot[line] !== null);
  const goods = quantity !== null && lot.factory !== null ? quantity * lot.factory : 0;
  const known = goods + lotCosts;
  const cash = quantity !== null && lot.factory !== null && lotComplete ? known : null;
  const unitCost = cash !== null && quantity !== null ? cash / quantity : null;
  const unitAtLeast = quantity !== null && known > 0 ? known / quantity : null;
  const freightShare = cash ? ((lot.freight ?? 0) + (lot.inland ?? 0)) / cash : null;
  const ceiling = envelope !== null && quantity !== null && lotComplete ? (envelope - lotCosts) / quantity : null;

  let netPerUnit: number | null = null;
  let netRate: number | null = null;
  if (unitCost !== null && project.salePrice && project.contributionRate !== null && project.paymentRate !== null) {
    const net = netMargin(project.salePrice, unitCost, project.contributionRate, project.paymentRate);
    netPerUnit = net.perUnit;
    netRate = net.rate;
  }

  const base = {
    envelope,
    quantity,
    known,
    cash,
    unitCost,
    unitAtLeast,
    freightShare,
    ceiling,
    netPerUnit,
    netRate,
    missing,
  };

  if (envelope !== null && envelope <= 0) {
    return { ...base, verdict: "over-budget", reason: "La part mise de côté prend tout le budget." };
  }
  if (envelope !== null && (known > envelope || (ceiling !== null && ceiling <= 0))) {
    return {
      ...base,
      verdict: "over-budget",
      reason: `Déjà ${euros(known)} chiffrés pour une enveloppe de ${euros(envelope)}.`,
    };
  }
  if (project.unitCap !== null && unitAtLeast !== null && unitAtLeast > project.unitCap) {
    return {
      ...base,
      verdict: "over-target",
      reason: `${cash === null ? "Au moins " : ""}${euros(unitAtLeast)} par pièce, au-dessus du coût rendu maximum de ${euros(project.unitCap)}.`,
    };
  }
  if (missing.length > 0) {
    return { ...base, verdict: "incomplete", reason: null };
  }
  if (netRate !== null && project.marginFloor !== null && netRate * 100 < project.marginFloor) {
    return {
      ...base,
      verdict: "below-floor",
      reason: `Marge nette de ${Math.round(netRate * 1000) / 10} %, sous le seuil de ${project.marginFloor} %.`,
    };
  }
  return { ...base, verdict: "holds", reason: null };
}
