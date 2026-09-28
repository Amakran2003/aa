"use server";

import { productLink, type ProductSheet } from "@aa/contracts";
import {
  cityOf,
  companyUrlOf,
  demoSheet,
  enqueueEnrich,
  marketsLanded,
  pageBlocked,
  rankOffers,
  readSheet,
  recall,
  remember,
  sampleOf,
} from "@aa/core";
import { readRenderedPage } from "@/domains/fiche/browser";

const MAX_BYTES = 2_000_000;

function assertPublicHttps(raw: string): URL {
  const url = new URL(raw);
  if (url.protocol !== "https:") {
    throw new Error("Le lien doit commencer par https://.");
  }
  const host = url.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".local") ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host.startsWith("10.") ||
    host.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
  ) {
    throw new Error("Ce lien n'est pas une fiche publique.");
  }
  return url;
}

export async function analyzeProduct(
  raw: string,
  options: { search?: boolean } = {},
): Promise<{ error?: string; sheet?: ProductSheet }> {
  const search = options.search !== false;
  const parsed = productLink.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Lien invalide." };
  }

  const prepared = demoSheet(parsed.data);
  if (prepared) return { sheet: prepared };

  let url: URL;
  try {
    url = assertPublicHttps(parsed.data);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Lien refusé." };
  }

  try {
    const foreign = /alibaba\.com$|dhgate\.com$/i.test(url.hostname.replace(/^www\./, ""));
    const alibaba = /(^|\.)alibaba\.com$/i.test(url.hostname);
    const known = await recall(url.toString());
    const foreignReady =
      known?.fields.some((field) => field.label === "Prix" && field.value) &&
      Boolean(known?.factory?.memberSince) &&
      known?.tiers !== undefined &&
      (!alibaba || known?.sample !== undefined);
    if (known && foreign && foreignReady) return { sheet: rankOffers(known) };
    const searched = known && !foreign && marketsLanded(known) ? known : null;
    if (searched && searched.tiers !== undefined) {
      if (search && searched.rates === undefined) await enqueueEnrich(searched.url);
      return { sheet: rankOffers(searched) };
    }
    if (known && !foreign && !search) return { sheet: rankOffers(known) };
    if (known && !foreign && (known.probes ?? []).length > 0 && known.tiers !== undefined) {
      await enqueueEnrich(known.url);
      return { sheet: rankOffers(known) };
    }

    let html = "";
    let logistics: unknown = null;
    if (foreign) {
      const rendered = await readRenderedPage(url.toString());
      if (!rendered) return { error: "La fiche n'a pas pu être ouverte." };
      if (pageBlocked(rendered.html, url.hostname)) {
        return { error: "Le site demande une vérification. Réessaie dans un moment." };
      }
      html = rendered.html;
      logistics = rendered.logistics;
    } else {
      const response = await fetch(url, {
        headers: { "user-agent": "Mozilla/5.0" },
        redirect: "follow",
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) {
        return { error: `La page a répondu ${response.status}.` };
      }
      html = await response.text();
      if (pageBlocked(html, url.hostname)) {
        return { error: "Ce site n'a pas envoyé la fiche en HTTP." };
      }
    }
    if (html.length > MAX_BYTES * 3) {
      return { error: "La page est trop lourde pour cette lecture." };
    }
    const page = readSheet(html, url.toString());
    const read = alibaba ? { ...page, sample: sampleOf(html, logistics) } : page;
    if (searched) {
      const refreshed = rankOffers({
        ...searched,
        images: read.images.length > 0 ? read.images : searched.images,
        tiers: read.tiers ?? [],
      });
      await remember(refreshed, html);
      if (search && refreshed.rates === undefined) await enqueueEnrich(refreshed.url);
      return { sheet: refreshed };
    }
    const sheet = foreign
      ? read
      : await Promise.race([
          withCity(read, html),
          new Promise<ProductSheet>((resolve) => {
            setTimeout(() => resolve(read), 2500);
          }),
        ]);
    await remember(sheet, html);
    if (search && !foreign) await enqueueEnrich(sheet.url);
    return { sheet: rankOffers(sheet) };
  } catch {
    return { error: "La page n'a pas pu être lue." };
  }
}

async function withCity(sheet: ProductSheet, html: string): Promise<ProductSheet> {
  const raw = companyUrlOf(html);
  if (!raw) return sheet;
  try {
    const company = assertPublicHttps(raw);
    if (!company.hostname.endsWith("made-in-china.com")) return sheet;
    const response = await fetch(company, {
      headers: { "user-agent": "Mozilla/5.0" },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) return sheet;
    const page = await response.text();
    if (page.length > MAX_BYTES) return sheet;
    const city = cityOf(page);
    if (!city) return sheet;
    return { ...sheet, factory: { ...sheet.factory, city } };
  } catch {
    return sheet;
  }
}

export async function recallProduct(url: string): Promise<ProductSheet | null> {
  const sheet = await recall(url);
  return sheet ? rankOffers(sheet) : null;
}
