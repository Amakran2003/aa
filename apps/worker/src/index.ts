import { readFileSync } from "node:fs";
import { recall, remember, takeEnrich } from "@aa/core";
import { enrich } from "./enrich.ts";

function loadEnv() {
  const file = new URL("../../../.env.local", import.meta.url);
  let text = "";
  try {
    text = readFileSync(file, "utf8");
  } catch {
    return;
  }
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const splitAt = trimmed.indexOf("=");
    if (splitAt < 1) continue;
    const key = trimmed.slice(0, splitAt);
    if (process.env[key]) continue;
    process.env[key] = trimmed.slice(splitAt + 1);
  }
}

loadEnv();

async function loop() {
  for (;;) {
    const url = await takeEnrich();
    if (!url) continue;
    const sheet = await recall(url);
    if (!sheet) continue;
    const ranked = sheet.offers.every((offer) => typeof offer.close === "boolean");
    const covered = (sheet.probes ?? []).length >= 3;
    if (covered && ranked) continue;
    const next = await enrich(sheet);
    await remember(next);
  }
}

loop().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
