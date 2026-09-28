import type { Currency, PriceTier } from "@aa/contracts";
import { parseMoney } from "../money.ts";

export type Amount = { amount: number; currency: Currency };

export function amountOf(price: string | null | undefined): Amount | null {
  const money = parseMoney(price);
  return money ? { amount: money.low, currency: money.currency } : null;
}

export function countOf(moq: string | null | undefined): number | null {
  const token = moq?.match(/\d[\d,]*/)?.[0];
  if (!token) return null;
  const value = Number(token.replace(/,/g, ""));
  return Number.isFinite(value) && value > 0 ? value : null;
}

function withEnds(tiers: PriceTier[]): PriceTier[] {
  const sorted = [...tiers].sort((a, b) => a.from - b.from);
  return sorted.map((tier, index) => {
    const next = sorted[index + 1];
    if (tier.to !== null || !next) return tier;
    return { ...tier, to: next.from - 1 };
  });
}

function firstRun(blob: string, pattern: RegExp, read: (match: RegExpMatchArray) => PriceTier | null): PriceTier[] {
  const tiers: PriceTier[] = [];
  const seen = new Set<number>();
  let end = -1;
  for (const match of blob.matchAll(pattern)) {
    const start = match.index ?? 0;
    if (end >= 0 && start - end > 60) break;
    const tier = read(match);
    if (!tier || seen.has(tier.from)) continue;
    seen.add(tier.from);
    tiers.push(tier);
    end = start + match[0].length;
  }
  return tiers;
}

export function tiersOf(blob: string): PriceTier[] {
  const ladder = firstRun(
    blob,
    /((?:US\s*)?\$|€)\s*([\d.,]+)\s+(≥\s*)?(\d[\d,]*)(?:\s*-\s*(\d[\d,]*))?\s*(?:pieces?|sets?|units?|pairs?)\b(?!\s*\+)/gi,
    (match) => {
      const from = Number(match[4]?.replace(/,/g, ""));
      if (!Number.isFinite(from)) return null;
      const to = match[5] && !match[3] ? Number(match[5].replace(/,/g, "")) : null;
      return { from, to, price: `${match[1].replace(/\s+/g, " ")}${match[2]}` };
    },
  );
  if (ladder.length > 1) return withEnds(ladder);
  const plus = firstRun(
    blob,
    /US\s*\$\s*([\d.,]+)\s+(?:US\s*\$\s*([\d.,]+)\s+)?(\d[\d,]*)\s*(?:pieces?|sets?)\s*\+/gi,
    (match) => {
      const from = Number(match[3]?.replace(/,/g, ""));
      const prices = [match[1], match[2]]
        .filter((value): value is string => Boolean(value))
        .map((value) => ({ value, amount: Number(value.replace(/,/g, "")) }))
        .filter((price) => Number.isFinite(price.amount))
        .sort((a, b) => a.amount - b.amount);
      const current = prices[0]?.value;
      return Number.isFinite(from) && current ? { from, to: null, price: `US $${current}` } : null;
    },
  );
  return plus.length > 1 ? withEnds(plus) : [];
}

export function tierRange(tiers: PriceTier[]): string | null {
  const priced = tiers
    .map((tier) => ({ tier, amount: amountOf(tier.price)?.amount ?? null }))
    .filter((row): row is { tier: PriceTier; amount: number } => row.amount !== null)
    .sort((a, b) => a.amount - b.amount);
  const low = priced[0]?.tier.price;
  const high = priced.at(-1)?.tier.price;
  if (!low || !high) return null;
  return low === high ? low : `${low} - ${high}`;
}
