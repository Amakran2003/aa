"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { CostCell, CostLine, MarginVerdict, MarginView } from "@aa/contracts";
import { COST_LABEL, COST_UNIT } from "@aa/contracts";
import { formatMoney } from "@aa/core/money";
import { saveCostCell } from "@/domains/marge/actions";

const LOT: CostLine[] = ["quantity", "factory", "volume", "weight"];
const ROUTE: CostLine[] = ["freight", "inland", "broker", "duties", "vat"];

const EMPTY_NOTE: Record<CostLine, string> = {
  quantity: "Absente de la fiche. Tape la quantité visée.",
  factory: "Prix absent de la fiche.",
  volume: "Carton absent de la fiche. À demander à l'usine.",
  weight: "Poids absent de la fiche. À demander à l'usine.",
  freight: "Vide. À demander au transitaire.",
  inland: "Vide. À demander au transitaire.",
  broker: "Vide. À demander au commissionnaire.",
  duties: "Vide. Il faut le code HS.",
  vat: "Vide. Se calcule sur la valeur en douane.",
};

const VERDICT: Record<MarginVerdict, { label: string; tone: string }> = {
  incomplete: { label: "Marge incomplète", tone: "border-corail bg-[var(--abk-brume)] text-encre" },
  "over-budget": { label: "Hors budget", tone: "border-erreur bg-blanc text-erreur" },
  "over-target": { label: "Au-dessus du coût rendu maximum", tone: "border-erreur bg-blanc text-erreur" },
  "below-floor": { label: "Sous le seuil de marge", tone: "border-erreur bg-blanc text-erreur" },
  holds: { label: "La marge tient", tone: "border-valide bg-blanc text-valide" },
};

const euros = (value: number) => formatMoney(value, "EUR");
const decimal = (value: number, digits = 2) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: digits }).format(value);
const percent = (value: number) => `${decimal(value * 100, 1)} %`;

function display(cell: CostCell): string {
  if (cell.value === null) return "";
  return String(cell.value).replace(".", ",");
}

function Tile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="min-w-0 rounded-[var(--abk-rayon-bouton)] border border-[var(--abk-bordure-clair)] bg-blanc px-3 py-2.5">
      <dt className="text-xs font-medium text-gris">{label}</dt>
      <dd className="mt-0.5 text-base font-bold tracking-tight break-words text-encre">{value}</dd>
      {hint ? <dd className="mt-0.5 text-xs text-gris">{hint}</dd> : null}
    </div>
  );
}

function CellRow({
  cell,
  productUrl,
  onSaved,
  onAnnounce,
}: {
  cell: CostCell;
  productUrl: string;
  onSaved: (view: MarginView) => void;
  onAnnounce: (text: string) => void;
}) {
  const [draft, setDraft] = useState(display(cell));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const focused = useRef(false);
  const id = `case-${cell.line}`;

  useEffect(() => {
    if (!focused.current) setDraft(display(cell));
  }, [cell]);

  async function save() {
    if (draft.trim() === display(cell) || pending) return;
    if (draft.trim() === "" && cell.source !== "saisie") {
      setDraft(display(cell));
      return;
    }
    setPending(true);
    const response = await saveCostCell(productUrl, cell.line, draft);
    setPending(false);
    if (response.view) {
      setError(null);
      onSaved(response.view);
      onAnnounce(`${COST_LABEL[cell.line]} enregistré.`);
      return;
    }
    setError(response.error ?? "La case n'a pas été enregistrée.");
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void save();
  }

  const status =
    cell.source === "saisie"
      ? `Saisi par ${cell.by ?? "vous"}. Vider la case pour revenir à la fiche.`
      : cell.source === "fiche"
        ? `Lu sur la fiche${cell.note ? ` · ${cell.note}` : ""}`
        : (cell.note ?? EMPTY_NOTE[cell.line]);

  return (
    <li className="grid items-start gap-x-4 gap-y-1.5 border-t border-[var(--abk-bordure-clair)] py-3 first:border-t-0 @xl:grid-cols-[minmax(0,13rem)_minmax(0,11rem)_minmax(0,1fr)]">
      <label htmlFor={id} className="text-sm font-semibold text-encre">
        {COST_LABEL[cell.line]}
        <span className="block text-xs font-medium text-gris">{COST_UNIT[cell.line]}</span>
      </label>
      <form onSubmit={onSubmit}>
        <input
          id={id}
          inputMode={cell.line === "quantity" ? "numeric" : "decimal"}
          autoComplete="off"
          value={draft}
          placeholder="Vide"
          aria-invalid={error ? true : undefined}
          aria-describedby={`${id}-etat${error ? ` ${id}-erreur` : ""}`}
          onFocus={() => {
            focused.current = true;
          }}
          onBlur={() => {
            focused.current = false;
            void save();
          }}
          onChange={(event) => setDraft(event.target.value)}
          className={`w-full rounded-[var(--abk-rayon-bouton)] border bg-blanc px-3 py-2 text-[16px] font-semibold text-encre placeholder:font-medium placeholder:text-gris ${
            cell.value === null ? "border-dashed border-gris/40" : "border-[var(--abk-bordure-clair)]"
          }`}
        />
        <button type="submit" className="sr-only">
          Enregistrer {COST_LABEL[cell.line]}
        </button>
      </form>
      <div className="min-w-0">
        <p id={`${id}-etat`} className={`text-sm break-words ${cell.value === null ? "text-gris" : "text-encre"}`}>
          {pending ? "Enregistrement…" : status}
        </p>
        {error ? (
          <p id={`${id}-erreur`} className="mt-1 text-sm font-medium text-erreur" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </li>
  );
}

export function MarginBlock({ view, onSaved }: { view: MarginView; onSaved: (view: MarginView) => void }) {
  const [announce, setAnnounce] = useState("");
  const { result } = view;
  const verdict = VERDICT[result.verdict];
  const cell = (line: CostLine) => view.cells.find((item) => item.line === line);

  const rows = (lines: CostLine[]) =>
    lines
      .map(cell)
      .filter((item): item is CostCell => Boolean(item))
      .map((item) => (
        <CellRow key={item.line} cell={item} productUrl={view.productUrl} onSaved={onSaved} onAnnounce={setAnnounce} />
      ));

  return (
    <section className="mt-8" aria-labelledby="marge-titre">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 id="marge-titre" className="text-base font-bold text-encre">
          La marge
        </h3>
        <p className={`rounded-full border-2 px-3 py-1 text-sm font-bold ${verdict.tone}`}>{verdict.label}</p>
      </div>

      {result.reason ? <p className="mt-3 text-sm font-medium text-erreur">{result.reason}</p> : null}
      {result.missing.length > 0 ? (
        <p className="mt-3 text-sm text-encre">
          <span className="font-semibold">Cases vides : </span>
          {result.missing.map((item) => item.label).join(", ")}. La marge ne passe pas au vert tant qu'une case est vide.
        </p>
      ) : null}

      <dl className="mt-4 grid grid-cols-2 gap-2 @2xl:grid-cols-4">
        <Tile
          label={result.cash === null ? "Déjà chiffré" : "Cash pour tout ramener"}
          value={euros(result.cash ?? result.known)}
          hint={result.cash === null ? "Sans les cases vides" : result.freightShare !== null ? `Fret et trajet : ${percent(result.freightShare)}` : undefined}
        />
        <Tile
          label="Coût rendu par pièce"
          value={
            result.unitCost !== null
              ? euros(result.unitCost)
              : result.unitAtLeast !== null
                ? `Au moins ${euros(result.unitAtLeast)}`
                : "Pas encore calculé"
          }
          hint={result.unitCost === null && result.quantity === null ? "Il faut la quantité" : undefined}
        />
        <Tile
          label="Prix usine maximum par pièce"
          value={result.ceiling !== null ? euros(result.ceiling) : "Pas encore calculé"}
          hint={result.ceiling === null ? "Il faut la quantité, l'enveloppe et les cinq cases du trajet" : undefined}
        />
        <Tile
          label="Marge nette par pièce"
          value={result.netPerUnit !== null ? euros(result.netPerUnit) : "Pas encore calculée"}
          hint={result.netRate !== null ? `${percent(result.netRate)} du prix de vente, après cotisations et paiement` : undefined}
        />
      </dl>

      <h4 className="mt-6 text-sm font-bold text-encre">Le lot</h4>
      <ul className="mt-1">{rows(LOT)}</ul>

      <h4 className="mt-6 text-sm font-bold text-encre">Le trajet et la douane</h4>
      <p className="mt-1 text-sm text-gris">Montants des devis, pour tout le lot. Une case reste vide tant qu'il n'y a pas de devis.</p>
      <ul className="mt-1">{rows(ROUTE)}</ul>

      <p className="sr-only" role="status" aria-live="polite">
        {announce}
      </p>
    </section>
  );
}
