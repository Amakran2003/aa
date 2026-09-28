"use client";

import { useEffect, useState } from "react";
import type { Candidate } from "@aa/contracts";
import { companyName, supplierMessage } from "@aa/core/parcours";
import { Burst } from "@/features/parcours/motion";

export function MessageStep({
  chosen,
  sent,
  onToggleSent,
  onContinue,
}: {
  chosen: Candidate[];
  sent: string[];
  onToggleSent: (href: string) => void;
  onContinue: () => void;
}) {
  const [current, setCurrent] = useState(chosen[0]?.offer.href ?? "");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [party, setParty] = useState(0);
  const candidate = chosen.find((item) => item.offer.href === current) ?? chosen[0];
  const sentCount = chosen.filter((item) => sent.includes(item.offer.href)).length;
  const everything = chosen.length > 0 && sentCount === chosen.length;

  useEffect(() => {
    if (!chosen.some((item) => item.offer.href === current)) setCurrent(chosen[0]?.offer.href ?? "");
  }, [chosen, current]);

  useEffect(() => {
    if (everything) setParty((value) => value + 1);
  }, [everything]);

  if (!candidate) return null;
  const href = candidate.offer.href;
  const name = companyName(candidate.offer.supplier) ?? "l'usine";
  const text = drafts[href] ?? supplierMessage({ supplier: candidate.offer.supplier, product: candidate.offer.title });
  const isSent = sent.includes(href);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      document.getElementById("message-usine")?.focus();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <section className="@container cut relative border border-white/70 bg-blanc/80 p-5 backdrop-blur-xl @2xl:p-7" aria-labelledby="ton-message">
      <h3 id="ton-message" className="text-lg font-bold text-encre">
        Ton message, prêt à envoyer
      </h3>
      <p className="mt-1.5 max-w-2xl text-sm text-gris">
        Un message adapté à chaque usine : un échantillon, les grands paliers de prix, le carton et le code HS. Ton vrai budget
        n'y est jamais.
      </p>

      <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Usine">
        {chosen.map((item) => {
          const active = item.offer.href === href;
          const done = sent.includes(item.offer.href);
          return (
            <button
              key={item.offer.href}
              type="button"
              aria-pressed={active}
              onClick={() => {
                setCurrent(item.offer.href);
                setCopied(false);
              }}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                active ? "border-marine bg-marine text-blanc" : "border-[var(--abk-bordure-clair)] bg-blanc text-encre"
              }`}
            >
              {companyName(item.offer.supplier) ?? "Usine"}
              {done ? <span className={active ? "text-blanc" : "text-valide"}> · envoyé</span> : null}
            </button>
          );
        })}
      </div>

      <label htmlFor="message-usine" className="mt-5 block text-sm font-semibold text-encre">
        Message pour {name}
      </label>
      <textarea
        id="message-usine"
        value={text}
        onChange={(event) => setDrafts((all) => ({ ...all, [href]: event.target.value }))}
        rows={14}
        className="mt-2 w-full rounded-[var(--abk-rayon-bouton-large)] border border-[var(--abk-bordure-clair)] bg-[var(--abk-brume)] p-4 text-[15px] leading-relaxed text-encre"
      />

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void copy()}
          className="abk-bouton border border-[var(--abk-bordure-clair)] bg-blanc px-4 py-2.5 text-sm font-semibold text-encre"
        >
          {copied ? <span className="parcours-pop inline-block">Copié</span> : "Copier le message"}
        </button>
        <a
          href={candidate.offer.contact ?? href}
          target="_blank"
          rel="noreferrer"
          className="abk-bouton border border-[var(--abk-bordure-clair)] bg-blanc px-4 py-2.5 text-sm font-semibold text-marine"
        >
          {candidate.offer.contact ? "Écrire à l'usine sur Alibaba ↗" : "Ouvrir la page de l'usine ↗"}
        </a>
        <button
          type="button"
          aria-pressed={isSent}
          onClick={() => onToggleSent(href)}
          className={`abk-bouton px-4 py-2.5 text-sm font-semibold ${
            isSent ? "bg-valide text-blanc" : "border border-[var(--abk-bordure-clair)] bg-blanc text-encre"
          }`}
        >
          {isSent ? <span className="parcours-pop inline-block">Envoyé ✓</span> : "Marquer envoyé"}
        </button>
      </div>

      <div className="relative mt-6 flex flex-wrap items-center justify-between gap-3">
        <Burst play={party} />
        <p className={`text-sm ${everything ? "font-semibold text-valide" : "text-gris"}`} aria-live="polite">
          {everything ? "Tous tes messages sont partis." : `${sentCount} message${sentCount > 1 ? "s" : ""} envoyé${sentCount > 1 ? "s" : ""} sur ${chosen.length}.`}
        </p>
        <button type="button" onClick={onContinue} className="abk-bouton bg-marine px-6 py-3 text-sm font-bold text-blanc">
          Voir ce que ton budget ramène
        </button>
      </div>
    </section>
  );
}
