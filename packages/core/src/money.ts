import type { Currency, Rates } from "@aa/contracts";

export const CURRENCIES: Currency[] = ["EUR", "USD", "CNY"];
export const DEFAULT_CURRENCY: Currency = "EUR";

export type Money = { low: number; high: number | null; currency: Currency };

function currencyOf(text: string): Currency | null {
  if (/€|EUR/i.test(text)) return "EUR";
  if (/¥|CNY|RMB/i.test(text)) return "CNY";
  if (/\$|USD/i.test(text)) return "USD";
  return null;
}

function numberOf(token: string, currency: Currency): number | null {
  const raw = token.replace(/[\s\u00a0\u202f]/g, "").replace(/[.,]$/, "");
  if (!raw) return null;
  let normalized = raw;
  if (raw.includes(",") && raw.includes(".")) {
    normalized = raw.lastIndexOf(",") > raw.lastIndexOf(".") ? raw.replace(/\./g, "").replace(",", ".") : raw.replace(/,/g, "");
  } else if (raw.includes(",")) {
    normalized = currency === "EUR" && /,\d{1,2}$/.test(raw) ? raw.replace(",", ".") : raw.replace(/,/g, "");
  }
  const value = Number(normalized);
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function parseMoney(text: string | null | undefined): Money | null {
  if (!text) return null;
  const currency = currencyOf(text);
  if (!currency) return null;
  const tokens = text.match(/\d{1,3}(?:[\s\u00a0\u202f]\d{3})+(?:[.,]\d+)?|\d[\d.,]*/g) ?? [];
  const values = tokens
    .map((token) => numberOf(token, currency))
    .filter((value): value is number => value !== null)
    .slice(0, 2);
  if (values.length === 0) return null;
  const low = Math.min(...values);
  const high = values.length > 1 ? Math.max(...values) : null;
  return { low, high: high !== null && high !== low ? high : null, currency };
}

export function convert(amount: number, from: Currency, to: Currency, rates: Rates | null | undefined): number | null {
  if (from === to) return amount;
  if (!rates) return null;
  const fromRate = from === "EUR" ? 1 : rates.values[from];
  const toRate = to === "EUR" ? 1 : rates.values[to];
  if (!fromRate || !toRate) return null;
  const value = (amount / fromRate) * toRate;
  return Number.isFinite(value) ? value : null;
}

export function formatMoney(amount: number, currency: Currency, digits = amount >= 100 ? 0 : 2): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount);
}

export function moneyIn(
  money: Money,
  currency: Currency,
  rates: Rates | null | undefined,
): { low: number; high: number | null; currency: Currency; converted: boolean } {
  const low = convert(money.low, money.currency, currency, rates);
  const high = money.high === null ? null : convert(money.high, money.currency, currency, rates);
  if (low === null) return { ...money, converted: false };
  return { low, high, currency, converted: money.currency !== currency };
}

export function formatRange(low: number, high: number | null, currency: Currency): string {
  const digits = low >= 100 ? 0 : 2;
  return high === null
    ? formatMoney(low, currency, digits)
    : `${formatMoney(low, currency, digits)} – ${formatMoney(high, currency, digits)}`;
}
