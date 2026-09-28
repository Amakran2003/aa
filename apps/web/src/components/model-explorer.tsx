"use client";

import { useMemo, useState } from "react";
import type { Market, ProductSheet } from "@aa/contracts";
import { convert, parseMoney } from "@aa/core/money";
import { ProductImage } from "@/components/product-image";
import { SiteMark } from "@/components/site-mark";
import { Money, useCurrency } from "@/features/fiche/currency";

const PAGE = 6;

type Group = "usine" | Market;
type Filter = "tous" | Group;

type Item = {
  href: string;
  title: string;
  image: string | null;
  price: string | null;
  moq: string | null;
  source: Market;
  group: Group;
  close: boolean;
};

const FILTER_LABEL: Record<Filter, string> = {
  tous: "Tous",
  usine: "Même usine",
  "made-in-china": "Made-in-China",
  alibaba: "Alibaba",
  dhgate: "DHgate",
  autre: "Autres sites",
};

function titleKey(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function itemsOf(sheet: ProductSheet, exclude: Set<string>): Item[] {
  const items: Item[] = [
    ...sheet.related
      .filter((item) => item.href)
      .map((item) => ({
        href: item.href as string,
        title: item.title,
        image: item.image,
        price: item.price,
        moq: null,
        source: sheet.source,
        group: "usine" as const,
        close: item.similar === true,
      })),
    ...(sheet.offers ?? []).map((offer) => ({
      href: offer.href,
      title: offer.title,
      image: offer.image,
      price: offer.price,
      moq: offer.moq,
      source: offer.source,
      group: offer.source,
      close: offer.close,
    })),
  ];
  const hrefs = new Set<string>([sheet.url, ...exclude]);
  const images = new Set<string>();
  const titles = new Set<string>();
  return items.filter((item) => {
    const title = titleKey(item.title);
    if (hrefs.has(item.href) || titles.has(title) || (item.image && images.has(item.image))) return false;
    hrefs.add(item.href);
    titles.add(title);
    if (item.image) images.add(item.image);
    return true;
  });
}

export function ModelExplorer({
  sheet,
  exclude,
  activeHref,
  onOpen,
}: {
  sheet: ProductSheet;
  exclude: string[];
  activeHref: string | null;
  onOpen: (href: string) => void;
}) {
  const { currency, rates } = useCurrency();
  const [filter, setFilter] = useState<Filter>("tous");
  const [sameType, setSameType] = useState(true);
  const [count, setCount] = useState(PAGE);
  const all = useMemo(() => itemsOf(sheet, new Set(exclude)), [sheet, exclude]);

  const priced = useMemo(() => {
    const value = (item: Item) => {
      const money = parseMoney(item.price);
      return money ? convert(money.low, money.currency, currency, rates) : null;
    };
    return [...all].sort((a, b) => (value(a) ?? Number.MAX_VALUE) - (value(b) ?? Number.MAX_VALUE));
  }, [all, currency, rates]);

  const typed = sameType ? priced.filter((item) => item.close) : priced;
  const different = priced.length - priced.filter((item) => item.close).length;
  const filters: Filter[] = ["tous", "usine", "made-in-china", "alibaba", "dhgate"];
  const counts = new Map<Filter, number>(
    filters.map((key) => [key, key === "tous" ? typed.length : typed.filter((item) => item.group === key).length]),
  );
  const visible = filter === "tous" ? typed : typed.filter((item) => item.group === filter);
  const shown = visible.slice(0, count);

  if (all.length === 0) return null;

  function pick(next: Filter) {
    setFilter(next);
    setCount(PAGE);
  }

  return (
    <section className="mt-8" aria-labelledby="modeles-trouves">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 id="modeles-trouves" className="text-base font-bold text-encre">
          Tous les modèles trouvés
        </h3>
        <p className="text-sm text-gris">Du moins cher au plus cher</p>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2" role="group" aria-label="Filtrer les modèles">
        {filters
          .filter((key) => key === "tous" || (counts.get(key) ?? 0) > 0)
          .map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={filter === key}
              onClick={() => pick(key)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
                filter === key
                  ? "border-marine bg-marine text-blanc"
                  : "border-[var(--abk-bordure-clair)] bg-blanc text-encre hover:border-signal"
              }`}
            >
              {FILTER_LABEL[key]} <span className={filter === key ? "text-blanc/70" : "text-gris"}>{counts.get(key)}</span>
            </button>
          ))}
        {different > 0 ? (
          <label className="ml-auto flex items-center gap-2 text-sm text-gris">
            <input
              type="checkbox"
              checked={!sameType}
              onChange={(event) => {
                setSameType(!event.target.checked);
                setCount(PAGE);
              }}
              className="h-4 w-4 accent-[var(--abk-marine)]"
            />
            Montrer aussi les produits différents ({different})
          </label>
        ) : null}
      </div>
      {shown.length === 0 ? (
        <p className="mt-4 text-sm text-gris">Aucun modèle dans ce filtre.</p>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-3 @2xl:grid-cols-3">
          {shown.map((item, index) => (
            <li
              key={item.href}
              data-boarding={index === 0 ? "offer" : undefined}
              className={`flex min-w-0 flex-col overflow-hidden rounded-[var(--abk-rayon-bouton-large)] border bg-blanc ${
                activeHref === item.href ? "border-signal" : "border-[var(--abk-bordure-clair)]"
              }`}
            >
              <button
                type="button"
                aria-pressed={activeHref === item.href}
                onClick={() => onOpen(item.href)}
                className="flex flex-1 flex-col text-left"
              >
                {item.image ? (
                  <ProductImage src={item.image} className="aspect-[4/3] w-full bg-blanc object-contain p-2" />
                ) : (
                  <span className="block aspect-[4/3] w-full bg-[var(--abk-brume)]" />
                )}
                <span className="flex flex-1 flex-col gap-1 border-t border-[var(--abk-bordure-clair)] px-3 py-3">
                  <SiteMark source={item.source} />
                  <span className="line-clamp-2 text-sm text-encre">{item.title}</span>
                  <span className="mt-auto pt-1">
                    <Money text={item.price} size="md" />
                  </span>
                  <span className="text-xs text-gris">
                    {item.group === "usine" ? "Même usine" : item.moq ? `MOQ ${item.moq}` : "MOQ absent"}
                  </span>
                </span>
              </button>
              <a
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="border-t border-[var(--abk-bordure-clair)] px-3 py-2 text-xs font-semibold text-marine hover:underline"
              >
                Ouvrir sur le site ↗
              </a>
            </li>
          ))}
        </ul>
      )}
      {visible.length > shown.length ? (
        <button
          type="button"
          onClick={() => setCount((value) => value + PAGE)}
          className="abk-bouton mt-4 w-full border border-[var(--abk-bordure-clair)] bg-blanc px-4 py-2.5 text-sm font-semibold text-encre hover:border-signal"
        >
          Afficher {Math.min(PAGE, visible.length - shown.length)} de plus ({visible.length - shown.length} restants)
        </button>
      ) : null}
    </section>
  );
}
