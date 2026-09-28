"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import type { Candidate, FactoryRole, ProductSheet, Rates } from "@aa/contracts";
import { MAX_SUPPLIERS } from "@aa/contracts";
import { formatMoney } from "@aa/core/money";
import { companyName, simulate } from "@aa/core/parcours";
import { SiteMark } from "@/components/site-mark";
import { Money } from "@/features/fiche/currency";
import type { SupplierDetail } from "@/features/parcours/use-supplier-details";

const FIRST = 10;
const MORE = 10;

const number = (value: number) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(value);

const ROLE: Record<FactoryRole, string> = {
  fabricant: "Fabricant",
  trading: "Négoce",
  "fabricant-et-trading": "Fabricant et négoce",
};

function Pill({ tone, children }: { tone?: "ok" | "warn"; children: ReactNode }) {
  const color = tone === "ok" ? "text-valide" : tone === "warn" ? "text-erreur" : "text-encre";
  return <span className={`rounded-full bg-[var(--abk-brume)] px-2.5 py-1 text-xs font-semibold ${color}`}>{children}</span>;
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-gris">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold break-words text-encre">{children}</dd>
    </div>
  );
}

function priceRange(sheet: ProductSheet | null, fallback: string | null) {
  const tiers = sheet?.tiers ?? [];
  const first = tiers[0];
  const last = tiers.at(-1);
  if (first && last && first !== last) {
    return (
      <span className="flex flex-wrap items-baseline gap-1">
        <Money text={first.price} size="sm" original={false} /> <span className="text-gris">→</span>
        <Money text={last.price} size="sm" original={false} />
      </span>
    );
  }
  return <Money text={first?.price ?? fallback} size="sm" original={false} />;
}

function SampleCell({ sheet, rates }: { sheet: ProductSheet; rates: Rates | null }) {
  const result = simulate({ sheet, rates, budget: 0, aside: 0 });
  if (result.kind === "too-small" || result.kind === "ready") {
    const { quantity, total } = result.sample;
    return (
      <span className="parcours-pop inline-block">
        {formatMoney(total, "EUR", 2)}
        {quantity > 1 ? <span className="font-medium text-gris"> les {quantity}</span> : null}
      </span>
    );
  }
  return <span className="font-medium text-erreur">À demander</span>;
}

export function SupplierStep({
  originUrl,
  candidates,
  picked,
  details,
  rates,
  onToggle,
  onContinue,
}: {
  originUrl: string;
  candidates: Candidate[];
  picked: string[];
  details: Record<string, SupplierDetail>;
  rates: Rates | null;
  onToggle: (href: string) => void;
  onContinue: () => void;
}) {
  const [shown, setShown] = useState(FIRST);
  const full = picked.length >= MAX_SUPPLIERS;
  const serious = candidates.filter((candidate) => candidate.passes).length;
  const visible = candidates.filter((candidate, index) => index < shown || picked.includes(candidate.offer.href));
  const hidden = candidates.length - visible.length;
  return (
    <section className="@container cut border border-white/70 bg-blanc/80 p-5 backdrop-blur-xl @2xl:p-7" aria-labelledby="qui-contacter">
      <h3 id="qui-contacter" className="text-lg font-bold text-encre">
        Qui contacter ?
      </h3>
      <p className="mt-1.5 max-w-2xl text-sm text-gris">
        {serious} usine{serious > 1 ? "s sérieuses trouvées" : " sérieuse trouvée"} : même type de produit, au moins 2 ans sur le
        site, les moins chères d'abord. Demande un échantillon à plusieurs, puis compare. {MAX_SUPPLIERS} au plus, pour ne pas écrire
        pour rien.
      </p>

      <ul className="mt-5 overflow-hidden rounded-[var(--abk-rayon-carte)] border border-[var(--abk-bordure-clair)] bg-blanc">
        {visible.map((candidate, index) => {
          const { offer } = candidate;
          const detail = details[offer.href];
          const sheet = detail?.state === "ready" ? detail.sheet : null;
          const checked = picked.includes(offer.href);
          const role = sheet?.factory.role ? ROLE[sheet.factory.role] : null;
          const moq = sheet?.fields.find((field) => field.label === "MOQ")?.value ?? offer.moq;
          const id = `usine-${index}`;
          return (
            <li key={offer.href} className="parcours-pick border-t border-[var(--abk-bordure-clair)] first:border-t-0">
              <label htmlFor={id} className="grid cursor-pointer grid-cols-[1.25rem_minmax(0,1fr)] gap-4 px-5 py-4">
                <input
                  id={id}
                  type="checkbox"
                  checked={checked}
                  disabled={!checked && full}
                  onChange={() => onToggle(offer.href)}
                  className="mt-1 h-5 w-5 accent-[var(--abk-marine)]"
                />
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-base font-bold text-encre">{companyName(offer.supplier) ?? "Usine sans nom"}</span>
                    <SiteMark source={offer.source} />
                  </span>
                  <span className="mt-2 flex flex-wrap gap-1.5">
                    {offer.href === originUrl ? <Pill>Ta fiche de départ</Pill> : null}
                    {candidate.reason ? <Pill tone="warn">{candidate.reason}</Pill> : <Pill>{offer.years} ans</Pill>}
                    {role ? <Pill tone={sheet?.factory.role === "trading" ? "warn" : "ok"}>{role}</Pill> : null}
                    {offer.verified ? <Pill tone="ok">Vérifié</Pill> : null}
                    {offer.assurance ? <Pill tone="ok">Trade Assurance</Pill> : null}
                    {offer.rating ? <Pill>{number(offer.rating)}/5</Pill> : null}
                    {offer.response ? <Pill>Répond à {offer.response.replace(".", ",").replace("%", " %")}</Pill> : null}
                    {offer.employees ? <Pill>{number(offer.employees)} salariés</Pill> : null}
                    {candidate.frameOnly ? <Pill tone="warn">Cadre seul, sans plateau</Pill> : null}
                  </span>
                  <span className="mt-2 block truncate text-sm text-gris">{offer.title}</span>
                  <dl className="mt-3 grid grid-cols-1 gap-3 @lg:grid-cols-3">
                    <Fact label="Prix usine">
                      {priceRange(sheet, sheet?.fields.find((field) => field.label === "Prix")?.value ?? offer.price)}
                    </Fact>
                    <Fact label="MOQ">{moq ?? <span className="font-medium text-gris">Absent</span>}</Fact>
                    <Fact label="Échantillon livré en France">
                      {detail?.state === "loading" ? (
                        <span className="parcours-shimmer" aria-label="Lecture de la fiche" />
                      ) : sheet ? (
                        <SampleCell sheet={sheet} rates={rates} />
                      ) : detail?.state === "error" ? (
                        <span className="font-medium text-gris">Fiche non lue</span>
                      ) : (
                        <span className="font-medium text-gris">Coche pour lire la fiche</span>
                      )}
                    </Fact>
                  </dl>
                  {sheet?.sample?.price ? (
                    <span className="mt-2 block text-xs text-gris">Prix de l'échantillon sur Alibaba : {sheet.sample.price}</span>
                  ) : null}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      {hidden > 0 ? (
        <button
          type="button"
          onClick={() => setShown((count) => count + MORE)}
          className="abk-bouton mt-3 w-full border border-[var(--abk-bordure-clair)] bg-blanc px-5 py-3 text-sm font-semibold text-marine"
        >
          Voir {Math.min(hidden, MORE)} autre{Math.min(hidden, MORE) > 1 ? "s" : ""} usine{Math.min(hidden, MORE) > 1 ? "s" : ""}
          {hidden > MORE ? ` (${hidden} en tout)` : ""}
        </button>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gris" aria-live="polite">
          {picked.length === 0
            ? "Coche au moins une usine pour préparer un message."
            : `${picked.length} usine${picked.length > 1 ? "s choisies" : " choisie"}, ${MAX_SUPPLIERS} au maximum.`}
        </p>
        <button
          type="button"
          onClick={onContinue}
          disabled={picked.length === 0}
          className="abk-bouton bg-marine px-6 py-3 text-sm font-bold text-blanc disabled:opacity-50"
        >
          Préparer {picked.length > 1 ? `${picked.length} messages` : "le message"}
        </button>
      </div>
    </section>
  );
}
