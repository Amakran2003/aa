import type { BestOffer, Candidate, Offer, ProductSheet } from "@aa/contracts";
import { convert, parseMoney } from "../money.ts";

const PRESELECTED = 3;
const MIN_YEARS = 2;

export function frameOnly(title: string): boolean {
  return /\bframe\b/i.test(title) && !/\bwith\s+(?:desk\s*)?top\b|table\s?top|desktop board/i.test(title);
}

export function yearsOf(memberSince: string | null, now = new Date()): number | null {
  if (!memberSince) return null;
  const year = memberSince.match(/^(\d{4})$/)?.[1];
  if (year) return Math.max(0, now.getFullYear() - Number(year));
  const count = memberSince.match(/(\d+)\s*ans?\b/)?.[1];
  return count ? Number(count) : null;
}

function asBest(offer: Offer): BestOffer | null {
  const money = parseMoney(offer.price);
  if (!money) return null;
  return {
    href: offer.href,
    title: offer.title,
    image: offer.image,
    price: offer.price as string,
    low: money.low,
    high: money.high,
    currency: money.currency,
    moq: offer.moq,
    supplier: offer.supplier,
    source: offer.source,
    years: offer.years ?? null,
    verified: offer.verified,
    assurance: offer.assurance,
    rating: offer.rating,
    response: offer.response,
    employees: offer.employees,
    contact: offer.contact,
  };
}

function originOffer(sheet: ProductSheet): BestOffer | null {
  const price = sheet.fields.find((field) => field.label === "Prix")?.value ?? null;
  const money = parseMoney(price);
  if (!price || !money || !sheet.title) return null;
  return {
    href: sheet.url,
    title: sheet.title,
    image: sheet.images[0] ?? null,
    price,
    low: money.low,
    high: money.high,
    currency: money.currency,
    moq: sheet.fields.find((field) => field.label === "MOQ")?.value ?? null,
    supplier: sheet.supplier,
    source: sheet.source,
    years: yearsOf(sheet.factory.memberSince),
    verified: sheet.factory.audited,
  };
}

function reasonOf(years: number | null): string | null {
  if (years === null) return "Ancienneté absente";
  if (years < MIN_YEARS) return `${years} an${years > 1 ? "s" : ""} sur le site, trop récent`;
  return null;
}

function candidate(offer: BestOffer): Candidate {
  const reason = reasonOf(offer.years);
  return { offer, passes: reason === null, reason, frameOnly: frameOnly(offer.title), preselected: false };
}

export function shortlist(sheet: ProductSheet): Candidate[] {
  const euros = (offer: BestOffer) => convert(offer.low, offer.currency, "EUR", sheet.rates) ?? offer.low;
  const seen = new Set<string>();
  const offers = (sheet.offers ?? [])
    .filter((offer) => offer.close && offer.href !== sheet.url)
    .map(asBest)
    .filter((offer): offer is BestOffer => offer !== null)
    .sort((a, b) => euros(a) - euros(b))
    .filter((offer) => {
      const key = offer.supplier?.trim().toLowerCase() || offer.href;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map(candidate);

  const alibaba = offers.filter((item) => item.offer.source === "alibaba" && item.passes);
  const others = offers.filter((item) => item.offer.source !== "alibaba" && item.passes);
  const weaker = offers.filter((item) => !item.passes);
  const origin = originOffer(sheet);
  const start = origin && !seen.has(origin.supplier?.trim().toLowerCase() ?? "") ? [candidate(origin)] : [];

  const ordered = [...alibaba, ...start, ...others, ...weaker];
  const firsts = alibaba.length > 0 ? alibaba : ordered.filter((item) => item.passes);
  const chosen = new Set(firsts.slice(0, PRESELECTED).map((item) => item.offer.href));
  return ordered.map((item) => ({ ...item, preselected: chosen.has(item.offer.href) }));
}
