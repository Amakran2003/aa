import type { Candidate, ParcoursStep, ProductSheet, Rates } from "@aa/contracts";
import { PARCOURS_STEPS } from "@aa/contracts";
import { companyName, recommendedPrice } from "@aa/core/parcours";
import { amountOf, simulationOf } from "@/features/parcours/simulation-step";
import type { SimulationInputs } from "@/features/parcours/simulation-step";
import type { SupplierDetail } from "@/features/parcours/use-supplier-details";

const cents = (value: number) => Math.round(value * 100) / 100;

function field(sheet: ProductSheet, label: string): string | null {
  return sheet.fields.find((item) => item.label === label)?.value ?? null;
}

export function contextOf({
  sheet,
  stage,
  candidates,
  chosen,
  details,
  rates,
  inputs,
}: {
  sheet: ProductSheet | null;
  stage: ParcoursStep;
  candidates: Candidate[];
  chosen: Candidate[];
  details: Record<string, SupplierDetail>;
  rates: Rates | null;
  inputs: SimulationInputs;
}): string {
  if (!sheet) return JSON.stringify({ etape: PARCOURS_STEPS[stage - 1] });
  const usine = (candidate: Candidate) => companyName(candidate.offer.supplier) ?? candidate.offer.title;
  return JSON.stringify({
    etape: PARCOURS_STEPS[stage - 1],
    produit: {
      titre: sheet.title,
      site: sheet.source,
      prix: field(sheet, "Prix"),
      moq: field(sheet, "MOQ"),
      carton: field(sheet, "Package Size"),
      poids: field(sheet, "Package Gross Weight"),
      usine: sheet.supplier,
    },
    budget: {
      total: amountOf(inputs.budget),
      misDeCote: amountOf(inputs.aside) ?? 0,
      prixDeVenteTape: amountOf(inputs.sale),
      cotisations: "12,3 % du chiffre encaissé",
      fraisDePaiement: "1,5 % de la vente",
    },
    usinesProposees: candidates.slice(0, 12).map((candidate) => ({
      usine: usine(candidate),
      site: candidate.offer.source,
      ancienneteAns: candidate.offer.years,
      verifiee: candidate.offer.verified ?? null,
      tradeAssurance: candidate.offer.assurance ?? null,
      note: candidate.offer.rating ?? null,
      prixAffiche: candidate.offer.price,
      moq: candidate.offer.moq,
      serieuse: candidate.passes,
      cadreSeul: candidate.frameOnly,
      cochee: chosen.includes(candidate),
    })),
    usinesChoisies: chosen.map((candidate) => {
      const detail = details[candidate.offer.href];
      const fiche = detail?.state === "ready" ? detail.sheet : null;
      const result = simulationOf(candidate, details, rates, inputs);
      const ready = result?.kind === "ready" ? result : null;
      return {
        usine: usine(candidate),
        role: fiche?.factory.role ?? null,
        paliers: fiche?.tiers?.map((tier) => `${tier.from}${tier.to ? `-${tier.to}` : "+"} : ${tier.price}`) ?? [],
        moq: fiche ? field(fiche, "MOQ") : candidate.offer.moq,
        carton: fiche ? field(fiche, "Package Size") : null,
        livraisonEchantillon: fiche?.sample?.shipping
          ? {
              prix: fiche.sample.shipping.amount,
              devise: fiche.sample.shipping.currency,
              pourQuantite: fiche.sample.shipping.quantity,
              delai: fiche.sample.shipping.transit,
              droitsCompris: fiche.sample.shipping.dutiesIncluded,
            }
          : "non affichée par le site",
        simulation: ready
          ? {
              estimation: true,
              quantiteRamenee: ready.quantity,
              coutRenduParPiece: cents(ready.unit.total),
              dont: { usine: cents(ready.unit.factory), livraison: cents(ready.unit.shipping), tva: cents(ready.unit.vat) },
              enveloppe: ready.envelope,
              resteDuBudget: cents(ready.left),
              echantillonLivre: cents(ready.sample.total),
              prixDeVenteConseille: recommendedPrice(ready.unit.total),
              volumeLotM3: ready.lot.volume,
              poidsLotKg: ready.lot.weight,
            }
          : (result?.kind ?? "fiche en lecture"),
      };
    }),
  });
}
