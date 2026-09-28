import type { BestOffer, Currency, Offer, ProductSheet } from "@aa/contracts";
import { convert, parseMoney } from "../money.ts";
import { countOf } from "./price.ts";
import { isCloseMatch } from "./search.ts";

const RANKED = 10;

export function rankOffers(sheet: ProductSheet): ProductSheet {
  const reference = sheet.title ?? "";
  const offers = (sheet.offers ?? []).map((offer) => ({
    ...offer,
    close: reference ? isCloseMatch(offer.title, reference) : offer.close,
    years: offer.years ?? null,
  }));
  const related = (sheet.related ?? []).map((item) => ({
    ...item,
    similar: item.similar ?? isCloseMatch(item.title, reference),
  }));
  const base: Currency = sheet.rates ? "EUR" : "USD";
  const candidates: Offer[] = [
    ...offers,
    ...related
      .filter((item) => item.href && item.similar)
      .map((item) => ({
        title: item.title,
        price: item.price,
        moq: null,
        href: item.href as string,
        image: item.image,
        supplier: sheet.supplier,
        source: sheet.source,
        close: true,
        years: null,
      })),
  ];
  const seen = new Set<string>([sheet.url]);
  const scored: { offer: BestOffer; value: number }[] = [];
  for (const offer of candidates) {
    if (!offer.close || !offer.price || seen.has(offer.href)) continue;
    const money = parseMoney(offer.price);
    if (!money) continue;
    const value = convert(money.low, money.currency, base, sheet.rates);
    if (value === null) continue;
    seen.add(offer.href);
    scored.push({
      value,
      offer: {
        href: offer.href,
        title: offer.title,
        image: offer.image,
        price: offer.price,
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
      },
    });
  }
  scored.sort(
    (a, b) =>
      a.value - b.value ||
      (countOf(a.offer.moq) ?? Number.MAX_SAFE_INTEGER) - (countOf(b.offer.moq) ?? Number.MAX_SAFE_INTEGER) ||
      (b.offer.years ?? -1) - (a.offer.years ?? -1),
  );
  return { ...sheet, offers, related, best: scored.slice(0, RANKED).map((row) => row.offer) };
}
