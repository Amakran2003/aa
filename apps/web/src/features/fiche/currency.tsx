"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Currency, Rates } from "@aa/contracts";
import { CURRENCIES, DEFAULT_CURRENCY, formatRange, moneyIn, parseMoney } from "@aa/core/money";

const STORAGE = "aa:devise";

const LABEL: Record<Currency, string> = {
  EUR: "Euro (€)",
  USD: "Dollar US ($)",
  CNY: "Yuan (¥)",
};

type CurrencyState = {
  currency: Currency;
  rates: Rates | null;
  setCurrency: (currency: Currency) => void;
};

const CurrencyContext = createContext<CurrencyState>({
  currency: DEFAULT_CURRENCY,
  rates: null,
  setCurrency: () => undefined,
});

export function CurrencyProvider({ rates, children }: { rates: Rates | null; children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>(DEFAULT_CURRENCY);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE);
    if (saved && (CURRENCIES as string[]).includes(saved)) setCurrency(saved as Currency);
  }, []);

  function choose(next: Currency) {
    setCurrency(next);
    window.localStorage.setItem(STORAGE, next);
  }

  return <CurrencyContext.Provider value={{ currency, rates, setCurrency: choose }}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): CurrencyState {
  return useContext(CurrencyContext);
}

function day(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("fr-FR").format(date);
}

export function CurrencySelect() {
  const { currency, rates, setCurrency } = useCurrency();
  return (
    <div className="flex flex-col items-end gap-1">
      <label className="flex items-center gap-2 text-sm text-gris">
        Devise
        <select
          value={currency}
          onChange={(event) => setCurrency(event.target.value as Currency)}
          className="rounded-[var(--abk-rayon-bouton)] border border-[var(--abk-bordure-clair)] bg-blanc px-3 py-1.5 text-sm font-semibold text-encre"
        >
          {CURRENCIES.map((code) => (
            <option key={code} value={code}>
              {LABEL[code]}
            </option>
          ))}
        </select>
      </label>
      {rates ? <p className="text-xs text-gris">Taux BCE du {day(rates.date)}</p> : null}
    </div>
  );
}

export function useMoney(text: string | null | undefined): { value: string; original: string | null; sort: number | null } | null {
  const { currency, rates } = useCurrency();
  const money = parseMoney(text);
  if (!money) return null;
  const shown = moneyIn(money, currency, rates);
  return {
    value: formatRange(shown.low, shown.high, shown.currency),
    original: shown.converted ? (text ?? null) : null,
    sort: shown.currency === currency ? shown.low : null,
  };
}

export function Money({
  text,
  size = "md",
  original = true,
}: {
  text: string | null | undefined;
  size?: "lg" | "md" | "sm";
  original?: boolean;
}) {
  const money = useMoney(text);
  const weight = size === "lg" ? "text-2xl" : size === "md" ? "text-base" : "text-sm";
  if (!money) {
    return <span className={`${weight} font-bold text-encre`}>{text ?? <span className="font-medium text-gris">Prix absent</span>}</span>;
  }
  return (
    <span className="block">
      <span className={`${weight} block font-bold tracking-tight text-encre`}>{money.value}</span>
      {original && money.original ? <span className="block text-xs text-gris">Affiché {money.original}</span> : null}
    </span>
  );
}
