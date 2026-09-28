"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import type { MarginView, ProjectSettings } from "@aa/contracts";
import { formatMoney } from "@aa/core/money";
import { saveBudget } from "@/domains/marge/actions";

type FieldName = Exclude<keyof ProjectSettings, "updatedBy">;

type Field = { name: FieldName; label: string; unit: string; hint?: string };

const MAIN: Field[] = [
  { name: "budgetTotal", label: "Budget total", unit: "€", hint: "Ce que vous mettez dans tout le projet." },
  {
    name: "setAside",
    label: "Part mise de côté",
    unit: "€",
    hint: "Entrepôt, voiture, tout ce qui n'est pas la marchandise. 0 si rien.",
  },
  { name: "salePrice", label: "Prix de vente visé", unit: "€ par pièce", hint: "Pour expliquer la marge. Ce n'est pas le budget." },
];

const SETTINGS: Field[] = [
  { name: "contributionRate", label: "Cotisations", unit: "% du chiffre encaissé" },
  { name: "paymentRate", label: "Frais de paiement", unit: "% de la vente" },
  { name: "marginFloor", label: "Seuil de marge nette", unit: "%" },
  { name: "unitCap", label: "Coût rendu maximum", unit: "€ par pièce, facultatif" },
];

function shown(value: number | null): string {
  return value === null ? "" : String(value).replace(".", ",");
}

function Input({ field, value, error }: { field: Field; value: number | null; error: string | undefined }) {
  const id = `projet-${field.name}`;
  const described = [field.hint ? `${id}-aide` : null, error ? `${id}-erreur` : null].filter(Boolean).join(" ");
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="block text-sm font-semibold text-encre">
        {field.label} <span className="font-medium text-gris">({field.unit})</span>
      </label>
      <input
        id={id}
        name={field.name}
        inputMode="decimal"
        autoComplete="off"
        defaultValue={shown(value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={described || undefined}
        className="mt-1.5 w-full rounded-[var(--abk-rayon-bouton)] border border-[var(--abk-bordure-clair)] bg-blanc px-3 py-2 text-[16px] text-encre"
      />
      {field.hint ? (
        <p id={`${id}-aide`} className="mt-1 text-xs text-gris">
          {field.hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-erreur`} className="mt-1 text-sm font-medium text-erreur" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function BudgetForm({ view, onSaved }: { view: MarginView; onSaved: (view: MarginView) => void }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const { project, result } = view;
  const settingsMissing = SETTINGS.some((field) => field.name !== "unitCap" && project[field.name] === null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(
      [...new FormData(event.currentTarget).entries()].map(([key, value]) => [key, String(value)]),
    );
    setPending(true);
    setSaved(false);
    const response = await saveBudget(view.productUrl, values);
    setPending(false);
    setFieldErrors(response.fieldErrors ?? {});
    if (response.view) {
      setError(null);
      setSaved(true);
      onSaved(response.view);
      return;
    }
    setError(response.error ?? "Le budget n'a pas été enregistré.");
  }

  return (
    <form onSubmit={onSubmit} aria-labelledby="budget-titre" noValidate key={JSON.stringify(project)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 id="budget-titre" className="text-base font-bold text-encre">
          Le budget
        </h3>
        {project.updatedBy ? <p className="text-xs text-gris">Modifié par {project.updatedBy}</p> : null}
      </div>

      <div className="mt-4 grid gap-4 @xl:grid-cols-3">
        {MAIN.map((field) => (
          <Input key={field.name} field={field} value={project[field.name]} error={fieldErrors[field.name]} />
        ))}
      </div>

      <details className="mt-4 rounded-[var(--abk-rayon-bouton)] bg-[var(--abk-brume)] px-4 py-3" open={settingsMissing}>
        <summary className="cursor-pointer text-sm font-semibold text-encre">Réglages du projet</summary>
        <div className="mt-3 grid gap-4 @xl:grid-cols-2">
          {SETTINGS.map((field) => (
            <Input key={field.name} field={field} value={project[field.name]} error={fieldErrors[field.name]} />
          ))}
        </div>
      </details>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="abk-bouton bg-marine px-5 py-2.5 text-sm font-bold text-blanc disabled:opacity-60"
        >
          {pending ? "Enregistrement…" : "Enregistrer le budget"}
        </button>
        <p className="text-sm text-gris" role="status">
          {saved ? "Budget enregistré." : ""}
        </p>
      </div>
      {error ? (
        <p className="mt-2 text-sm font-medium text-erreur" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-5 rounded-[var(--abk-rayon-bouton)] border border-[var(--abk-bordure-clair)] bg-blanc px-4 py-3">
        <p className="text-xs font-medium text-gris">Enveloppe pour ramener les produits</p>
        <p className="mt-0.5 text-xl font-bold tracking-tight text-encre">
          {result.envelope === null ? "Budget total et part mise de côté à remplir" : formatMoney(result.envelope, "EUR")}
        </p>
        <p className="mt-1 text-sm text-gris">
          Elle couvre le prix usine, le fret jusqu'au port, le trajet port → adresse, le commissionnaire en douane, les
          droits et la TVA.
        </p>
      </div>
    </form>
  );
}
