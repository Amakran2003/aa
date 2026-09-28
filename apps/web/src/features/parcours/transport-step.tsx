"use client";

import type { Candidate, ProductSheet, Simulation } from "@aa/contracts";
import { companyName } from "@aa/core/parcours";
import type { Noun } from "@/features/parcours/simulation-step";

const number = (value: number, digits = 0) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: digits }).format(value);

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-[var(--abk-rayon-bouton)] border border-[var(--abk-bordure-clair)] bg-blanc px-4 py-3">
      <dt className="text-xs font-medium text-gris">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold break-words text-encre">{value}</dd>
    </div>
  );
}

export function TransportStep({
  candidate,
  sheet,
  result,
  noun,
}: {
  candidate: Candidate | null;
  sheet: ProductSheet | null;
  result: Simulation | null;
  noun: Noun;
}) {
  const ready = result?.kind === "ready" ? result : null;
  const absent = "À demander à l'usine";
  return (
    <section className="@container cut border border-white/70 bg-blanc/80 p-5 backdrop-blur-xl @2xl:p-7" aria-labelledby="le-transport">
      <h3 id="le-transport" className="text-lg font-bold text-encre">
        Le vrai prix du transport
      </h3>
      <p className="mt-1.5 max-w-2xl text-sm text-gris">
        Envoie cette liste à un transitaire et demande un prix DDP par bateau jusqu'à ton adresse. Voici la liste
        pour {candidate ? (companyName(candidate.offer.supplier) ?? "l'usine") : "l'usine choisie"}.
      </p>
      {ready ? (
        <dl className="mt-5 grid gap-3 @lg:grid-cols-2 @3xl:grid-cols-3">
          <Fact label="Quantité" value={`${number(ready.quantity)} ${noun.many}`} />
          <Fact label="Carton par pièce" value={ready.lot.carton ?? absent} />
          <Fact label="Volume du lot" value={ready.lot.volume !== null ? `${number(ready.lot.volume, 2)} m³` : absent} />
          <Fact label="Poids du lot" value={ready.lot.weight !== null ? `${number(ready.lot.weight)} kg` : absent} />
          <Fact label="Trajet" value={`${sheet?.factory.city ?? "Chine"} → Le Havre → ton adresse`} />
          <Fact label="Incoterm" value="DDP, bateau" />
        </dl>
      ) : (
        <p className="mt-5 text-sm text-gris">Choisis à l'étape Simulation une usine dont la livraison est chiffrée.</p>
      )}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button type="button" disabled className="abk-bouton bg-marine px-6 py-3 text-sm font-bold text-blanc opacity-50">
          Demander un devis
        </button>
        <p className="text-sm text-gris">Arrive avec la tranche transitaire.</p>
      </div>
    </section>
  );
}
