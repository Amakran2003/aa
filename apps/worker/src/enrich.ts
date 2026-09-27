import type { Market, MarketProbe, Offer, ProductSheet } from "@aa/contracts";
import { offersFromMarket, pageBlocked, searchQueries, searchTargets } from "@aa/core";

const MAX_BYTES = 2_000_000;

export async function enrich(sheet: ProductSheet): Promise<ProductSheet> {
  const [compared, groups, offers] = await Promise.all([
    markSimilar(sheet),
    groupFields(sheet),
    collectOffers(sheet),
  ]);
  return { ...compared, groups, offers: offers.offers, probes: offers.probes };
}

async function collectOffers(sheet: ProductSheet): Promise<{ offers: Offer[]; probes: MarketProbe[] }> {
  const queries = searchQueries(sheet);
  const markets: Market[] = ["made-in-china", "alibaba", "dhgate"];
  if (queries.length === 0) {
    return { offers: [], probes: markets.map((source) => ({ source, state: "vide", count: 0 })) };
  }
  const grouped = await Promise.all(
    markets.map(async (source) => {
      const found: Offer[] = [];
      const seen = new Set<string>();
      let blocked = false;
      for (const query of queries) {
        const target = searchTargets(query).find((item) => item.source === source);
        if (!target) continue;
        try {
          const response = await fetch(target.url, {
            headers: { "user-agent": "Mozilla/5.0" },
            redirect: "follow",
            signal: AbortSignal.timeout(15000),
          });
          const html = await response.text();
          const host = new URL(target.url).hostname;
          if (!response.ok || html.length > MAX_BYTES || pageBlocked(html, host)) {
            blocked = true;
            continue;
          }
          for (const offer of offersFromMarket(source, html, sheet.url)) {
            if (seen.has(offer.href)) continue;
            seen.add(offer.href);
            found.push(offer);
          }
        } catch {
          blocked = true;
        }
      }
      const probe: MarketProbe = {
        source,
        state: found.length > 0 ? "lu" : blocked ? "bloque" : "vide",
        count: found.length,
      };
      return { found, probe };
    }),
  );
  const seen = new Set<string>();
  const offers: Offer[] = [];
  for (const group of grouped) {
    for (const offer of group.found) {
      if (seen.has(offer.href) || offer.href === sheet.url) continue;
      seen.add(offer.href);
      offers.push(offer);
      if (offers.length >= 24) break;
    }
  }
  return { offers, probes: grouped.map((group) => group.probe) };
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
