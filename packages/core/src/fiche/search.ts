import type { Market, Offer, ProductSheet } from "@aa/contracts";
import { SEARCH_VERSION } from "@aa/contracts";

export function marketOf(url: string): Market {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.endsWith("made-in-china.com")) return "made-in-china";
    if (host.endsWith("alibaba.com") || host.endsWith("alibaba.com.cn")) return "alibaba";
    if (host.endsWith("dhgate.com")) return "dhgate";
  } catch {
    return "autre";
  }
  return "autre";
}

export function searchQueries(sheet: ProductSheet): string[] {
  const blob = `${sheet.title ?? ""} ${sheet.fields.map((field) => field.value ?? "").join(" ")}`;
  if (/desk|table|bureau/i.test(blob) && /motor|height|electric/i.test(blob)) {
    if (/four|4\s*motor/i.test(blob)) return ["four motor electric height adjustable desk"];
    return ["dual motor electric height adjustable desk"];
  }
  const title = (sheet.title ?? "")
    .replace(/\b(china|factory|wholesale|co\.?,?\s*ltd\.?)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (title.length < 8) return [];
  return [title.slice(0, 80)];
}

export function searchUrl(query: string): string {
  const slug = query.trim().replace(/\s+/g, "_");
  return `https://www.made-in-china.com/products-search/hot-china-products/${slug}.html`;
}

const SEARCH_MARKETS = ["made-in-china", "alibaba", "dhgate"] as const;
const ALIBABA_PAGES = 3;

export function searchTargets(query: string): { source: Market; url: string }[] {
  const q = encodeURIComponent(query.trim());
  return [
    { source: "made-in-china", url: searchUrl(query) },
    ...Array.from({ length: ALIBABA_PAGES }, (_, index) => ({
      source: "alibaba" as const,
      url: alibabaSearchUrl(query, index + 1),
    })),
    { source: "dhgate", url: `https://www.dhgate.com/wholesale/search.do?searchkey=${q}` },
  ];
}

export function alibabaSearchUrl(query: string, page = 1): string {
  const q = encodeURIComponent(query.trim());
  return `https://open-s.alibaba.com/openservice/galleryProductOfferResultViewService?appName=magellan&appKey=a5m1ismomeptugvfmkkjnwwqnwyrhpb1&searchText=${q}&page=${page}`;
}

export function searchMarkets(): Market[] {
  return [...SEARCH_MARKETS];
}

export function marketsLanded(sheet: ProductSheet): boolean {
  if (sheet.searchVersion !== SEARCH_VERSION) return false;
  return (["alibaba", "dhgate"] as const).every((source) => {
    const probe = (sheet.probes ?? []).find((item) => item.source === source);
    return probe?.state === "lu" || probe?.state === "vide";
  });
}

export function pageBlocked(html: string, host: string): boolean {
  const name = host.toLowerCase();
  if (name.endsWith("dhgate.com")) return html.length < 5000 || /access denied/i.test(html);
  if (name.endsWith("alibaba.com")) {
    if (/<title>[^<]*captcha/i.test(html) || /slide to verify|drag the slider/i.test(html)) return true;
    return html.length < 1000 || (/punish|captcha/i.test(html) && !/product-title|product-detail/i.test(html));
  }
  return false;
}

function isDesk(text: string): boolean {
  return /desk|table|bureau/i.test(text) && /motor|height|electric|lifting|standing/i.test(text);
}

function deskClose(title: string): boolean {
  const multi = /dual[\s-]*motor|double[\s-]*motor|two[\s-]*motor|twin[\s-]*motor|four[\s-]*motor|\b[24]\s*motors?\b/i.test(title);
  if (!multi) return false;
  const loads = [...title.matchAll(/(\d{2,3})\s?kg/gi)].map((match) => Number(match[1]));
  return loads.length === 0 || Math.max(...loads) >= 100;
}

function wordsOf(text: string): string[] {
  const alias: Record<string, string> = { pyjama: "pajama", pajama: "pajama" };
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .map((word) => word.replace(/s$/, ""))
    .map((word) => alias[word] ?? word)
    .filter((word) => word.length >= 4);
}

function sameKind(title: string, reference: string): boolean {
  const needles = wordsOf(reference);
  if (needles.length === 0) return true;
  const hay = wordsOf(title);
  const hits = needles.filter((word) => hay.some((item) => item === word || item.includes(word) || word.includes(item)));
  return hits.some((word) => word.length >= 5) || hits.length >= 2;
}

export function isCloseMatch(title: string, reference = ""): boolean {
  const basis = reference || title;
  if (isDesk(basis)) return deskClose(title);
  if (!reference) return true;
  return sameKind(title, reference);
}

function absoluteImage(raw: string): string {
  if (raw.startsWith("http")) return raw;
  return `https:${raw.startsWith("//") ? raw : `//${raw}`}`;
}

function cardImage(before: string, title: string): string | null {
  const images = [...before.matchAll(/data-original="([^"]*image\.made-in-china\.com[^"]+)"/g)]
    .map((match) => ({ url: match[1], at: match.index ?? 0 }))
    .filter((image) => !/corporation|co-ltd|logo/i.test(image.url));
  const words = title
    .toLowerCase()
    .replace(/&amp;/g, " ")
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 1)
    .slice(0, 3);
  const named = images.filter((image) => {
    const name = image.url.split("/").at(-1)?.toLowerCase() ?? "";
    return words.length > 0 && words.every((word) => name.includes(word));
  });
  const near = images.filter((image) => before.length - image.at < 4000);
  return named.at(-1)?.url ?? near.at(-1)?.url ?? null;
}

export function offersOf(html: string, currentUrl: string, reference = ""): Offer[] {
  const offers: Offer[] = [];
  const seen = new Set<string>();
  const pattern = /<a title="([^"]+)"[^>]*href="(https:\/\/[^"]+\/product\/[^"]+)"/g;
  for (const match of html.matchAll(pattern)) {
    const title = match[1].replace(/\s+/g, " ").trim();
    const href = match[2];
    if (!title || seen.has(href) || href === currentUrl) continue;
    const after = html.slice(match.index ?? 0, (match.index ?? 0) + 12000);
    const before = html.slice(Math.max(0, (match.index ?? 0) - 8000), match.index ?? 0);
    const text = after.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ");
    const price = text.match(/US\$\s*[\d,.]+(?:\s*-\s*[\d,.]+)?/)?.[0]?.replace(/\s+/g, "") ?? null;
    const moq = text.match(/([\d,]+\s+[A-Za-z]+)\s*\(MOQ\)/)?.[1] ?? null;
    const supplier =
      after
        .match(/class="compnay-name"[^>]*>\s*<span[^>]*>([^<]+)/)?.[1]
        ?.replace(/&amp;/g, "&")
        .replace(/\s+/g, " ")
        .trim() ?? null;
    const image = cardImage(before, title);
    seen.add(href);
    offers.push({
      title,
      price,
      moq,
      href,
      image: image ? absoluteImage(image) : null,
      supplier,
      source: "made-in-china",
      close: isCloseMatch(title, reference),
    });
    if (offers.length >= 24) break;
  }
  return offers;
}

export function offersFromMarket(source: Market, html: string, currentUrl: string, reference = ""): Offer[] {
  if (source === "made-in-china") return offersOf(html, currentUrl, reference);
  if (source === "alibaba") {
    try {
      return offersFromAlibaba(JSON.parse(html) as unknown, currentUrl, reference);
    } catch {
      return [];
    }
  }
  if (source === "dhgate") return offersFromDhgate(html, currentUrl, reference);
  return [];
}

function httpsUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const value = raw.trim();
  if (value.startsWith("https://") || value.startsWith("http://")) return value;
  if (value.startsWith("//")) return `https:${value}`;
  return null;
}

function plain(value: string): string {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function productHref(raw: string): string {
  const absolute = httpsUrl(raw.replace(/&amp;/g, "&"));
  if (!absolute) return raw;
  try {
    const url = new URL(absolute);
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return absolute.split("?")[0] ?? absolute;
  }
}

type AlibabaOffer = {
  id?: number | string;
  information?: { puretitle?: string; title?: string; productUrl?: string };
  image?: { mainImage?: string; productImage?: string };
  tradePrice?: { price?: string; minOrder?: string };
  company?: { tradeAssurance?: number | boolean; record?: { responseRate?: string } };
  reviews?: { supplierService?: string | number };
  supplier?: {
    supplierName?: string;
    supplierYear?: string | number;
    assessedSupplier?: boolean;
    verifiedSupplierPro?: boolean;
    employeesTotals?: string | number;
    contactSupplier?: string;
  };
};

function positive(value: unknown): number | null {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

export function offersFromAlibaba(payload: unknown, currentUrl = "", reference = ""): Offer[] {
  const list = (payload as { data?: { offerList?: AlibabaOffer[] } } | null)?.data?.offerList;
  if (!Array.isArray(list)) return [];
  const offers: Offer[] = [];
  const seen = new Set<string>();
  for (const item of list) {
    const title = plain(item.information?.puretitle || item.information?.title || "");
    const href = productHref(item.information?.productUrl || (item.id ? `https://www.alibaba.com/product-detail/_${item.id}.html` : ""));
    if (!title || !href.startsWith("http") || seen.has(href) || href === currentUrl) continue;
    seen.add(href);
    offers.push({
      title: title.slice(0, 180),
      price: item.tradePrice?.price?.trim() || null,
      moq: item.tradePrice?.minOrder?.trim() || null,
      href,
      image: httpsUrl(item.image?.mainImage || item.image?.productImage),
      supplier: item.supplier?.supplierName?.trim() || null,
      source: "alibaba",
      close: isCloseMatch(title, reference),
      years: Number(item.supplier?.supplierYear) || null,
      verified: Boolean(item.supplier?.assessedSupplier || item.supplier?.verifiedSupplierPro),
      assurance: Boolean(item.company?.tradeAssurance),
      rating: positive(item.reviews?.supplierService),
      response: item.company?.record?.responseRate?.trim() || null,
      employees: positive(item.supplier?.employeesTotals),
      contact: httpsUrl(item.supplier?.contactSupplier),
    });
  }
  return offers;
}

function blockField(block: string, className: string): string | null {
  const match = block.match(new RegExp(`class="[^"]*\\b${className}\\b[^"]*"[^>]*>([\\s\\S]*?)</(?:div|a|span|p)>`, "i"));
  if (!match) return null;
  const text = plain(match[1]);
  return text || null;
}

function dhgateOrders(html: string): Map<string, string> {
  const orders = new Map<string, string>();
  for (const match of html.matchAll(/"minOrder":"([^"]+)"/g)) {
    const value = match[1]?.replace(/\\u0026/g, "&").trim();
    if (!value) continue;
    const after = html.slice(match.index ?? 0, (match.index ?? 0) + 320);
    const code = after.match(/"itemcode":"(\d+)"/)?.[1];
    if (code) orders.set(code, value);
  }
  return orders;
}

export function offersFromDhgate(html: string, currentUrl = "", reference = ""): Offer[] {
  const orders = dhgateOrders(html);
  const marks = [...html.matchAll(/<li\b[^>]*\bitemcode="(\d+)"/gi)];
  const offers: Offer[] = [];
  const seen = new Set<string>();
  for (let index = 0; index < marks.length; index += 1) {
    const start = marks[index]?.index ?? 0;
    const end = marks[index + 1]?.index ?? start + 14000;
    const block = html.slice(start, end);
    const code = marks[index]?.[1] ?? "";
    const rawHref = block.match(/href="(https?:\/\/www\.dhgate\.com\/product\/[^"]+|\/\/www\.dhgate\.com\/product\/[^"]+)"/i)?.[1];
    const href = rawHref ? productHref(rawHref) : "";
    const title = blockField(block, "gallery-pro-name");
    if (!title || !href.startsWith("http") || seen.has(href) || href === currentUrl) continue;
    const price = blockField(block, "current-price");
    const supplier = blockField(block, "store-name");
    const image = httpsUrl(block.match(/<img[^>]+src="([^"]*dhresource\.com[^"]+)"/i)?.[1] ?? null);
    if (!image) continue;
    seen.add(href);
    offers.push({
      title: title.slice(0, 180),
      price,
      moq: orders.get(code) ?? null,
      href,
      image,
      supplier,
      source: "dhgate",
      close: isCloseMatch(title, reference),
    });
    if (offers.length >= 12) break;
  }
  return offers;
}
