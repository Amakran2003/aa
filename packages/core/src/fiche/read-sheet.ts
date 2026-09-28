import type { FactoryCard, FactoryRole, ProductSheet, RelatedProduct, SheetField } from "@aa/contracts";
import { tierRange, tiersOf } from "./price.ts";
import { marketOf } from "./search.ts";

const EMPTY_FACTORY: FactoryCard = {
  city: null,
  place: null,
  role: null,
  member: null,
  memberSince: null,
  rating: null,
  audited: false,
};

const LABELS = [
  "Model NO.",
  "HS Code",
  "Package Size",
  "Package Gross Weight",
  "Export Years",
  "Certificate",
  "Business Type",
  "Payment Term",
  "Leg Material:",
  "Table Top",
  "Warranty",
  "Product Name",
  "Maximum Load",
  "The Range of Table Leg Elevation",
  "Support desktop size range",
  "Delivery Time",
  "Transport Package",
  "Origin",
  "Trademark",
  "OEM or ODM",
] as const;

function linesOf(html: string): string[] {
  const withoutScripts = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ");
  const text = withoutScripts
    .replace(/<[^>]+>/g, "\n")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#xa0;/g, " ");
  return text
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length > 0 && !line.startsWith("&#"));
}

function after(lines: string[], label: string): string | null {
  const index = lines.indexOf(label);
  const value = index >= 0 ? lines[index + 1] : undefined;
  if (!value || value === label) return null;
  return value;
}

function titleOf(html: string): string | null {
  const match = html.match(/<title>([\s\S]*?)<\/title>/i);
  if (!match) return null;
  const title = match[1].replace(/\s+/g, " ").trim();
  return title.split(" - ")[0]?.trim() || title;
}

function absoluteImage(raw: string): string {
  if (raw.startsWith("http")) return raw;
  return `https:${raw.startsWith("//") ? raw : `//${raw}`}`;
}

function galleryOf(html: string): string[] {
  const found = html.match(/(?:https?:)?\/\/image\.made-in-china\.com\/[^"'\s>]+\.(?:webp|jpg|jpeg)/gi) ?? [];
  const urls = found.map(absoluteImage).filter((url) => !/BLOCK-COVER|transparent|mp4|Co-Ltd|company/i.test(url));
  const slug = urls[0]?.split("/").at(-1)?.replace(/\.(webp|jpg|jpeg)$/i, "");
  const byId = new Map<string, string>();
  for (const url of urls) {
    const parts = url.split("/");
    const name = parts.at(-1)?.replace(/\.(webp|jpg|jpeg)$/i, "");
    const id = parts.at(-2)?.replace(/^\d+f\d+j00/, "");
    if (!id || (slug && name !== slug)) continue;
    const big = /\/2f0j00/.test(url);
    if (!byId.has(id) || big) byId.set(id, url);
  }
  return [...byId.values()].slice(0, 10);
}

function relatedOf(html: string): RelatedProduct[] {
  const blocks = html.match(/class="also-viewed-item"[\s\S]{0,2600}/g) ?? [];
  return blocks.slice(0, 10).map((block) => {
    const href = block.match(/href="(https:\/\/[^"]+\/product\/[^"]+)"/)?.[1] ?? null;
    const title = block.match(/title="([^"]+)"/)?.[1] ?? "Produit";
    const imageMatch = block.match(/(?:https?:)?\/\/image\.made-in-china\.com\/[^"']+\.(?:webp|jpg|jpeg)/i);
    const price = block.match(/US\$[\d.,]+(?:-[\d.,]+)?/)?.[0] ?? null;
    return {
      title,
      price,
      href,
      image: imageMatch ? absoluteImage(imageMatch[0]) : null,
      similar: null,
    };
  });
}

function roleOf(line: string): FactoryRole | null {
  const manufacturer = /manufacturer/i.test(line);
  const trading = /trading company/i.test(line);
  if (manufacturer && trading) return "fabricant-et-trading";
  if (trading) return "trading";
  if (manufacturer) return "fabricant";
  return null;
}

export function companyUrlOf(html: string): string | null {
  const match = html.match(/href="(https:\/\/[^"]+\/company-[^"]+\.html)"/i);
  return match?.[1] ?? null;
}

export function cityOf(html: string): string | null {
  for (const line of linesOf(html)) {
    const match = line.match(/,\s*([^,]{2,40}),\s*([^,]{2,40}),\s*China$/i);
    if (!match) continue;
    const city = match[1].trim();
    const province = match[2].trim();
    if (!city || city.toLowerCase() === province.toLowerCase() || /province/i.test(city)) continue;
    return city;
  }
  return null;
}

function factoryCard(lines: string[]): FactoryCard {
  const card: FactoryCard = { ...EMPTY_FACTORY };
  for (const line of lines) {
    const role = roleOf(line);
    if (role) card.role = role;
    const place = line.match(/^(.+),\s*China$/i);
    if (place) card.place = place[1].trim();
    const member = line.match(/^(diamond|gold)\s+member$/i);
    if (member) card.member = member[1][0].toUpperCase() + member[1].slice(1).toLowerCase();
    const since = line.match(/^since\s+(\d{4})$/i);
    if (since) card.memberSince = since[1];
    if (/^\d\.\d$/.test(line)) card.rating = line;
    if (/audited|third-party/i.test(line)) card.audited = true;
  }
  return card;
}

function factoryNotes(lines: string[]): { traits: string[]; laterNotes: string[]; factory: FactoryCard } {
  const start = lines.findIndex((line) => line.includes("Co., Ltd.") || line.includes("Co.,Ltd"));
  if (start < 0) return { traits: [], laterNotes: [], factory: EMPTY_FACTORY };
  const stop = lines.indexOf("Find similar items", start);
  const slice = lines.slice(start, stop > start ? stop : start + 24);
  const noise = /virtual tour|review now|^rating$|^sign in$|on-site scanning|precise digital|angle unlimited|strength labels/i;
  const later = /deliver|30 days|experienced team|foreign trading|repeat buyers|50% of buyers|quality assurance/i;
  const traits: string[] = [];
  const laterNotes: string[] = [];
  for (const line of slice) {
    if (line.length > 180 || noise.test(line)) continue;
    if (later.test(line)) laterNotes.push(line);
    else traits.push(line);
  }
  return { traits, laterNotes, factory: factoryCard(traits) };
}

function cleanTitle(title: string | null, source: "alibaba" | "dhgate"): string | null {
  if (!title) return null;
  if (source === "alibaba") return title.replace(/\s+-\s+Buy Product on Alibaba\.com.*$/i, "").trim() || null;
  return title.replace(/\s+From\s+.+,\s*.+\|\s*DHgate.*$/i, "").replace(/\s*\|\s*DHgate\.Com$/i, "").trim() || null;
}

function priceOf(blob: string, source: "alibaba" | "dhgate"): string | null {
  if (source === "dhgate") {
    const match = blob.match(/US\s*\$\s*[\d.,]+\s*(?:-\s*[\d.,]+)?/);
    return match ? match[0].replace(/\s+/g, " ").trim() : null;
  }
  const money = blob.match(/(?:US\s*)?(\$|€)\s*([\d.,]+)(?:\s*-\s*[$€]?\s*([\d.,]+))?/);
  if (!money) return null;
  return money[3] ? `${money[1]}${money[2]} - ${money[1]}${money[3]}` : `${money[1]}${money[2]}`;
}

function rangeTextOf(html: string): string | null {
  return (
    html.match(/"priceRangeText":"([^"]+)"/)?.[1] ??
    html.match(/data-testid="pc-purchase-current-price">([^<]+)</)?.[1]?.trim() ??
    null
  );
}

function moqOf(html: string, blob: string): string | null {
  const minimum = blob.match(/Minimum order quantity:\s*(\d[\d,]*)\s*([A-Za-z]+)/i);
  if (minimum?.[1] && minimum[2]) return `${minimum[1]} ${minimum[2]}`;
  const min = blob.match(/Min\.?\s*Order:\s*(\d+)\s*([A-Za-z]+)/i) ?? html.match(/Min\.?\s*Order:\s*(\d+)\s*([A-Za-z]+)/i);
  if (min?.[1] && min[2]) return `${min[1]} ${min[2]}`;
  const json = html.match(/minOrder\\":\\"(\d+)/i) ?? html.match(/"minOrder"\s*:\s*"(\d+)"/i);
  if (json?.[1]) return `${json[1]} pieces`;
  const band = blob.match(/(?:(?:US\s*)?\$|€)\s*[\d.,]+\s+(\d+)\s*(?:-\s*\d+)?\s*(pieces|piece|sets|set)/i);
  if (band?.[1] && band[2]) return `${band[1]} ${band[2]}`;
  return null;
}

function imagesOf(html: string, source: "alibaba" | "dhgate"): string[] {
  const byKey = new Map<string, string>();
  if (source === "alibaba") {
    const found = html.match(/(?:https?:)?\/\/s\.alicdn\.com\/@sc0\d\/kf\/H[0-9a-f]{32}[A-Za-z]\.(?:jpg|jpeg|png|webp)_(\d{3,4})x\d{3,4}[^"'\s>]*/gi) ?? [];
    for (const raw of found) {
      const key = raw.match(/\/kf\/(H[0-9a-f]{32}[A-Za-z])/)?.[1];
      if (!key || byKey.has(key)) continue;
      byKey.set(key, absoluteImage(raw).replace(/_\d{3,4}x\d{3,4}[^./]*(\.\w+)?$/, "_960x960q80.jpg"));
    }
    return [...byKey.values()].slice(0, 10);
  }
  const found = html.match(/(?:https?:)?\/\/[^"'\s>]*dhresource\.com\/[^"'\s>]*\/albu\/[^"'\s>]+\.(?:jpg|jpeg|png|webp)/gi) ?? [];
  const folderOf = (raw: string) => raw.replace(/^.*\/albu\//, "").split("/").slice(0, -1).join("/");
  const folder = found[0] ? folderOf(found[0]) : null;
  const own = found.filter((raw) => folderOf(raw) === folder);
  for (const raw of own.length > 1 ? own : found) {
    const key = raw.split("/").at(-1);
    if (!key || byKey.has(key)) continue;
    byKey.set(key, absoluteImage(raw).replace(/\/\d+x\d+\//, "/600x600/"));
  }
  return [...byKey.values()].slice(0, 10);
}

function capture(blob: string, pattern: RegExp): string | null {
  const match = blob.match(pattern);
  const value = match?.[1]?.replace(/\s+/g, " ").trim();
  return value || null;
}

function factoryOf(html: string, blob: string): FactoryCard {
  const card: FactoryCard = { ...EMPTY_FACTORY };
  const cityYears = blob.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),\s*CN\s+(\d+)\s*yrs\s+([A-Za-z][A-Za-z ]{2,40})/);
  if (cityYears) {
    card.city = cityYears[1].trim();
    card.member = "Fournisseur";
    card.memberSince = `${cityYears[2]} ans`;
    const roleText = cityYears[3] ?? "";
    const manufacturer = /manufacturer/i.test(roleText);
    const trading = /trading/i.test(roleText);
    if (manufacturer && trading) card.role = "fabricant-et-trading";
    else if (trading) card.role = "trading";
    else if (manufacturer) card.role = "fabricant";
  }
  const established = html.match(/Year Established\\?":\\?"(\d{4})/)?.[1];
  if (!card.memberSince && established) {
    card.member = "Fournisseur";
    card.memberSince = established;
  }
  const origin = capture(blob, /place of origin\s+([^,]{2,40}),\s*China/i);
  if (origin && origin.toLowerCase() !== card.city?.toLowerCase()) card.place = origin;
  const rating = blob.match(/(\d+(?:\.\d+)?)\s*\/\s*5/);
  if (rating?.[1]) card.rating = rating[1];
  if (/assessed supplier|verified supplier|audited by/i.test(blob)) card.audited = true;
  return card;
}

const ATTRIBUTE_GROUPS: { name: string; match: RegExp }[] = [
  { name: "Matière", match: /material|top|frame|leg|panel|color/i },
  { name: "Dimensions", match: /size|dimension|height|load|weight|width|length|lifting|speed|motor|stage/i },
  { name: "Conformité", match: /certif|warranty|origin|brand|model|standard/i },
];

function capitalized(label: string): string {
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function alibabaAttributes(html: string): SheetField[] {
  const list = html.match(/"productBasicProperties":(\[[^\]]*\])/)?.[1];
  if (!list) return [];
  try {
    const seen = new Set<string>();
    return (JSON.parse(list) as { attrName?: string; attrValue?: string }[]).flatMap((item) => {
      const label = item.attrName?.trim();
      const value = item.attrValue?.trim();
      if (!label || !value || seen.has(label.toLowerCase())) return [];
      seen.add(label.toLowerCase());
      return [{ label: capitalized(label), value }];
    });
  } catch {
    return [];
  }
}

function attributeGroups(fields: SheetField[]): { name: string; labels: string[] }[] {
  const groups = new Map<string, string[]>();
  for (const field of fields) {
    const name = ATTRIBUTE_GROUPS.find((group) => group.match.test(field.label))?.name ?? "Produit";
    groups.set(name, [...(groups.get(name) ?? []), field.label]);
  }
  return ["Produit", ...ATTRIBUTE_GROUPS.map((group) => group.name)]
    .filter((name) => groups.has(name))
    .map((name) => ({ name, labels: groups.get(name) ?? [] }));
}

function readMarketplace(html: string, url: string, source: "alibaba" | "dhgate"): ProductSheet {
  const lines = linesOf(html);
  const blob = lines.join(" ");
  const supplier = lines.find((line) => /Co\.,?\s*Ltd/i.test(line)) ?? null;
  const material = capture(blob, /Material\s*:\s*([A-Za-z]+)/i);
  const tiers = tiersOf(blob);
  const unitSize = source === "alibaba" ? html.match(/"unitSize":"([\d.]+[Xx*][\d.]+[Xx*][\d.]+)"/)?.[1] : undefined;
  const unitWeight = source === "alibaba" ? html.match(/"unitWeight":"([\d.]+)"/)?.[1] : undefined;
  const attributes = source === "alibaba" ? alibabaAttributes(html) : [];
  const fields: SheetField[] = [
    { label: "Prix", value: tierRange(tiers) ?? (source === "alibaba" ? rangeTextOf(html) : null) ?? priceOf(blob, source) },
    { label: "MOQ", value: moqOf(html, blob) },
    {
      label: "Package Size",
      value: capture(blob, /Single package size\s+([\d.Xx×*\s]+cm)/i) ?? (unitSize ? `${unitSize} cm` : null),
    },
    {
      label: "Package Gross Weight",
      value: capture(blob, /Single gross weight\s+([\d.]+\s*kg)/i) ?? (unitWeight ? `${unitWeight} kg` : null),
    },
    {
      label: "Model NO.",
      value:
        capture(blob, /model number\s+(\S+)/i) ??
        capture(blob, /Item Code:\s*(\d+)/i) ??
        html.match(/Item Code:[\s\S]{0,160}?(\d{5,})/i)?.[1] ??
        null,
    },
  ];
  if (material && attributes.length === 0) fields.push({ label: "Matière", value: material });
  fields.push(...attributes);
  const groups =
    attributes.length > 0 ? attributeGroups(attributes) : material ? [{ name: "Matière", labels: ["Matière"] }] : [];
  return {
    source,
    url,
    title: cleanTitle(titleOf(html), source),
    supplier,
    images: imagesOf(html, source),
    description: null,
    groups,
    fields,
    factory: factoryOf(html, blob),
    traits: [],
    laterNotes: [],
    related: [],
    offers: [],
    probes: [],
    tiers,
  };
}

export function readSheet(html: string, url: string): ProductSheet {
  const source = marketOf(url);
  if (source === "alibaba" || source === "dhgate") return readMarketplace(html, url, source);
  const madeInChina = source === "made-in-china";
  const lines = linesOf(html);
  const priceLine = lines.find((line) => line.startsWith("US$"));
  const moq = priceLine ? lines[lines.indexOf(priceLine) + 1] : null;

  const fields: SheetField[] = [
    { label: "Prix", value: priceLine ?? null },
    { label: "MOQ", value: moq && !moq.startsWith("US$") ? moq : null },
    ...LABELS.map((label) => ({ label: label.replace(/:$/, ""), value: after(lines, label) })),
  ];

  const supplier =
    lines.find((line) => line.includes("Co., Ltd.") || line.includes("Co.,Ltd")) ?? null;

  const factory = madeInChina ? factoryNotes(lines) : { traits: [], laterNotes: [], factory: EMPTY_FACTORY };
  const priceAt = priceLine ? lines.indexOf(priceLine) : -1;
  const tiers = priceAt >= 0 ? tiersOf(lines.slice(priceAt, priceAt + 16).join(" ")) : [];

  return {
    source: marketOf(url),
    url,
    title: titleOf(html),
    supplier,
    images: madeInChina ? galleryOf(html) : [],
    description: null,
    groups: [],
    fields: madeInChina ? fields : [{ label: "Prix", value: priceLine ?? null }],
    factory: factory.factory,
    traits: factory.traits,
    laterNotes: factory.laterNotes,
    related: madeInChina ? relatedOf(html) : [],
    offers: [],
    probes: [],
    tiers,
  };
}
