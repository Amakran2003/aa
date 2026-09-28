"use client";

import { useEffect, useState } from "react";
import type { MarginView } from "@aa/contracts";
import { BudgetForm } from "@/components/budget-form";
import { MarginBlock } from "@/components/margin-view";
import { loadMargin } from "@/domains/marge/actions";

export function MarginPanel({ productUrl, revision }: { productUrl: string; revision: string }) {
  const [view, setView] = useState<MarginView | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    void loadMargin(productUrl).then((response) => {
      if (cancel) return;
      if (response.view) {
        setView(response.view);
        setError(null);
      } else {
        setError(response.error ?? "La marge n'a pas pu être lue.");
      }
    });
    return () => {
      cancel = true;
    };
  }, [productUrl, revision]);

  if (!view) {
    return error ? (
      <p className="text-sm font-medium text-erreur" role="alert">
        {error}
      </p>
    ) : (
      <p className="text-sm text-gris" role="status">
        Calcul de l'enveloppe…
      </p>
    );
  }

  return (
    <section
      className="@container cut w-full min-w-0 border border-white/70 bg-blanc/80 p-5 backdrop-blur-xl @2xl:p-7"
      aria-label="Budget et marge"
    >
      <BudgetForm view={view} onSaved={setView} />
      <MarginBlock view={view} onSaved={setView} />
    </section>
  );
}
