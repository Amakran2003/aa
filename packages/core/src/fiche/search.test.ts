import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isCloseMatch } from "./search.ts";

describe("même type de produit", () => {
  it("garde le critère bureau à deux moteurs", () => {
    const desk = "Double Person Four Motors Workstation Office Height Adjustable Electric Lifting Computer Table";
    assert.equal(isCloseMatch("Dual Motor Electric Standing Desk", desk), true);
    assert.equal(isCloseMatch("Women Winter Pajamas Set", desk), false);
  });

  it("retrouve un pyjama parmi les annonces Alibaba", () => {
    const pajama = "China Hot Sale Christmas Family Loungewear Santa Claus Print Pajamas";
    assert.equal(isCloseMatch("Women Christmas Pajamas Winter Sleepwear", pajama), true);
    assert.equal(isCloseMatch("Dual Motor Electric Standing Desk", pajama), false);
  });
});
