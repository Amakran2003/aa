import type { Market, Offer, ProductSheet } from "@aa/contracts";

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
    const queries = ["dual motor electric height adjustable desk"];
    if (/four|4\s*motor|double/i.test(blob)) queries.unshift("four motor electric height adjustable desk");
    return queries;
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

export function searchTargets(query: string): { source: Market; url: string }[] {
  const q = encodeURIComponent(query.trim());
  return [
    { source: "made-in-china", url: searchUrl(query) },
    { source: "alibaba", url: `https://www.alibaba.com/trade/search?SearchText=${q}` },
    { source: "dhgate", url: `https://www.dhgate.com/wholesale/search.do?searchkey=${q}` },
  ];
}

export function searchMarkets(): Market[] {
  return [...SEARCH_MARKETS];
}

export function pageBlocked(html: string, host: string): boolean {
  const name = host.toLowerCase();
  if (name.endsWith("dhgate.com")) return html.length < 5000 || /access denied/i.test(html);
  if (name.endsWith("alibaba.com")) {
    return html.length < 1000 || (/punish|captcha/i.test(html) && !/product-title|product-detail/i.test(html));
  }
  return false;
}

export function isCloseMatch(title: string): boolean {
  const multi = /dual[\s-]*motor|double[\s-]*motor|two[\s-]*motor|twin[\s-]*motor|four[\s-]*motor|\b[24]\s*motors?\b/i.test(title);
  if (!multi) return false;
  const loads = [...title.matchAll(/(\d{2,3})\s?kg/gi)].map((match) => Number(match[1]));
  return loads.length === 0 || Math.max(...loads) >= 100;
}

function absoluteImage(raw: string): string {
  if (raw.startsWith("http")) return raw;
  return `https:${raw.startsWith("//") ? raw : `//${raw}`}`;
}

export function offersOf(html: string, currentUrl: string): Offer[] {
  const offers: Offer[] = [];
  const seen = new Set<string>();
  const pattern = /<a title="([^"]+)"[^>]*href="(https:\/\/[^"]+\/product\/[^"]+)"/g;
  for (const match of html.matchAll(pattern)) {
    const title = match[1].replace(/\s+/g, " ").trim();
    const href = match[2];
    if (!title || seen.has(href) || href === currentUrl) continue;
    const after = html.slice(match.index ?? 0, (match.index ?? 0) + 12000);
    const before = html.slice(Math.max(0, (match.index ?? 0) - 4000), match.index ?? 0);
    const text = after.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ");
    const price = text.match(/US\$\s*[\d,.]+(?:\s*-\s*[\d,.]+)?/)?.[0]?.replace(/\s+/g, "") ?? null;
    const moq = text.match(/([\d,]+\s+[A-Za-z]+)\s*\(MOQ\)/)?.[1] ?? null;
    const supplier =
      after
        .match(/class="compnay-name"[^>]*>\s*<span[^>]*>([^<]+)/)?.[1]
        ?.replace(/&amp;/g, "&")
        .replace(/\s+/g, " ")
        .trim() ?? null;
    const images = [...before.matchAll(/data-original="([^"]*image\.made-in-china\.com[^"]+)"/g)];
    const image = images.at(-1)?.[1] ?? null;
    seen.add(href);
    offers.push({
      title,
      price,
      moq,
      href,
      image: image && !/corporation|co-ltd|logo/i.test(image) ? absoluteImage(image) : null,
      supplier,
      source: "made-in-china",
      close: isCloseMatch(title),
    });
    if (offers.length >= 24) break;
  }
  return offers;
}

export function offersFromMarket(source: Market, html: string, currentUrl: string): Offer[] {
  if (source === "made-in-china") return offersOf(html, currentUrl);
  if (source === "alibaba") {
    return foreignOffers(html, currentUrl, "alibaba", /href="(https:\/\/www\.alibaba\.com\/product-detail\/[^"]+)"/g);
  }
  if (source === "dhgate") {
    return foreignOffers(html, currentUrl, "dhgate", /href="(https:\/\/www\.dhgate\.com\/product\/[^"]+)"/g);
  }
  return [];
}

function foreignOffers(html: string, currentUrl: string, source: Market, pattern: RegExp): Offer[] {
  const offers: Offer[] = [];
  const seen = new Set<string>();
  for (const match of html.matchAll(pattern)) {
    const href = match[1].replace(/&amp;/g, "&");
    if (!href || seen.has(href) || href === currentUrl) continue;
    const slug = decodeURIComponent(href.split("/").filter(Boolean).at(-1) ?? "")
      .replace(/\.html$/i, "")
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (slug.length < 8) continue;
    seen.add(href);
    offers.push({
      title: slug.slice(0, 140),
      price: null,
      moq: null,
      href,
      image: null,
      supplier: null,
      source,
      close: isCloseMatch(slug),
    });
    if (offers.length >= 12) break;
  }
  return offers;
}
