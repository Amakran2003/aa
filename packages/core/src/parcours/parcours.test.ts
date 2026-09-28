import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Offer, PriceTier, ProductSheet } from "@aa/contracts";
import { sampleOf, shippingOf } from "../fiche/sample.ts";
import { netMargin } from "../marge/compute.ts";
import { companyName, supplierMessage } from "./message.ts";
import { frameOnly, shortlist } from "./shortlist.ts";
import { recommendedPrice, simulate } from "./simulate.ts";

function sheet(
  title: string,
  fields: Record<string, string>,
  tiers: PriceTier[],
  shipping: { amount: number; quantity: number } | null,
): ProductSheet {
  return {
    source: "alibaba",
    url: `https://www.alibaba.com/product-detail/${encodeURIComponent(title)}.html`,
    title,
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
    tiers,
    sample: {
      price: null,
      shipping: shipping
        ? { ...shipping, currency: "EUR", transit: "45 à 50 jours", method: "Ocean + Express", dutiesIncluded: false }
        : null,
    },
  };
}

const huasheng = sheet(
  "Modern D12 Dual Motor Ergonomic Standing Desk Electric Table",
  { MOQ: "1 piece", "Package Size": "125X36X15 cm", "Package Gross Weight": "21 kg" },
  [
    { from: 1, to: 9, price: "€67.48" },
    { from: 10, to: 99, price: "€63.93" },
    { from: 100, to: 499, price: "€58.61" },
    { from: 500, to: null, price: "€54.17" },
  ],
  { amount: 30.77, quantity: 1 },
);

const ofitech = sheet(
  "Office Furniture Dual Motor Electric Standing Desk Frame",
  { MOQ: "2 pieces" },
  [
    { from: 2, to: 99, price: "€83.38" },
    { from: 100, to: 499, price: "€65.62" },
    { from: 500, to: 999, price: "€60.65" },
    { from: 1000, to: null, price: "€55.59" },
  ],
  { amount: 58.61, quantity: 2 },
);

describe("simulation du budget", () => {
  it("ramène 87 bureaux Huasheng livrés avec 10 000 €", () => {
    const result = simulate({ sheet: huasheng, rates: null, budget: 10_000, aside: 0 });
    assert.equal(result.kind, "ready");
    if (result.kind !== "ready") return;
    assert.equal(result.quantity, 87);
    assert.equal(Math.round(result.unit.total * 100) / 100, 113.64);
    assert.equal(result.unit.duty, 0);
    assert.equal(Math.round(result.sample.total * 100) / 100, 117.9);
    assert.equal(result.ask.factory, 58.61);
    assert.equal(result.lot.weight, 1827);
    assert.ok(result.spent <= 10_000);
  });

  it("ramène 61 bureaux quand 3 000 € sont mis de côté", () => {
    const result = simulate({ sheet: huasheng, rates: null, budget: 10_000, aside: 3_000 });
    assert.equal(result.kind === "ready" && result.quantity, 61);
  });

  it("ramène la livraison de la commande minimum à la pièce", () => {
    const result = simulate({ sheet: ofitech, rates: null, budget: 10_000, aside: 0 });
    assert.equal(result.kind, "ready");
    if (result.kind !== "ready") return;
    assert.equal(result.quantity, 73);
    assert.equal(Math.round(result.unit.shipping * 1000) / 1000, 29.305);
    assert.equal(Math.round(result.sample.total * 100) / 100, 270.44);
  });

  it("n'invente pas de fret quand la fiche n'a pas de livraison", () => {
    const result = simulate({ sheet: { ...huasheng, sample: { price: null, shipping: null } }, rates: null, budget: 10_000, aside: 0 });
    assert.equal(result.kind, "no-shipping");
    assert.equal(result.kind === "no-shipping" && result.factoryFrom, 54.17);
  });

  it("dit quand le budget ne paie pas la commande minimum", () => {
    const result = simulate({ sheet: ofitech, rates: null, budget: 200, aside: 0 });
    assert.equal(result.kind, "too-small");
  });

  it("convertit les dollars au taux BCE", () => {
    const usd = { ...huasheng, tiers: [{ from: 1, to: null, price: "US $110.00" }] };
    const result = simulate({ sheet: usd, rates: { base: "EUR", date: "2026-09-25", values: { USD: 1.1 } }, budget: 10_000, aside: 0 });
    assert.equal(result.kind === "ready" && result.unit.factory, 100);
  });

  it("calcule la marge nette après cotisations et paiement", () => {
    const net = netMargin(400, 113.64, 12.3, 1.5);
    assert.equal(Math.round(net.perUnit * 100) / 100, 231.16);
  });

  it("conseille un prix de vente qui garde au moins 30 % net", () => {
    const price = recommendedPrice(113.64);
    assert.equal(price, 209);
    assert.ok(netMargin(price, 113.64, 12.3, 1.5).rate >= 0.3);
    assert.ok(netMargin(recommendedPrice(112.4), 112.4, 12.3, 1.5).rate >= 0.3);
  });
});

describe("fournisseurs et message", () => {
  const offer = (title: string, years: number | null, price: number, source: Offer["source"] = "alibaba"): Offer => ({
    href: `https://www.${source}.com/product-detail/${encodeURIComponent(title)}.html`,
    title,
    image: null,
    price: `US $${price}.00`,
    moq: "2 pieces",
    supplier: `${title} Co., Ltd.`,
    source,
    close: true,
    years,
  });

  it("met d'abord les usines Alibaba sérieuses, les moins chères cochées d'avance", () => {
    const list = shortlist({
      ...huasheng,
      fields: [],
      offers: [
        offer("A", 14, 80),
        offer("B", null, 40),
        offer("C", 1, 45),
        offer("D", 3, 60),
        offer("E", 10, 70),
        offer("F", 5, 90),
        offer("G", 8, 30, "made-in-china"),
      ],
    });
    assert.deepEqual(
      list.filter((item) => item.preselected).map((item) => item.offer.title),
      ["D", "E", "A"],
    );
    assert.deepEqual(list.map((item) => item.offer.title), ["D", "E", "A", "F", "G", "B", "C"]);
    assert.equal(list.find((item) => item.offer.title === "B")?.reason, "Ancienneté absente");
  });

  it("garde une seule ligne par usine, son offre la moins chère", () => {
    const list = shortlist({
      ...huasheng,
      fields: [],
      offers: [{ ...offer("A", 5, 90), href: "https://www.alibaba.com/a1.html" }, { ...offer("A", 5, 70), href: "https://www.alibaba.com/a2.html" }],
    });
    assert.deepEqual(list.map((item) => item.offer.href), ["https://www.alibaba.com/a2.html"]);
  });

  it("signale un cadre vendu sans plateau", () => {
    assert.equal(frameOnly("Office Furniture Dual Motor Electric Standing Desk Frame"), true);
    assert.equal(frameOnly("Standing Desk Frame with Desk Top"), false);
  });

  it("écrit le message du livre sans le budget", () => {
    const text = supplierMessage({ supplier: "Ningbo Ofitech Business Machines Co., Ltd.", product: "Standing Desk" });
    assert.equal(companyName("Ningbo Ofitech Business Machines Co., Ltd."), "Ningbo Ofitech Business Machines");
    assert.match(text, /^Dear Ningbo Ofitech Business Machines team,/);
    assert.match(text, /test quantity of 1 unit/);
    assert.match(text, /100, 300 and 500 units/);
    assert.doesNotMatch(text, /10[\s,.]?000|budget/i);
  });
});

describe("échantillon Alibaba", () => {
  it("lit la livraison vers la France pour la commande minimum", () => {
    const shipping = shippingOf({
      data: {
        hasValidLogistics: true,
        quantity: "2",
        tariffIncluded: false,
        logisticGroup: [
          {
            list: [
              {
                innerFloor: {
                  data: {
                    isSelected: true,
                    price: "€58.61",
                    dollarPriceNumber: 66,
                    deliveryDateText: "Transit time: Est. <b>45-50 days</b>",
                    displayShippingType: 'Ocean + Express  via <img src="x.png"></img> FLY Logistics',
                  },
                },
              },
            ],
          },
        ],
      },
    });
    assert.deepEqual(shipping, {
      amount: 58.61,
      currency: "EUR",
      quantity: 2,
      transit: "45 à 50 jours",
      method: "Ocean + Express via FLY Logistics",
      dutiesIncluded: false,
    });
  });

  it("ne donne pas de livraison quand Alibaba la laisse à négocier", () => {
    assert.equal(shippingOf({ data: { hasValidLogistics: false, buttonKey: "NOLOGISTICS" } }), null);
  });

  it("lit le prix de l'échantillon", () => {
    const html = 'x "sampleInfo":{"enable":true,"formatPrice":"€44.40-106.55","freeSample":false} y';
    assert.deepEqual(sampleOf(html, null), { price: "€44.40-106.55", shipping: null });
  });
});
