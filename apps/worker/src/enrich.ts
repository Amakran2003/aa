import type { Currency, Market, MarketProbe, Offer, ProductSheet, Rates } from "@aa/contracts";
import { SEARCH_VERSION } from "@aa/contracts";
import {
  CURRENCIES,
  offersFromMarket,
  pageBlocked,
  rankOffers,
  remember,
  searchQueries,
  searchTargets,
} from "@aa/core";
import { readSearchPages } from "./browse.ts";

const MAX_BYTES = 2_000_000;

async function euroRates(): Promise<Rates | null> {
  const wanted = CURRENCIES.filter((currency) => currency !== "EUR");
  try {
    const response = await fetch(`https://api.frankfurter.app/latest?from=EUR&to=${wanted.join(",")}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as { date?: string; rates?: Partial<Record<Currency, number>> };
    if (!payload.date || !payload.rates) return null;
    return { base: "EUR", date: payload.date, values: payload.rates };
  } catch {
    return null;
  }
}

export async function enrich(sheet: ProductSheet): Promise<ProductSheet> {
  const queries = searchQueries(sheet);
  const labels = sheet.fields
    .filter((field) => field.value && !HIGHLIGHTS.has(field.label))
    .map((field) => field.label);
  const groups = fallbackGroups(labels);
  const [rates, ...first] = await Promise.all([
    euroRates(),
    collectMarket(sheet, "made-in-china", queries),
    collectMarket(sheet, "alibaba", queries),
  ]);
  const base = { ...sheet, rates, searchVersion: SEARCH_VERSION };
  await remember(listed(base, groups, first));
  const dhgate = await collectMarket(sheet, "dhgate", queries);
  const done = listed(base, groups, [...first, dhgate]);
  await remember(done);
  return done;
}

function listed(
  sheet: ProductSheet,
  groups: ProductSheet["groups"],
  buckets: { found: Offer[]; probe: MarketProbe }[],
): ProductSheet {
  return rankOffers(merged(sheet, groups, buckets));
}

function merged(
  sheet: ProductSheet,
  groups: ProductSheet["groups"],
  buckets: { found: Offer[]; probe: MarketProbe }[],
): ProductSheet {
  const seen = new Set<string>();
  const offers: Offer[] = [];
  const ordered = [
    ...buckets.filter((bucket) => bucket.probe.source !== "made-in-china"),
    ...buckets.filter((bucket) => bucket.probe.source === "made-in-china"),
  ];
  for (const bucket of ordered) {
    for (const offer of bucket.found) {
      if (seen.has(offer.href) || offer.href === sheet.url) continue;
      seen.add(offer.href);
      offers.push(offer);
    }
  }
  return { ...sheet, groups, offers, probes: buckets.map((bucket) => bucket.probe) };
}

async function collectMarket(
  sheet: ProductSheet,
  source: Market,
  queries: string[],
): Promise<{ found: Offer[]; probe: MarketProbe }> {
  const found: Offer[] = [];
  const seen = new Set<string>();
  let blocked = false;
  const targets = queries.flatMap((query) => searchTargets(query).filter((item) => item.source === source));
  if (queries.length === 0) {
    return { found, probe: { source, state: "vide", count: 0 } };
  }
  if (source === "dhgate") {
    try {
      const pages = await readSearchPages(targets.map((item) => item.url));
      for (const html of pages) {
        if (!html) {
          blocked = true;
          continue;
        }
        for (const offer of offersFromMarket("dhgate", html, sheet.url, sheet.title ?? "")) {
          if (seen.has(offer.href)) continue;
          seen.add(offer.href);
          found.push(offer);
        }
      }
    } catch {
      blocked = true;
    }
  } else {
    for (const target of targets) {
      try {
        const response = await fetch(target.url, {
          headers: { "user-agent": "Mozilla/5.0" },
          redirect: "follow",
          signal: AbortSignal.timeout(20000),
        });
        const html = await response.text();
        const host = new URL(target.url).hostname;
        if (!response.ok || html.length > MAX_BYTES || (source !== "alibaba" && pageBlocked(html, host))) {
          blocked = true;
          continue;
        }
        for (const offer of offersFromMarket(source, html, sheet.url, sheet.title ?? "")) {
          if (seen.has(offer.href)) continue;
          seen.add(offer.href);
          found.push(offer);
        }
      } catch {
        blocked = true;
      }
    }
  }
  return {
    found,
    probe: { source, state: found.length > 0 ? "lu" : blocked ? "bloque" : "vide", count: found.length },
  };
}

async function markSimilar(sheet: ProductSheet): Promise<ProductSheet> {
  const key = process.env.OPENAI_API_KEY;
  const hero = sheet.images[0];
  const candidates = sheet.related.filter((item) => item.image).slice(0, 6);
  if (!key || !hero || candidates.length === 0) return sheet;

  const images = [hero, ...candidates.map((item) => item.image as string)];
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        authorization: `Bearer ${key}`,
        "content-type": "application/json",
      },
      signal: AbortSignal.timeout(40000),
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Image 1 est le produit à sourcer. Les images suivantes sont d'autres modèles. Décris le meuble de l'image 1 en une phrase française : type, matière visible, s'il est réglable en hauteur. Ne décris pas le logo ni l'usine. Ensuite liste les index à partir de 2 qui sont le même type de meuble. JSON seul : {"description":"...","similar":[2,4]}`,
              },
              ...images.map((url) => ({ type: "image_url", image_url: { url } })),
            ],
          },
        ],
      }),
    });
    if (!response.ok) return sheet;
    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) return sheet;
    const parsed = JSON.parse(content) as { description?: string; similar?: number[] };
    const similar = new Set(parsed.similar ?? []);
    return {
      ...sheet,
      description: parsed.description ?? null,
      related: sheet.related.map((item) => {
        const index = candidates.indexOf(item);
        if (index < 0) return item;
        return { ...item, similar: similar.has(index + 2) };
      }),
    };
  } catch {
    return sheet;
  }
}

const HIGHLIGHTS = new Set(["Prix", "MOQ", "Package Size", "Package Gross Weight", "Model NO."]);

function fallbackGroups(labels: string[]): { name: string; labels: string[] }[] {
  const buckets: { name: string; match: (label: string) => boolean }[] = [
    { name: "Dimensions", match: (label) => /size|weight|elevation|desktop|load|package/i.test(label) },
    { name: "Matière", match: (label) => /material|table top|top/i.test(label) },
    { name: "Commande", match: (label) => /payment|delivery|warranty|oem|business/i.test(label) },
    { name: "Conformité", match: (label) => /hs code|certificate|origin/i.test(label) },
  ];
  const used = new Set<string>();
  const groups = buckets
    .map((bucket) => ({
      name: bucket.name,
      labels: labels.filter((label) => {
        if (used.has(label) || !bucket.match(label)) return false;
        used.add(label);
        return true;
      }),
    }))
    .filter((group) => group.labels.length > 0);
  const rest = labels.filter((label) => !used.has(label));
  if (rest.length > 0) groups.push({ name: "Autres", labels: rest });
  return groups;
}

async function groupFields(sheet: ProductSheet): Promise<{ name: string; labels: string[] }[]> {
  const labels = sheet.fields
    .filter((field) => field.value && !HIGHLIGHTS.has(field.label))
    .map((field) => field.label);
  if (labels.length === 0) return [];
  const key = process.env.OPENAI_API_KEY;
  if (!key) return fallbackGroups(labels);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        authorization: `Bearer ${key}`,
        "content-type": "application/json",
      },
      signal: AbortSignal.timeout(20000),
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "user",
            content: `Classe ces caractéristiques de fiche produit en 3 à 5 catégories courtes en français. Chaque libellé doit apparaître une seule fois. N'invente pas de libellé. JSON seul : {"groups":[{"name":"Dimensions","labels":["Package Size"]}]} Libellés : ${labels.join(", ")}`,
          },
        ],
      }),
    });
    if (!response.ok) return fallbackGroups(labels);
    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) return fallbackGroups(labels);
    const parsed = JSON.parse(content) as { groups?: { name?: string; labels?: string[] }[] };
    const known = new Set(labels);
    const used = new Set<string>();
    const groups = (parsed.groups ?? [])
      .map((group) => ({
        name: group.name?.trim() || "Autres",
        labels: (group.labels ?? []).filter((label) => {
          if (!known.has(label) || used.has(label)) return false;
          used.add(label);
          return true;
        }),
      }))
      .filter((group) => group.labels.length > 0);
    const rest = labels.filter((label) => !used.has(label));
    if (rest.length > 0) groups.push({ name: "Autres", labels: rest });
    return groups.length > 0 ? groups : fallbackGroups(labels);
  } catch {
    return fallbackGroups(labels);
  }
}
