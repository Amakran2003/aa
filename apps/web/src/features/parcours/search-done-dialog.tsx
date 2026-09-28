"use client";

import { useEffect, useRef } from "react";
import type { Candidate } from "@aa/contracts";
import { companyName } from "@aa/core/parcours";

export function SearchDoneDialog({
  open,
  candidates,
  onChoose,
  onSeeOffers,
  onDismiss,
}: {
  open: boolean;
  candidates: Candidate[];
  onChoose: () => void;
  onSeeOffers: () => void;
  onDismiss: () => void;
}) {
  const ref = useRef<HTMLDialogElement | null>(null);
  const passing = candidates.filter((candidate) => candidate.passes);
  const shown = candidates.filter((candidate) => candidate.preselected);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog ref={ref} className="parcours-dialog" aria-labelledby="recherche-finie" onClose={onDismiss}>
      <div className="p-6">
        <h2 id="recherche-finie" className="text-lg font-bold text-encre">
          La recherche est finie
        </h2>
        <p className="mt-2 text-sm text-gris">
          {passing.length > 0
            ? `${passing.length} usine${passing.length > 1 ? "s sérieuses" : " sérieuse"} pour ce produit : même type de produit, au moins 2 ans sur le site. On peut leur écrire maintenant.`
            : "Aucune usine trouvée n'affiche encore assez d'ancienneté. Tu peux quand même choisir à qui écrire."}
        </p>
        {shown.length > 0 ? (
          <ul className="mt-4 divide-y divide-[var(--abk-bordure-clair)] rounded-[var(--abk-rayon-bouton)] border border-[var(--abk-bordure-clair)]">
            {shown.map((candidate) => (
              <li key={candidate.offer.href} className="flex items-baseline justify-between gap-3 px-4 py-2.5 text-sm">
                <span className="min-w-0 truncate font-semibold text-encre">
                  {companyName(candidate.offer.supplier) ?? candidate.offer.title}
                </span>
                <span className="shrink-0 text-gris">{candidate.offer.years} ans</span>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={onChoose} className="abk-bouton bg-marine px-5 py-3 text-sm font-bold text-blanc" autoFocus>
            Choisir qui contacter
          </button>
          <button
            type="button"
            onClick={onSeeOffers}
            className="abk-bouton border border-[var(--abk-bordure-clair)] bg-blanc px-5 py-3 text-sm font-semibold text-encre"
          >
            Voir les usines
          </button>
        </div>
      </div>
    </dialog>
  );
}
