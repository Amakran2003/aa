"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ProductSheet } from "@aa/contracts";
import { analyzeProduct } from "@/domains/fiche/analyze";

export type SupplierDetail =
  | { state: "loading" }
  | { state: "ready"; sheet: ProductSheet }
  | { state: "error"; error: string };

const PARALLEL = 2;

export function useSupplierDetails(origin: ProductSheet | null) {
  const [details, setDetails] = useState<Record<string, SupplierDetail>>({});
  const queue = useRef<string[]>([]);
  const requested = useRef(new Set<string>());
  const catalog = useRef<ProductSheet[]>([]);
  const running = useRef(0);
  const generation = useRef(0);
  const originUrl = origin?.url ?? null;

  useEffect(() => {
    generation.current += 1;
    queue.current = [];
    const sheets = catalog.current;
    requested.current = new Set([...(originUrl ? [originUrl] : []), ...sheets.map((item) => item.url)]);
    setDetails(Object.fromEntries(sheets.map((item) => [item.url, { state: "ready", sheet: item } satisfies SupplierDetail])));
  }, [originUrl]);

  const pump = useCallback(() => {
    while (running.current < PARALLEL && queue.current.length > 0) {
      const href = queue.current.shift() as string;
      const turn = generation.current;
      running.current += 1;
      void analyzeProduct(href, { search: false })
        .then((result) => {
          if (turn !== generation.current) return;
          setDetails((current) => ({
            ...current,
            [href]: result.sheet
              ? { state: "ready", sheet: result.sheet }
              : { state: "error", error: result.error ?? "La fiche n'a pas pu être lue." },
          }));
        })
        .catch(() => {
          if (turn !== generation.current) return;
          setDetails((current) => ({ ...current, [href]: { state: "error", error: "La lecture a été interrompue." } }));
        })
        .finally(() => {
          running.current -= 1;
          pump();
        });
    }
  }, []);

  const load = useCallback(
    (hrefs: string[]) => {
      const fresh = hrefs.filter((href) => !requested.current.has(href));
      if (fresh.length === 0) return;
      for (const href of fresh) requested.current.add(href);
      setDetails((current) => ({
        ...current,
        ...Object.fromEntries(fresh.map((href) => [href, { state: "loading" } as SupplierDetail])),
      }));
      queue.current.push(...fresh);
      pump();
    },
    [pump],
  );

  const place = useCallback((sheets: ProductSheet[]) => {
    catalog.current = sheets;
    for (const item of sheets) requested.current.add(item.url);
    setDetails((current) => ({
      ...current,
      ...Object.fromEntries(sheets.map((item) => [item.url, { state: "ready", sheet: item } satisfies SupplierDetail])),
    }));
  }, []);

  const all: Record<string, SupplierDetail> =
    origin && originUrl ? { ...details, [originUrl]: { state: "ready", sheet: origin } } : details;

  return { details: all, load, place };
}
