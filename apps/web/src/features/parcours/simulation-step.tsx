"use client";

import { useEffect, useRef, useState } from "react";
import type { Candidate, PriceTier, Rates, Simulation } from "@aa/contracts";
import { formatMoney } from "@aa/core/money";
import {
  CONTRIBUTION_RATE,
  PAYMENT_RATE,
  RESERVE_RATE,
  TARGET_MARGIN,
  VAT_RATE,
  companyName,
  netMargin,
  recommendedPrice,
  simulate,
} from "@aa/core/parcours";
import { Burst, useCountUp } from "@/features/parcours/motion";
import type { SupplierDetail } from "@/features/parcours/use-supplier-details";

export type SimulationInputs = { budget: string; aside: string; sale: string };
export type Noun = { one: string; many: string; delivered: string };

const euros = (value: number) => formatMoney(value, "EUR", 2);
const round = (value: number) => formatMoney(value, "EUR", 0);
const number = (value: number, digits = 0) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: digits }).format(value);

export function amountOf(raw: string): number | null {
  const cleaned = raw.replace(/[\s\u00a0\u202f€]/g, "").replace(",", ".");
  if (cleaned === "") return null;
  const value = Number(cleaned);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

export function simulationOf(
  candidate: Candidate,
  details: Record<string, SupplierDetail>,
  rates: Rates | null,
  inputs: SimulationInputs,
): Simulation | null {
  const detail = details[candidate.offer.href];
  if (detail?.state !== "ready") return null;
  return simulate({
    sheet: detail.sheet,
    rates,
    budget: amountOf(inputs.budget) ?? 0,
    aside: amountOf(inputs.aside) ?? 0,
  });
}

export function bestSupplier(
  chosen: Candidate[],
  details: Record<string, SupplierDetail>,
  rates: Rates | null,
  inputs: SimulationInputs,
): string | null {
  let best: { href: string; quantity: number } | null = null;
  for (const candidate of chosen) {
    const result = simulationOf(candidate, details, rates, inputs);
    if (result?.kind === "ready" && (!best || result.quantity > best.quantity)) {
      best = { href: candidate.offer.href, quantity: result.quantity };
    }
  }
  return best?.href ?? null;
}

function tierLabel(tier: PriceTier | null): string {
  if (!tier) return "";
  return tier.to === null ? `, palier ${number(tier.from)} et plus` : `, palier ${number(tier.from)} à ${number(tier.to)}`;
}

function Field({
  id,
  label,
  hint,
  value,
  placeholder,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="block text-sm font-semibold text-encre">
        {label}
      </label>
      <input
        id={id}
        inputMode="decimal"
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        aria-describedby={hint ? `${id}-aide` : undefined}
        className="mt-1.5 w-full rounded-[var(--abk-rayon-bouton)] border border-[var(--abk-bordure-clair)] bg-blanc px-3 py-2.5 text-[16px] font-semibold text-encre placeholder:font-medium placeholder:text-gris"
      />
      {hint ? (
        <p id={`${id}-aide`} className="mt-1 text-xs text-gris">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function SimulationStep({
  chosen,
  details,
  rates,
  noun,
  inputs,
  onInputs,
  selected,
  onSelect,
  onContinue,
}: {
  chosen: Candidate[];
  details: Record<string, SupplierDetail>;
  rates: Rates | null;
  noun: Noun;
  inputs: SimulationInputs;
  onInputs: (next: Partial<SimulationInputs>) => void;
  selected: string | null;
  onSelect: (href: string) => void;
  onContinue: () => void;
}) {
  const active = selected ?? bestSupplier(chosen, details, rates, inputs) ?? chosen[0]?.offer.href ?? null;
  const candidate = chosen.find((item) => item.offer.href === active) ?? chosen[0];
  const detail = candidate ? details[candidate.offer.href] : undefined;
  const result = candidate ? simulationOf(candidate, details, rates, inputs) : null;
  const ready = result?.kind === "ready" ? result : null;
  const shownQuantity = Math.round(useCountUp(ready?.quantity ?? 0));
  const [party, setParty] = useState(0);
  const celebrated = useRef(new Set<string>());
  const budget = amountOf(inputs.budget) ?? 0;
  const envelope = Math.max(budget - (amountOf(inputs.aside) ?? 0), 0);
  const sale = amountOf(inputs.sale);
  const name = candidate ? (companyName(candidate.offer.supplier) ?? "cette usine") : "";

  useEffect(() => {
    if (!ready || !active || celebrated.current.has(active)) return;
    celebrated.current.add(active);
    setParty((value) => value + 1);
  }, [ready, active]);

  const advised = ready ? recommendedPrice(ready.unit.total) : null;
  const price = sale ?? advised;
  const margin = ready && price ? netMargin(price, ready.unit.total, CONTRIBUTION_RATE, PAYMENT_RATE) : null;
  const parts = ready
    ? [
        { label: "Usine", value: ready.unit.factory, color: "var(--abk-marine)" },
        { label: "Livraison", value: ready.unit.shipping, color: "var(--abk-signal)" },
        ...(ready.unit.duty ? [{ label: "Droits", value: ready.unit.duty, color: "var(--abk-corail)" }] : []),
        { label: `TVA ${VAT_RATE} %`, value: ready.unit.vat, color: "var(--abk-bleu-400)" },
      ]
    : [];

  return (
    <section className="@container cut border border-white/70 bg-blanc/80 p-5 backdrop-blur-xl @2xl:p-7" aria-labelledby="ton-budget">
      <h3 id="ton-budget" className="text-lg font-bold text-encre">
        Ce que tes {round(budget)} ramènent
      </h3>

      {chosen.length > 1 ? (
        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Usine simulée">
          {chosen.map((item) => {
            const on = item.offer.href === active;
            const other = simulationOf(item, details, rates, inputs);
            return (
              <button
                key={item.offer.href}
                type="button"
                aria-pressed={on}
                onClick={() => onSelect(item.offer.href)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                  on ? "border-marine bg-marine text-blanc" : "border-[var(--abk-bordure-clair)] bg-blanc text-encre"
                }`}
              >
                {companyName(item.offer.supplier) ?? "Usine"}
                {other?.kind === "ready" ? (
                  <span className={on ? "text-blanc" : "text-gris"}> · {number(other.quantity)}</span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="relative mt-5">
      <Burst play={party} />
      <div
        className="parcours-win rounded-[var(--abk-rayon-carte)] border border-[var(--abk-bordure-clair)] bg-blanc p-5 @2xl:p-6"
        data-won={ready ? "true" : undefined}
        key={active ?? "vide"}
      >
        {!candidate ? (
          <p className="text-base text-gris">Choisis une usine à l'étape Fournisseurs.</p>
        ) : !detail || detail.state === "loading" ? (
          <p className="flex items-center gap-3 text-base text-gris" role="status">
            <span className="parcours-shimmer" aria-hidden="true" /> Lecture de la fiche de {name}…
          </p>
        ) : detail.state === "error" ? (
          <p className="text-base text-erreur">La fiche de {name} n'a pas pu être lue. Choisis une autre usine.</p>
        ) : ready ? (
          <>
            <p className="text-2xl font-bold tracking-tight text-encre @2xl:text-3xl">
              Avec {round(envelope)}, chez {name}, tu ramènes{" "}
              <span className="text-signal">
                {number(shownQuantity)} {ready.quantity > 1 ? noun.many : noun.one}
              </span>{" "}
              {noun.delivered} en France.
            </p>
            <p className="mt-2 text-base text-gris">
              {euros(ready.unit.total)} par {noun.one}, livraison et TVA comprises. Il reste {euros(ready.left)}. Estimation, avant
              les devis.
            </p>
            <div
              className="parcours-bar mt-5"
              role="img"
              aria-label={parts.map((part) => `${part.label} ${euros(part.value)}`).join(", ")}
              key={`${active}-${ready.quantity}`}
            >
              {parts.map((part) => (
                <span key={part.label} style={{ flexGrow: part.value, background: part.color }} />
              ))}
            </div>
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-encre">
              {parts.map((part) => (
                <li key={part.label} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: part.color }} aria-hidden="true" />
                  {part.label} <span className="font-semibold">{euros(part.value)}</span>
                </li>
              ))}
            </ul>
            {advised !== null && margin ? (
              <dl className="parcours-pop mt-5 grid gap-3 @lg:grid-cols-2">
                <div className="rounded-[var(--abk-rayon-bouton)] bg-[var(--abk-brume)] px-4 py-3">
                  <dt className="text-xs font-medium text-gris">Prix de vente conseillé</dt>
                  <dd className="mt-0.5 text-xl font-bold text-encre">
                    {round(advised)} <span className="text-sm font-medium text-gris">par {noun.one}</span>
                  </dd>
                </div>
                <div className="rounded-[var(--abk-rayon-bouton)] bg-[var(--abk-brume)] px-4 py-3">
                  <dt className="text-xs font-medium text-gris">{sale ? `Ta marge à ${round(sale)}` : "Ta marge à ce prix"}</dt>
                  <dd className={`mt-0.5 text-xl font-bold ${margin.rate >= 0.25 ? "text-valide" : "text-erreur"}`}>
                    {euros(margin.perUnit)} <span className="text-sm font-medium">({number(margin.rate * 100, 1)} %)</span>
                  </dd>
                </div>
              </dl>
            ) : null}
          </>
        ) : result?.kind === "no-shipping" ? (
          <>
            <p className="text-xl font-bold text-encre">La fiche de {name} n'affiche pas la livraison.</p>
            <p className="mt-2 text-base text-gris">
              {result.factoryFrom !== null ? `Usine dès ${euros(result.factoryFrom)}. ` : ""}La livraison est demandée dans ton
              message. Pas de fret inventé en attendant.
            </p>
          </>
        ) : result?.kind === "too-small" ? (
          <>
            <p className="text-xl font-bold text-encre">
              {round(envelope)} ne suffisent pas pour la commande minimum de {name}.
            </p>
            <p className="mt-2 text-base text-gris">
              Il faut au moins {euros(result.sample.total)} pour {number(result.sample.quantity)}{" "}
              {result.sample.quantity > 1 ? noun.many : noun.one}.
            </p>
          </>
        ) : (
          <p className="text-base text-gris">Le prix de {name} n'a pas été lu sur la fiche. Il est demandé dans ton message.</p>
        )}
      </div>
      </div>

      <div className="mt-6 grid gap-4 @xl:grid-cols-3">
        <Field id="sim-budget" label="Budget total (€)" value={inputs.budget} onChange={(budget) => onInputs({ budget })} />
        <Field
          id="sim-aside"
          label="Mis de côté (€)"
          hint={`Réserve conseillée : ${RESERVE_RATE} % du budget pour l'entrepôt, la livraison client et les imprévus. 0 pour tout utiliser.`}
          value={inputs.aside}
          placeholder="0"
          onChange={(aside) => onInputs({ aside })}
        />
        <Field
          id="sim-sale"
          label={`Prix de vente par ${noun.one} (€)`}
          hint={
            advised !== null
              ? `Conseillé : ${round(advised)}, pour garder ${TARGET_MARGIN} % net. Tape ton prix pour comparer.`
              : "Pour voir ta marge."
          }
          value={inputs.sale}
          placeholder={advised !== null ? String(advised) : undefined}
          onChange={(value) => onInputs({ sale: value })}
        />
      </div>

      {ready ? (
        <>
          <h4 className="mt-7 text-sm font-bold text-encre">Trois quantités</h4>
          <table className="mt-2 w-full overflow-hidden rounded-[var(--abk-rayon-bouton)] border border-[var(--abk-bordure-clair)] bg-blanc text-sm">
            <thead className="bg-[var(--abk-brume)] text-left text-xs text-gris">
              <tr>
                <th scope="col" className="px-4 py-2 font-medium">
                  Quantité
                </th>
                <th scope="col" className="px-4 py-2 font-medium">
                  Rôle
                </th>
                <th scope="col" className="px-4 py-2 text-right font-medium">
                  Coût
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-[var(--abk-bordure-clair)]">
                <td className="px-4 py-3 font-semibold text-encre">
                  {number(ready.sample.quantity)} {ready.sample.quantity > 1 ? noun.many : noun.one}
                </td>
                <td className="px-4 py-3 text-gris">Échantillon, le seul achat tout de suite</td>
                <td className="px-4 py-3 text-right font-bold text-encre">{euros(ready.sample.total)}</td>
              </tr>
              <tr className="border-t border-[var(--abk-bordure-clair)]">
                <td className="px-4 py-3 font-semibold text-encre">
                  {number(ready.quantity)} {noun.many}
                </td>
                <td className="px-4 py-3 text-gris">Ce que ton budget paie{tierLabel(ready.unit.tier)}</td>
                <td className="px-4 py-3 text-right font-bold text-encre">{euros(ready.spent)}</td>
              </tr>
              <tr className="border-t border-[var(--abk-bordure-clair)]">
                <td className="px-4 py-3 font-semibold text-encre">
                  {number(ready.ask.quantity)} {noun.many}
                </td>
                <td className="px-4 py-3 text-gris">
                  Palier demandé à l'usine{ready.ask.factory !== null ? `, ${euros(ready.ask.factory)} la pièce sur la fiche` : ""}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-gris">Livraison au devis</td>
              </tr>
            </tbody>
          </table>

          <h4 className="mt-7 text-sm font-bold text-encre">Ta marge</h4>
          <p className={`mt-1.5 text-base ${margin ? (margin.rate >= 0.25 ? "font-semibold text-valide" : "font-semibold text-erreur") : "text-gris"}`} aria-live="polite">
            {margin && price
              ? `${sale ? `À ${round(price)}` : `Au prix conseillé de ${round(price)}`}, il te reste ${euros(margin.perUnit)} par ${noun.one}, soit ${number(margin.rate * 100, 1)} % du prix de vente, après cotisations (${number(CONTRIBUTION_RATE, 1)} %) et paiement (${number(PAYMENT_RATE, 1)} %). Objectif : au moins 25 à 30 % net.`
              : `Tape ton prix de vente pour voir ce qu'il te reste par ${noun.one}.`}
          </p>

          <p className="mt-6 text-xs leading-relaxed text-gris">
            Livraison : prix calculé par Alibaba vers la France pour{" "}
            {ready.shipping.quantity > 1
              ? `la commande minimum de ${ready.shipping.quantity} (${formatMoney(ready.shipping.amount, ready.shipping.currency, 2)})`
              : `1 pièce (${formatMoney(ready.shipping.amount, ready.shipping.currency, 2)})`}
            {ready.shipping.method ? `, ${ready.shipping.method}` : ""}
            {ready.shipping.transit ? `, ${ready.shipping.transit}` : ""}, {ready.shipping.dutiesIncluded ? "droits compris" : "droits non compris"}.
            {" "}Droits : {ready.dutyNote ?? "non chiffrés"}. TVA import : {VAT_RATE} %. Le vrai prix du lot viendra du transitaire, souvent moins cher que la
            livraison du fournisseur.{candidate?.frameOnly ? " Cadre seul : le plateau n'est pas compris." : ""}
          </p>
        </>
      ) : null}

      <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gris">Ensuite : la liste à envoyer au transitaire.</p>
        <button type="button" onClick={onContinue} className="abk-bouton bg-marine px-6 py-3 text-sm font-bold text-blanc">
          Préparer le transport
        </button>
      </div>
    </section>
  );
}
