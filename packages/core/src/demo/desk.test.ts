import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { shortlist } from "../parcours/shortlist.ts";
import { simulate } from "../parcours/simulate.ts";
import { DEMO_BUDGET, DEMO_FACTORY, DEMO_URL, demoSheet } from "./desk.ts";

describe("démo bureau", () => {
  it("rejoue le bureau déjà lu, avec une livraison réelle", () => {
    const origin = demoSheet(DEMO_URL);
    assert.ok(origin);
    assert.equal(shortlist(origin).filter((candidate) => candidate.preselected).length, 3);
    const factory = demoSheet(DEMO_FACTORY);
    assert.ok(factory?.sample?.shipping);
    const result = simulate({
      sheet: factory,
      rates: factory.rates ?? null,
      budget: DEMO_BUDGET,
      aside: 3_000,
    });
    assert.equal(result.kind, "ready");
  });
});
