import type { FactoryCard, FactoryRole, ProductSheet, RelatedProduct, SheetField } from "@aa/contracts";
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
  const urls = found.map(absoluteImage);
  return [...new Set(urls.filter((url) => !/BLOCK-COVER|transparent|mp4|Co-Ltd|company/i.test(url)))].slice(0, 6);
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

export function readSheet(html: string, url: string): ProductSheet {
  const madeInChina = url.includes("made-in-china.com");
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
  };
}
