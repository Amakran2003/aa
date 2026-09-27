"use server";

import { productLink, type ProductSheet } from "@aa/contracts";
import { cityOf, companyUrlOf, enqueueEnrich, pageBlocked, readSheet, recall, remember } from "@aa/core";

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

export async function analyzeProduct(raw: string): Promise<{ error?: string; sheet?: ProductSheet }> {
  const parsed = productLink.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Lien invalide." };
  }

  let url: URL;
  try {
    url = assertPublicHttps(parsed.data);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Lien refusé." };
  }

  try {
    const response = await fetch(url, {
      headers: { "user-agent": "Mozilla/5.0" },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
      return { error: `La page a répondu ${response.status}.` };
    }
    const html = await response.text();
    if (html.length > MAX_BYTES) {
      return { error: "La page est trop lourde pour cette lecture." };
    }
    if (pageBlocked(html, url.hostname)) {
      return { error: "Ce site n'a pas envoyé la fiche en HTTP." };
    }
    const known = await recall(url.toString());
    const stale =
      (known?.probes?.length ?? 0) < 3 ||
      (known?.offers.some((offer) => typeof offer.close !== "boolean") ?? false);
    if (known && !stale) return { sheet: known };
    const sheet = await withCity(readSheet(html, url.toString()), html);
    await remember(sheet, html);
    await enqueueEnrich(sheet.url);
    return { sheet };
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
  return recall(url);
}
