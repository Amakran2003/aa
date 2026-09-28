import type { PriceTier, ProductSheet, Rates, Simulation, SimulationUnit } from "@aa/contracts";
import { countOf } from "../fiche/price.ts";
import { factoryOf, tierFor, volumeOf, weightOf } from "../marge/lot.ts";
import { convert, parseMoney } from "../money.ts";
import { ASK_QUANTITIES } from "./message.ts";

export const VAT_RATE = 20;
export const CONTRIBUTION_RATE = 12.3;
export const PAYMENT_RATE = 1.5;
export const RESERVE_RATE = 30;
export const TARGET_MARGIN = 30;

export function recommendedPrice(unitCost: number): number {
  const minimum = unitCost / (1 - (CONTRIBUTION_RATE + PAYMENT_RATE + TARGET_MARGIN) / 100);
  const price = Math.ceil(minimum / 10) * 10 - 1;
  return price < minimum ? price + 10 : price;
}

type Duty = { rate: number; note: string };

export function dutyOf(sheet: ProductSheet): Duty | null {
  const title = sheet.title ?? "";
  if (/\b(desk|table|workstation)\b/i.test(title) && /motor|height|electric|lifting|standing|sit/i.test(title)) {
    return { rate: 0, note: "0 % pour un meuble de bureau en métal (code 9403), à confirmer avec le commissionnaire" };
  }
  return null;
}

function unitAt(sheet: ProductSheet, quantity: number, shipping: number, duty: Duty | null): SimulationUnit | null {
  const factory = factoryOf(sheet, quantity)?.value ?? null;
  if (factory === null) return null;
  const dutyAmount = duty ? ((factory + shipping) * duty.rate) / 100 : null;
  const vat = ((factory + shipping + (dutyAmount ?? 0)) * VAT_RATE) / 100;
  return {
    factory,
    shipping,
    duty: dutyAmount,
    vat,
    total: factory + shipping + (dutyAmount ?? 0) + vat,
    tier: tierFor(sheet.tiers ?? [], quantity),
  };
}

function lowestFactory(sheet: ProductSheet): number | null {
  const prices = (sheet.tiers ?? [])
    .map((tier) => parseMoney(tier.price))
    .map((money) => (money ? convert(money.low, money.currency, "EUR", sheet.rates) : null))
    .filter((value): value is number => value !== null);
  if (prices.length > 0) return Math.min(...prices);
  const money = parseMoney(sheet.fields.find((field) => field.label === "Prix")?.value);
  return money ? convert(money.low, money.currency, "EUR", sheet.rates) : null;
}

function bands(tiers: PriceTier[], moq: number): [number, number | null][] {
  if (tiers.length === 0) return [[moq, null]];
  return tiers
    .map((tier): [number, number | null] => [Math.max(tier.from, moq), tier.to])
    .filter(([from, to]) => to === null || to >= from);
}

export function simulate({
  sheet,
  rates,
  budget,
  aside,
}: {
  sheet: ProductSheet;
  rates: Rates | null;
  budget: number;
  aside: number;
}): Simulation {
  const priced = { ...sheet, rates: sheet.rates ?? rates };
  const moq = countOf(sheet.fields.find((field) => field.label === "MOQ")?.value) ?? 1;
  if (factoryOf(priced, moq)?.value == null) return { kind: "no-price" };
  const shipping = sheet.sample?.shipping ?? null;
  const shippingEuros = shipping ? convert(shipping.amount, shipping.currency, "EUR", priced.rates) : null;
  if (!shipping || shippingEuros === null) return { kind: "no-shipping", factoryFrom: lowestFactory(priced) };

  const perPiece = shippingEuros / shipping.quantity;
  const duty = dutyOf(sheet);
  const envelope = Math.max(budget - aside, 0);
  const sampleUnit = unitAt(priced, moq, perPiece, duty);
  if (!sampleUnit) return { kind: "no-price" };
  const sample = { quantity: moq, total: sampleUnit.total * moq };

  let quantity = 0;
  for (const [from, to] of bands(priced.tiers ?? [], moq)) {
    const unit = unitAt(priced, from, perPiece, duty);
    if (!unit) continue;
    let fits = Math.floor(envelope / unit.total);
    if (to !== null) fits = Math.min(fits, to);
    if (fits >= from && fits > quantity) quantity = fits;
  }
  const unit = quantity > 0 ? unitAt(priced, quantity, perPiece, duty) : null;
  if (!unit) return { kind: "too-small", envelope, sample };

  const askQuantity = ASK_QUANTITIES[1];
  const spent = unit.total * quantity;
  return {
    kind: "ready",
    envelope,
    quantity,
    unit,
    spent,
    left: envelope - spent,
    sample,
    ask: { quantity: askQuantity, factory: factoryOf(priced, askQuantity)?.value ?? null },
    shipping,
    dutyNote: duty?.note ?? null,
    lot: {
      volume: volumeOf(priced, quantity)?.value ?? null,
      weight: weightOf(priced, quantity)?.value ?? null,
      carton: sheet.fields.find((field) => field.label === "Package Size")?.value ?? null,
    },
  };
}
