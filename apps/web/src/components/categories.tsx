"use client";

import { useState } from "react";
import type { ProductSheet } from "@aa/contracts";

export function Categories({ sheet }: { sheet: ProductSheet }) {
  const [open, setOpen] = useState<string | null>(null);
  const group = sheet.groups.find((item) => item.name === open) ?? null;

  return (
    <div
      onBlur={(event) => {
        const next = event.relatedTarget;
        if (next instanceof Node && event.currentTarget.contains(next)) return;
        setOpen(null);
      }}
    >
      <h3 className="text-xs font-medium text-gris">Caractéristiques</h3>
      <div className="mt-2 flex flex-wrap gap-2">
        {sheet.groups.map((item) => {
          const expanded = open === item.name;
          return (
            <button
              key={item.name}
              type="button"
              aria-expanded={expanded}
              aria-controls={expanded ? "caracteristiques-panel" : undefined}
              onMouseEnter={() => setOpen(item.name)}
              onFocus={() => setOpen(item.name)}
              onClick={() => setOpen(expanded ? null : item.name)}
              onKeyDown={(event) => {
                if (event.key === "Escape") setOpen(null);
              }}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
                expanded
                  ? "border-marine bg-marine text-blanc"
                  : "border-[var(--abk-bordure-clair)] bg-blanc text-encre hover:border-signal"
              }`}
            >
              {item.name}
            </button>
          );
        })}
      </div>
      {group ? (
        <dl
          id="caracteristiques-panel"
          className="mt-3 grid gap-3 rounded-[var(--abk-rayon-bouton-large)] border border-[var(--abk-bordure-clair)] bg-blanc p-4 @md:grid-cols-2"
        >
          {group.labels.map((label) => {
            const value = sheet.fields.find((field) => field.label === label)?.value;
            return (
              <div key={label} className="grid min-w-0 gap-0.5">
                <dt className="text-xs text-gris">{label}</dt>
                <dd className={`text-sm break-words ${value ? "font-medium text-encre" : "text-gris"}`}>{value ?? "Absent"}</dd>
              </div>
            );
          })}
        </dl>
      ) : null}
    </div>
  );
}
