import type { CostCell, CostLine, PriceTier, ProductSheet } from "@aa/contracts";
import { COST_LINES } from "@aa/contracts";
import { countOf } from "../fiche/price.ts";
import { convert, parseMoney } from "../money.ts";

type ReadCell = { value: number | null; note: string };

export type SavedCell = { value: number; by: string };
export type SavedCells = Partial<Record<CostLine, SavedCell>>;

const decimal = (value: number, digits: number) => Math.round(value * 10 ** digits) / 10 ** digits;
const number = (value: number) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(value);

function field(sheet: ProductSheet, label: string): string | null {
  return sheet.fields.find((item) => item.label === label)?.value ?? null;
}

function tierLabel(tier: PriceTier): string {
  if (tier.to === null) return `${tier.from} et plus`;
  return tier.to === tier.from ? `${tier.from}` : `${tier.from} à ${tier.to}`;
}

export function tierFor(tiers: PriceTier[], quantity: number | null): PriceTier | null {
  const sorted = [...tiers].sort((a, b) => a.from - b.from);
  const first = sorted[0];
  if (!first) return null;
  if (quantity === null || quantity < first.from) return first;
  return sorted.find((tier) => quantity >= tier.from && (tier.to === null || quantity <= tier.to)) ?? sorted.at(-1) ?? first;
}

function rateDay(sheet: ProductSheet): string {
  const date = sheet.rates?.date ? new Date(`${sheet.rates.date}T00:00:00`) : null;
  return date && !Number.isNaN(date.getTime()) ? new Intl.DateTimeFormat("fr-FR").format(date) : "";
}

export function moqOf(sheet: ProductSheet): ReadCell | null {
  const raw = field(sheet, "MOQ");
  const count = countOf(raw);
  return count === null ? null : { value: count, note: `MOQ de la fiche : ${raw}` };
}

export function factoryOf(sheet: ProductSheet, quantity: number | null): ReadCell | null {
  const tier = tierFor(sheet.tiers ?? [], quantity);
  const text = tier?.price ?? field(sheet, "Prix");
  const money = parseMoney(text);
  if (!money) return null;
  const basis = tier ? `palier ${tierLabel(tier)} pièces` : money.high !== null ? "prix le plus bas affiché" : "prix affiché";
  const amount = convert(money.low, money.currency, "EUR", sheet.rates);
  if (amount === null) return { value: null, note: `Affiché ${text}, taux de change pas encore arrivé` };
  const shown = money.currency === "EUR" ? `Affiché ${text}` : `Affiché ${text}, taux BCE du ${rateDay(sheet)}`;
  return { value: decimal(amount, 2), note: `${shown} · ${basis}` };
}

function cartonCubicMeters(raw: string | null): number | null {
  if (!raw) return null;
  const sides = [...raw.matchAll(/\d+(?:[.,]\d+)?/g)].map((match) => Number(match[0].replace(",", ".")));
  const unit = raw.match(/(?<=[\d\s])(mm|cm|m)\b/i)?.[1]?.toLowerCase();
  if (sides.length !== 3 || !unit || sides.some((side) => !Number.isFinite(side) || side <= 0)) return null;
  const factor = unit === "mm" ? 1e-9 : unit === "cm" ? 1e-6 : 1;
  return sides.reduce((product, side) => product * side, 1) * factor;
}

export function volumeOf(sheet: ProductSheet, quantity: number | null): ReadCell | null {
  const raw = field(sheet, "Package Size");
  const carton = cartonCubicMeters(raw);
  if (carton === null) return null;
  if (quantity === null) return { value: null, note: `Carton de la fiche : ${raw}, quantité manquante` };
  return { value: decimal(carton * quantity, 3), note: `Carton de la fiche : ${raw}, × ${quantity} pièces` };
}

export function weightOf(sheet: ProductSheet, quantity: number | null): ReadCell | null {
  const raw = field(sheet, "Package Gross Weight");
  const kilos = raw?.match(/(\d+(?:[.,]\d+)?)\s*kg\b/i)?.[1];
  const perPiece = kilos ? Number(kilos.replace(",", ".")) : null;
  if (perPiece === null || !Number.isFinite(perPiece) || perPiece <= 0) return null;
  if (quantity === null) return { value: null, note: `Poids de la fiche : ${number(perPiece)} kg, quantité manquante` };
  return { value: decimal(perPiece * quantity, 1), note: `Poids de la fiche : ${number(perPiece)} kg × ${quantity} pièces` };
}

function fromSheet(line: CostLine, read: ReadCell | null): CostCell {
  if (!read) return { line, value: null, source: null, note: null, by: null };
  return { line, value: read.value, source: read.value === null ? null : "fiche", note: read.note, by: null };
}

function fromSaved(line: CostLine, saved: SavedCells): CostCell | null {
  const cell = saved[line];
  return cell ? { line, value: cell.value, source: "saisie", note: null, by: cell.by } : null;
}

export function cellsOf(sheet: ProductSheet, saved: SavedCells): CostCell[] {
  const quantityCell = fromSaved("quantity", saved) ?? fromSheet("quantity", moqOf(sheet));
  const quantity = quantityCell.value;
  const read: Partial<Record<CostLine, ReadCell | null>> = {
    factory: factoryOf(sheet, quantity),
    volume: volumeOf(sheet, quantity),
    weight: weightOf(sheet, quantity),
  };
  return COST_LINES.map((line) => {
    if (line === "quantity") return quantityCell;
    return fromSaved(line, saved) ?? fromSheet(line, read[line] ?? null);
  });
}
