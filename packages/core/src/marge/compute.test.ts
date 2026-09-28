import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ProductSheet, ProjectSettings } from "@aa/contracts";
import { marginOf, type LotValues } from "./compute.ts";
import { cellsOf } from "./lot.ts";

const project: ProjectSettings = {
  budgetTotal: 10_000,
  setAside: 3_000,
  salePrice: 400,
  contributionRate: 12.3,
  paymentRate: 1.5,
  marginFloor: 25,
  unitCap: null,
  updatedBy: "test@aa.local",
};

const emptyLot: LotValues = {
  quantity: null,
  factory: null,
  volume: null,
  weight: null,
  freight: null,
  inland: null,
  broker: null,
  duties: null,
  vat: null,
};

function sheet(fields: Record<string, string>, extra: Partial<ProductSheet> = {}): ProductSheet {
  return {
    source: "alibaba",
    url: "https://www.alibaba.com/product-detail/desk_1.html",
    title: "Bureau",
    supplier: null,
    images: [],
    description: null,
    fields: Object.entries(fields).map(([label, value]) => ({ label, value })),
    groups: [],
    factory: { city: null, place: null, role: null, member: null, memberSince: null, rating: null, audited: false },
    traits: [],
    laterNotes: [],
    related: [],
    offers: [],
    probes: [],
    ...extra,
  };
}

describe("marge", () => {
  it("refuse le bureau au MOQ 20 à 70 € avec 500 € de fret, même avec des cases encore vides", () => {
    const result = marginOf(
      { ...project, unitCap: 100 },
      { ...emptyLot, quantity: 20, factory: 70, volume: 1.2, weight: 500, freight: 500, vat: 340 },
    );
    assert.equal(result.verdict, "over-target");
    assert.equal(result.cash, null);
    assert.equal(result.unitAtLeast, 112);
    assert.match(result.reason ?? "", /Au moins 112/);
  });

  it("laisse la marge incomplète quand la fiche n'a pas de carton", () => {
    const cells = cellsOf(sheet({ MOQ: "20 Sets", Prix: "€70.00" }), {});
    const lot = Object.fromEntries(cells.map((cell) => [cell.line, cell.value])) as LotValues;
    const result = marginOf(project, lot);
    assert.equal(lot.quantity, 20);
    assert.equal(lot.factory, 70);
    assert.equal(lot.volume, null);
    assert.equal(result.verdict, "incomplete");
    assert.ok(result.missing.some((item) => item.key === "volume"));
  });

  it("recalcule avec un fret saisi sans remplir les autres cases vides", () => {
    const before = marginOf(project, { ...emptyLot, quantity: 20, factory: 70 });
    const after = marginOf(project, { ...emptyLot, quantity: 20, factory: 70, freight: 500 });
    assert.equal(after.known - before.known, 500);
    assert.deepEqual(
      before.missing.filter((item) => item.key !== "freight"),
      after.missing,
    );
    assert.equal(after.verdict, "incomplete");
    assert.equal(after.ceiling, null);
  });

  it("donne le plafond usine seulement quand la quantité et les cases du trajet sont remplies", () => {
    const lot = { ...emptyLot, quantity: 60, freight: 1_500, inland: 300, broker: 250, duties: 0, vat: 1_020 };
    const result = marginOf(project, lot);
    assert.equal(result.ceiling, (7_000 - 3_070) / 60);
    assert.equal(result.verdict, "incomplete");
  });

  it("passe au vert seulement quand tout est rempli, dans l'enveloppe et au-dessus du seuil", () => {
    const lot = { ...emptyLot, quantity: 60, factory: 60, volume: 9, weight: 1_800, freight: 1_500, inland: 300, broker: 250, duties: 0, vat: 1_020 };
    const result = marginOf(project, lot);
    assert.equal(result.cash, 6_670);
    assert.equal(result.verdict, "holds");
    assert.ok((result.netRate ?? 0) > 0.25);
  });

  it("reste incomplète si un réglage du projet manque", () => {
    const lot = { ...emptyLot, quantity: 60, factory: 60, volume: 9, weight: 1_800, freight: 1_500, inland: 300, broker: 250, duties: 0, vat: 1_020 };
    const result = marginOf({ ...project, salePrice: null }, lot);
    assert.equal(result.verdict, "incomplete");
    assert.deepEqual(result.missing.map((item) => item.key), ["salePrice"]);
  });

  it("dit hors budget dès que le déjà chiffré dépasse l'enveloppe", () => {
    const result = marginOf(project, { ...emptyLot, quantity: 100, factory: 80 });
    assert.equal(result.verdict, "over-budget");
  });

  it("prend le palier de la quantité et convertit le dollar au taux BCE", () => {
    const cells = cellsOf(
      sheet(
        { MOQ: "1 piece", "Package Size": "120X60X15 cm", "Package Gross Weight": "25.000 kg" },
        {
          tiers: [
            { from: 1, to: 99, price: "US $67.99" },
            { from: 100, to: 499, price: "US $65.45" },
            { from: 500, to: null, price: "US $62.47" },
          ],
          rates: { base: "EUR", date: "2026-09-25", values: { USD: 1.1 } },
        },
      ),
      { quantity: { value: 200, by: "test@aa.local" } },
    );
    const value = (line: string) => cells.find((cell) => cell.line === line)?.value;
    assert.equal(value("quantity"), 200);
    assert.equal(value("factory"), 59.5);
    assert.equal(value("volume"), 21.6);
    assert.equal(value("weight"), 5_000);
    assert.equal(cells.find((cell) => cell.line === "freight")?.source, null);
  });
});
