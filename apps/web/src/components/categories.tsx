"use client";

import { useEffect, useState } from "react";
import type { ProductSheet } from "@aa/contracts";

export function Categories({ sheet }: { sheet: ProductSheet }) {
  const [open, setOpen] = useState<string | null>(null);
  const group = sheet.groups.find((item) => item.name === open) ?? null;

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(null);
    window.addEventListener("wheel", close, { passive: true });
    window.addEventListener("touchmove", close, { passive: true });
    return () => {
      window.removeEventListener("wheel", close);
      window.removeEventListener("touchmove", close);
    };
  }, [open]);

  return (
    <div
      className="mt-5"
      onMouseLeave={(event) => {
        const next = event.relatedTarget;
        if (next instanceof Node && event.currentTarget.contains(next)) return;
        const active = document.activeElement;
        if (active instanceof Node && event.currentTarget.contains(active)) return;
        setOpen(null);
      }}
      onBlur={(event) => {
        const next = event.relatedTarget;
        if (next instanceof Node && event.currentTarget.contains(next)) return;
        setOpen(null);
      }}
    >
      <h3 className="text-sm font-semibold text-encre">Caractéristiques</h3>
      <div className="mt-3 flex flex-wrap gap-2">
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
              onKeyDown={(event) => {
                if (event.key === "Escape") setOpen(null);
              }}
              className={`abk-bouton border px-4 py-2.5 text-base ${
                expanded
                  ? "border-signal bg-blanc font-semibold text-encre"
                  : "border-[var(--abk-bordure-clair)] bg-blanc text-encre"
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
          className="cut mt-4 grid gap-4 border border-white/80 bg-blanc p-6 shadow-[var(--abk-ombre-carte)] sm:grid-cols-2"
        >
          {group.labels.map((label) => {
            const value = sheet.fields.find((field) => field.label === label)?.value;
            return (
              <div key={label} className="grid gap-1">
                <dt className="text-sm text-gris">{label}</dt>
                <dd className="text-base font-medium break-words text-encre">{value ?? "Absent"}</dd>
              </div>
            );
          })}
        </dl>
      ) : null}
    </div>
  );
}
