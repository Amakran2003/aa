"use client";

import type { BestOffer } from "@aa/contracts";
import { ProductImage } from "@/components/product-image";
import { SiteMark } from "@/components/site-mark";
import { Money } from "@/features/fiche/currency";

function meta(offer: BestOffer): string {
  return [offer.moq ? `MOQ ${offer.moq}` : "MOQ absent", offer.years ? `${offer.years} ans sur le site` : null]
    .filter(Boolean)
    .join(" · ");
}

export function BestOffers({
  offers,
  activeHref,
  onOpen,
}: {
  offers: BestOffer[] | undefined;
  activeHref: string | null;
  onOpen: (href: string) => void;
}) {
  if (!offers || offers.length === 0) return null;
  const podium = offers.slice(0, 3);
  const rest = offers.slice(3);
  return (
    <section id="offres" className="mt-8 scroll-mt-24" aria-labelledby="meilleurs-prix">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 id="meilleurs-prix" className="text-base font-bold text-encre">
          Les meilleurs prix
        </h3>
        <p className="text-sm text-gris">Même type de produit, du prix affiché le plus bas au plus haut</p>
      </div>
      <ol data-boarding="offres" className="mt-3 grid gap-3 @xl:grid-cols-3">
        {podium.map((offer, index) => (
          <li
            key={offer.href}
            data-boarding={index === 0 ? "offer" : undefined}
            className={`flex flex-col overflow-hidden rounded-[var(--abk-rayon-bouton-large)] border bg-blanc ${
              activeHref === offer.href ? "border-signal" : "border-[var(--abk-bordure-clair)]"
            }`}
          >
            <button
              type="button"
              aria-pressed={activeHref === offer.href}
              onClick={() => onOpen(offer.href)}
              className="flex flex-1 flex-col text-left"
            >
              <span className="relative block">
                {offer.image ? (
                  <ProductImage src={offer.image} className="aspect-[4/3] w-full bg-blanc object-contain p-2" />
                ) : (
                  <span className="block aspect-[4/3] w-full bg-[var(--abk-brume)]" />
                )}
                <span className="absolute left-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-marine text-sm font-bold text-blanc">
                  {index + 1}
                </span>
              </span>
              <span className="flex flex-1 flex-col gap-1 border-t border-[var(--abk-bordure-clair)] px-3 py-3">
                <SiteMark source={offer.source} />
                <span className="line-clamp-2 text-sm text-encre">{offer.title}</span>
                <span className="mt-auto pt-1">
                  <Money text={offer.price} size="md" />
                </span>
                <span className="text-xs text-gris">{meta(offer)}</span>
              </span>
            </button>
            <a
              href={offer.href}
              target="_blank"
              rel="noreferrer"
              className="border-t border-[var(--abk-bordure-clair)] px-3 py-2 text-xs font-semibold text-marine hover:underline"
            >
              Ouvrir sur le site ↗
            </a>
          </li>
        ))}
      </ol>
      {rest.length > 0 ? (
        <details className="group mt-3">
          <summary className="cursor-pointer text-sm font-semibold text-marine">
            Voir la suite du classement ({rest.length})
          </summary>
          <ol start={4} className="mt-2 divide-y divide-[var(--abk-bordure-clair)] overflow-hidden rounded-[var(--abk-rayon-bouton-large)] border border-[var(--abk-bordure-clair)] bg-blanc">
            {rest.map((offer, index) => (
              <li key={offer.href}>
                <button
                  type="button"
                  aria-pressed={activeHref === offer.href}
                  onClick={() => onOpen(offer.href)}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-[var(--abk-brume)]"
                >
                  <span className="w-5 shrink-0 text-sm font-bold text-gris">{index + 4}</span>
                  {offer.image ? (
                    <ProductImage src={offer.image} className="h-12 w-12 shrink-0 rounded-lg bg-blanc object-contain" />
                  ) : null}
                  <span className="min-w-0 flex-1">
                    <SiteMark source={offer.source} />
                    <span className="block truncate text-sm text-encre">{offer.title}</span>
                  </span>
                  <span className="shrink-0 text-right">
                    <Money text={offer.price} size="sm" original={false} />
                    <span className="block text-xs text-gris">{offer.moq ? `MOQ ${offer.moq}` : "MOQ absent"}</span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </details>
      ) : null}
    </section>
  );
}
