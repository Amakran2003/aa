import type { BestOffer, PriceTier, SampleShipping } from "../fiche/sheet.ts";

export const PARCOURS_STEPS = ["Produit", "Fournisseurs", "Messages", "Simulation", "Transport"] as const;

export type ParcoursStep = 1 | 2 | 3 | 4 | 5;

export const MAX_SUPPLIERS = 5;

export type Candidate = {
  offer: BestOffer;
  passes: boolean;
  reason: string | null;
  frameOnly: boolean;
  preselected: boolean;
};

export type SimulationUnit = {
  factory: number;
  shipping: number;
  duty: number | null;
  vat: number;
  total: number;
  tier: PriceTier | null;
};

export type SimulationSample = { quantity: number; total: number };

export type Simulation =
  | {
      kind: "ready";
      envelope: number;
      quantity: number;
      unit: SimulationUnit;
      spent: number;
      left: number;
      sample: SimulationSample;
      ask: { quantity: number; factory: number | null };
      shipping: SampleShipping;
      dutyNote: string | null;
      lot: { volume: number | null; weight: number | null; carton: string | null };
    }
  | { kind: "too-small"; envelope: number; sample: SimulationSample }
  | { kind: "no-shipping"; factoryFrom: number | null }
  | { kind: "no-price" };
