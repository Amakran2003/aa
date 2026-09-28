"use client";

import type { AnswerBlock } from "@aa/contracts";

function Block({ block }: { block: AnswerBlock }) {
  if (block.type === "text") return <p className="text-[15px] leading-relaxed text-encre">{block.text}</p>;
  if (block.type === "stats") {
    return (
      <dl className="grid gap-2 @md:grid-cols-2 @2xl:grid-cols-4">
        {block.items.map((item) => (
          <div key={item.label} className="min-w-0 rounded-[var(--abk-rayon-bouton)] bg-[var(--abk-brume)] px-4 py-3">
            <dt className="text-xs font-medium text-gris">{item.label}</dt>
            <dd className="mt-0.5 text-lg font-bold tracking-tight break-words text-encre">{item.value}</dd>
            {item.hint ? <dd className="mt-0.5 text-xs text-gris">{item.hint}</dd> : null}
          </div>
        ))}
      </dl>
    );
  }
  if (block.type === "compare") {
    return (
      <div className="overflow-x-auto rounded-[var(--abk-rayon-bouton)] border border-[var(--abk-bordure-clair)] bg-blanc">
        <table className="w-full min-w-[28rem] text-sm">
          <thead className="bg-[var(--abk-brume)] text-left text-xs text-gris">
            <tr>
              <th scope="col" className="px-4 py-2 font-medium">
                <span className="sr-only">Critère</span>
              </th>
              {block.columns.map((column) => (
                <th key={column} scope="col" className="px-4 py-2 font-semibold text-encre">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row) => (
              <tr key={row.label} className="border-t border-[var(--abk-bordure-clair)]">
                <th scope="row" className="px-4 py-2.5 text-left font-medium text-gris">
                  {row.label}
                </th>
                {block.columns.map((column, index) => (
                  <td key={column} className="px-4 py-2.5 font-semibold text-encre">
                    {row.values[index] ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  if (block.type === "table") {
    return (
      <div className="overflow-x-auto rounded-[var(--abk-rayon-bouton)] border border-[var(--abk-bordure-clair)] bg-blanc">
        <table className="w-full min-w-[24rem] text-sm">
          <thead className="bg-[var(--abk-brume)] text-left text-xs text-gris">
            <tr>
              {block.columns.map((column) => (
                <th key={column} scope="col" className="px-4 py-2 font-semibold text-encre">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row) => (
              <tr key={row.join("|")} className="border-t border-[var(--abk-bordure-clair)]">
                {block.columns.map((column, index) => (
                  <td key={column} className={`px-4 py-2.5 ${index === 0 ? "font-semibold text-encre" : "text-encre"}`}>
                    {row[index] ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  if (block.type === "chart") {
    const max = Math.max(...block.items.map((item) => item.value), 1);
    const shown = (value: number) =>
      new Intl.NumberFormat("fr-FR", { maximumFractionDigits: value >= 100 ? 0 : 2 }).format(value);
    return (
      <figure className="grid gap-3" aria-label={block.title ?? "Graphique"}>
        {block.title ? <figcaption className="text-sm font-semibold text-encre">{block.title}</figcaption> : null}
        <ul className="grid gap-2.5">
          {block.items.map((item) => (
            <li key={item.label} className="grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)_auto] items-center gap-3 text-sm">
              <span className="truncate font-medium text-encre">{item.label}</span>
              <span className="h-2.5 overflow-hidden rounded-full bg-[var(--abk-brume)]">
                <span
                  className="block h-full rounded-full bg-marine"
                  style={{ width: `${Math.max(4, (item.value / max) * 100)}%` }}
                />
              </span>
              <span className="font-semibold tabular-nums text-encre">
                {shown(item.value)}
                {block.unit ? ` ${block.unit}` : ""}
              </span>
            </li>
          ))}
        </ul>
      </figure>
    );
  }
  if (block.type === "steps") {
    return (
      <ol className="grid gap-2">
        {block.items.map((item, index) => (
          <li key={item} className="flex gap-3 text-[15px] text-encre">
            <span className="grid h-6 w-6 flex-none place-items-center rounded-full bg-marine text-xs font-bold text-blanc" aria-hidden="true">
              {index + 1}
            </span>
            <span className="pt-0.5">{item}</span>
          </li>
        ))}
      </ol>
    );
  }
  return (
    <p className="rounded-[var(--abk-rayon-bouton)] border border-[color-mix(in_srgb,var(--abk-signal)_30%,transparent)] bg-[color-mix(in_srgb,var(--abk-bulle)_55%,var(--abk-blanc))] px-4 py-3 text-sm text-encre">
      <span className="font-bold text-marine">Conseil · </span>
      {block.text}
    </p>
  );
}

export function AssistantAnswer({ blocks }: { blocks: AnswerBlock[] }) {
  return (
    <div className="@container cut grid w-full gap-4 border border-white/70 bg-blanc/85 p-5 backdrop-blur-xl">
      {blocks.map((block, index) => (
        <div key={index} className="parcours-rise" style={{ animationDelay: `${index * 120}ms` }}>
          <Block block={block} />
        </div>
      ))}
    </div>
  );
}

export function AssistantThinking() {
  return (
    <p className="ask-say ask-retrieval" role="status">
      <span className="ask-retrieval__headline">
        Je regarde
        <span className="ask-retrieval__dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </span>
    </p>
  );
}
