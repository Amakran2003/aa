"use client";

import type { PriceTier } from "@aa/contracts";
import { Money } from "@/features/fiche/currency";

function range(tier: PriceTier): string {
  if (tier.to === null) return `${tier.from} et plus`;
  if (tier.to === tier.from) return `${tier.from}`;
  return `${tier.from} à ${tier.to}`;
}

export function PriceTiers({ tiers }: { tiers: PriceTier[] | undefined }) {
  if (!tiers || tiers.length === 0) return null;
  return (
    <div className="mt-4">
      <h4 className="text-xs font-medium text-gris">Prix par quantité</h4>
      <table className="mt-2 w-full overflow-hidden rounded-[var(--abk-rayon-bouton)] border border-[var(--abk-bordure-clair)] bg-blanc text-sm">
        <thead className="bg-[var(--abk-brume)]">
          <tr className="text-left text-xs text-gris">
            <th scope="col" className="px-3 py-2 font-medium">
              Quantité
            </th>
            <th scope="col" className="px-3 py-2 text-right font-medium">
              Prix unitaire
            </th>
          </tr>
        </thead>
        <tbody>
          {tiers.map((tier) => (
            <tr key={tier.from} className="border-t border-[var(--abk-bordure-clair)]">
              <td className="px-3 py-2 text-encre">{range(tier)}</td>
              <td className="px-3 py-2 text-right">
                <Money text={tier.price} size="sm" original={false} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
