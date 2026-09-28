"use client";

import type { Market, MarketProbe, ProductSheet } from "@aa/contracts";
import { BestOffers } from "@/components/best-offers";
import { Categories } from "@/components/categories";
import { FactoryMarks } from "@/components/factory-marks";
import { Gallery } from "@/components/gallery";
import { ModelExplorer } from "@/components/model-explorer";
import { PriceTiers } from "@/components/price-tiers";
import { SiteMark } from "@/components/site-mark";
import { CurrencySelect, Money } from "@/features/fiche/currency";

const MARKET_NAME: Record<Market, string> = {
  "made-in-china": "Made-in-China",
  alibaba: "Alibaba",
  dhgate: "DHgate",
  autre: "Autres sites",
};

const DETAILS = [
  ["MOQ", "MOQ"],
  ["Package Size", "Carton"],
  ["Package Gross Weight", "Poids"],
  ["Model NO.", "Modèle"],
] as const;

function tidy(label: string, value: string | null | undefined): string | null {
  if (!value) return null;
  const number = (raw: string) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(Number(raw));
  if (label === "Package Gross Weight") {
    const kg = value.match(/^([\d.]+)\s*kg$/i);
    return kg ? `${number(kg[1])} kg` : value;
  }
  if (label === "Package Size") {
    const sides = [...value.matchAll(/[\d.]+/g)].map((match) => match[0]);
    const unit = value.match(/cm|mm|m\b/i)?.[0]?.toLowerCase();
    return sides.length === 3 && unit ? `${sides.map(number).join(" × ")} ${unit}` : value;
  }
  return value;
}

function SearchStatus({ probes }: { probes: MarketProbe[] }) {
  const done = new Set(probes.map((probe) => probe.source));
  const markets: Market[] = ["made-in-china", "alibaba", "dhgate"];
  const waiting = markets.filter((source) => !done.has(source));
  if (waiting.length === 0) return null;
  return (
    <ul className="mt-8 flex flex-wrap gap-2 text-sm text-gris" aria-live="polite">
      {waiting.map((source) => (
        <li key={source} className="rounded-full bg-[var(--abk-brume)] px-3 py-1.5">
          Recherche sur {MARKET_NAME[source]}…
        </li>
      ))}
    </ul>
  );
}

export function SheetView({
  sheet,
  density,
  activeHref,
  onOpen,
  part,
  lists,
}: {
  sheet: ProductSheet;
  density: "full" | "short";
  activeHref: string | null;
  onOpen: (href: string) => void;
  part: "produit" | "fiche";
  lists: boolean;
}) {
  const showLists = part === "produit" && lists;
  const wide = density === "full";
  const price = sheet.fields.find((field) => field.label === "Prix")?.value ?? null;
  const podium = (sheet.best ?? []).slice(0, 3).map((offer) => offer.href);
  const Title = part === "produit" ? "h3" : "h2";

  return (
    <section
      className={`@container w-full min-w-0 ${
        wide ? "cut border border-white/70 bg-blanc/80 p-5 backdrop-blur-xl @2xl:p-7" : ""
      }`}
    >
      {part === "produit" ? (
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <h2 className="text-lg font-bold text-encre">Voici le produit</h2>
          <CurrencySelect />
        </div>
      ) : null}

      <div
        data-boarding={part === "produit" ? "produit" : undefined}
        className={wide ? "grid gap-6 @2xl:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]" : "grid gap-4"}
      >
        <Gallery key={sheet.url} images={sheet.images} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <SiteMark source={sheet.source} />
            <a href={sheet.url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-marine hover:underline">
              Ouvrir sur le site ↗
            </a>
          </div>
          <Title className={`mt-2 font-bold tracking-tight break-words text-encre ${wide ? "text-xl" : "text-lg"}`}>
            {sheet.title ?? "Sans titre"}
          </Title>
          {sheet.supplier ? <p className="mt-1 text-sm text-gris">{sheet.supplier}</p> : null}

          <div className="mt-4">
            <p className="text-xs font-medium text-gris">Prix</p>
            <Money text={price} size="lg" />
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-2">
            {DETAILS.map(([label, title]) => {
              const value = tidy(label, sheet.fields.find((field) => field.label === label)?.value);
              return (
                <div
                  key={label}
                  className="min-w-0 rounded-[var(--abk-rayon-bouton)] border border-[var(--abk-bordure-clair)] bg-blanc px-3 py-2"
                >
                  <dt className="text-xs font-medium text-gris">{title}</dt>
                  <dd className={`mt-0.5 text-sm break-words ${value ? "font-semibold text-encre" : "text-gris"}`}>
                    {value ?? "Absent"}
                  </dd>
                </div>
              );
            })}
          </dl>

          <PriceTiers tiers={sheet.tiers} />
        </div>
      </div>

      <div className={wide ? "mt-6 grid gap-5 @2xl:grid-cols-2" : "mt-5 grid gap-5"}>
        <FactoryMarks factory={sheet.factory} />
        {sheet.groups.length > 0 ? <Categories sheet={sheet} /> : null}
      </div>

      {part === "produit" ? <SearchStatus probes={sheet.probes ?? []} /> : null}
      {showLists ? <BestOffers offers={sheet.best} activeHref={activeHref} onOpen={onOpen} /> : null}
      {showLists ? <ModelExplorer sheet={sheet} exclude={podium} activeHref={activeHref} onOpen={onOpen} /> : null}
      {showLists && (sheet.best ?? []).length === 0 && sheet.related.length === 0 && (sheet.offers ?? []).length === 0 ? (
        <p className="mt-8 text-sm text-gris">Aucun modèle proche pour l'instant.</p>
      ) : null}
    </section>
  );
}
