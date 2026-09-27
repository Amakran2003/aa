"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { ProductSheet } from "@aa/contracts";
import { productLink } from "@aa/contracts";
import { analyzeProduct, recallProduct } from "@/domains/fiche/analyze";
import { CompareActions, CompareStatus } from "@/components/compare-actions";
import { SheetView } from "@/components/sheet-view";

const PHRASES = [
  "Lecture de la fiche",
  "Repérage du prix",
  "Repérage de l'usine",
  "Repérage des modèles",
] as const;

type ChatMessage =
  | { id: string; kind: "user"; text: string }
  | { id: string; kind: "assistant"; text: string }
  | { id: string; kind: "product" };

function euros(value: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
}

function parseEuros(raw: string): number | null {
  const cleaned = raw.replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}

function wait(ms: number): Promise<void> {
  const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : ms;
  return new Promise((resolve) => {
    window.setTimeout(resolve, delay);
  });
}

export function ProductAsk() {
  const [draft, setDraft] = useState("");
  const [budget, setBudget] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [budgetError, setBudgetError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [phrase, setPhrase] = useState(0);
  const [sheet, setSheet] = useState<ProductSheet | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [started, setStarted] = useState(false);
  const [productShown, setProductShown] = useState(false);
  const [searchSettled, setSearchSettled] = useState(false);
  const [listsReady, setListsReady] = useState(false);
  const [talk, setTalk] = useState("");
  const [sideHref, setSideHref] = useState<string | null>(null);
  const [sideSheet, setSideSheet] = useState<ProductSheet | null>(null);
  const [sideError, setSideError] = useState<string | null>(null);
  const [sidePending, setSidePending] = useState(false);
  const [sideWidth, setSideWidth] = useState(380);
  const sideRequest = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const run = useRef(0);

  useEffect(() => {
    if (!pending) return;
    const timer = window.setInterval(() => setPhrase((index) => index + 1), 1400);
    return () => window.clearInterval(timer);
  }, [pending]);

  useEffect(() => {
    if (!productShown || !sheet || listsReady) return;
    const found = (sheet.probes ?? []).length >= 3 || (sheet.offers ?? []).length > 0 || searchSettled;
    if (!found) return;
    let cancel = false;
    void wait(900).then(() => {
      if (!cancel) setListsReady(true);
    });
    return () => {
      cancel = true;
    };
  }, [productShown, sheet, listsReady, searchSettled]);

  useEffect(() => {
    if (!sheet || searchSettled || (sheet.probes ?? []).length >= 3) return;
    let tries = 0;
    const timer = window.setInterval(async () => {
      tries += 1;
      const next = await recallProduct(sheet.url);
      if ((next?.probes?.length ?? 0) >= 3) {
        setSheet(next);
        setSearchSettled(true);
        window.clearInterval(timer);
        return;
      }
      if (tries > 8) {
        setSearchSettled(true);
        window.clearInterval(timer);
      }
    }, 3000);
    return () => window.clearInterval(timer);
  }, [sheet, searchSettled]);

  async function revealProduct(next: ProductSheet, token: number) {
    setSheet(next);
    await wait(700);
    if (run.current !== token) return;
    setPending(false);
    setProductShown(true);
    setMessages((current) => [
      ...current.filter((item) => item.id !== "read"),
      { id: "product", kind: "product" },
    ]);
    scrollRef.current?.scrollTo({ top: 0 });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = productLink.safeParse(draft);
    const amount = parseEuros(budget);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Lien invalide.");
      document.getElementById("product-link")?.focus();
      return;
    }
    if (amount === null) {
      setError(null);
      setBudgetError("Indique un montant en euros, supérieur à zéro.");
      document.getElementById("budget-total")?.focus();
      return;
    }
    const token = run.current + 1;
    run.current = token;
    setError(null);
    setBudgetError(null);
    setSideHref(null);
    setSideSheet(null);
    setSideError(null);
    setSheet(null);
    setProductShown(false);
    setSearchSettled(false);
    setListsReady(false);
    setStarted(true);
    setMessages([
      { id: "user", kind: "user", text: `${parsed.data}\n${euros(amount)} pour tout le projet` },
      { id: "read", kind: "assistant", text: "Je lis la fiche." },
    ]);
    setPending(true);
    scrollRef.current?.scrollTo({ top: 0 });
    try {
      const result = await analyzeProduct(parsed.data);
      if (run.current !== token) return;
      if (result.error || !result.sheet) {
        setPending(false);
        setStarted(false);
        setMessages((current) => [
          ...current.filter((item) => item.id !== "read"),
          { id: "fail", kind: "assistant", text: result.error ?? "La page n'a pas pu être lue." },
        ]);
        setError(result.error ?? "La page n'a pas pu être lue.");
        return;
      }
      setDraft("");
      setBudget("");
      await revealProduct(result.sheet, token);
    } catch {
      if (run.current !== token) return;
      setPending(false);
      setStarted(false);
      setMessages((current) => [
        ...current.filter((item) => item.id !== "read"),
        { id: "fail", kind: "assistant", text: "La lecture a été interrompue." },
      ]);
      setError("La lecture a été interrompue.");
    }
  }

  function onTalk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = talk.trim();
    if (!text) return;
    setTalk("");
    setMessages((current) => [
      ...current,
      { id: `you-${current.length}`, kind: "user", text },
      { id: `note-${current.length}`, kind: "assistant", text: "Noté. On reste sur cette fiche." },
    ]);
  }

  const active = pending || messages.length > 0;
  const column = sideHref !== null;

  useEffect(() => {
    if (!sideSheet) return;
    document.getElementById("compare-switch")?.focus();
  }, [sideSheet]);

  function closeCompare() {
    sideRequest.current = null;
    setSideHref(null);
    setSideSheet(null);
    setSideError(null);
    setSidePending(false);
  }

  async function openCompare(href: string) {
    sideRequest.current = href;
    setSideHref(href);
    setSideSheet(null);
    setSideError(null);
    setSidePending(true);
    const result = await analyzeProduct(href);
    if (sideRequest.current !== href) return;
    setSidePending(false);
    if (result.error || !result.sheet) {
      setSideError(result.error ?? "La page n'a pas pu être lue.");
      return;
    }
    setSideSheet(result.sheet);
  }

  function promote() {
    if (!sideSheet) return;
    const next = sideSheet;
    const hasLists =
      next.related.length > 0 || (next.offers ?? []).length > 0 || (next.probes ?? []).length >= 3;
    run.current += 1;
    setSheet(next);
    setProductShown(true);
    setPending(false);
    setSearchSettled((next.probes ?? []).length >= 3);
    setListsReady(hasLists);
    setMessages((current) => {
      const first = current.find((item) => item.id === "user" && item.kind === "user");
      const extra = first && first.kind === "user" ? first.text.split("\n").slice(1).join("\n") : "";
      const text = extra ? `${next.url}\n${extra}` : next.url;
      return [
        { id: "user", kind: "user", text },
        { id: "product", kind: "product" },
      ];
    });
    closeCompare();
    scrollRef.current?.scrollTo({ top: 0 });
  }

  return (
    <div
      className={
        column
          ? "ask-stage ask-shell--active ask-shell--split"
          : active
            ? "ask-stage ask-shell--active"
            : "ask-stage ask-shell--idle"
      }
    >
      <div className={column ? "ask-split" : "contents"}>
        <div className="ask-scroll" ref={scrollRef}>
          <div className="ask-scroll__inner">
            <h1 className={active ? "sr-only" : "text-2xl font-bold tracking-tight text-encre"}>
              Analyser un produit
            </h1>
            {messages.length > 0 ? (
              <div className="ask-thread" role="log" aria-label="Discussion">
                {messages.map((message) => {
                  if (message.kind === "user") {
                    return (
                      <div key={message.id} className="ask-msg ask-msg--user">
                        <p className="ask-who">Vous</p>
                        <p className="ask-say whitespace-pre-line">{message.text}</p>
                      </div>
                    );
                  }
                  if (message.kind === "assistant") {
                    const text = pending && message.id === "read" ? PHRASES[phrase % PHRASES.length] : message.text;
                    return (
                      <div key={message.id} className="ask-msg">
                        <p className="ask-who">Assistant</p>
                        <p className="ask-say" aria-hidden={pending && message.id === "read" ? true : undefined}>
                          {text}
                        </p>
                      </div>
                    );
                  }
                  if (message.kind === "product" && sheet) {
                    return (
                      <div key={message.id} className="ask-msg">
                        <p className="ask-who">Assistant</p>
                        <div className="ask-card">
                          <SheetView
                            sheet={sheet}
                            density="full"
                            part="produit"
                            lists={listsReady}
                            activeHref={sideHref}
                            onOpen={openCompare}
                          />
                        </div>
                      </div>
                    );
                  }
                  return null;
                })}
                {pending ? (
                  <p className="sr-only" role="status">
                    Lecture de la fiche en cours.
                  </p>
                ) : null}
              </div>
            ) : null}

            {error ? (
              <p id="product-link-error" className="mt-3 text-sm font-medium text-erreur" role="alert">
                {error}
              </p>
            ) : null}
          </div>
        </div>
        {column ? (
          <button
            type="button"
            className="ask-split__handle"
            aria-label="Largeur du produit comparé"
            aria-orientation="vertical"
            aria-valuemin={280}
            aria-valuemax={640}
            aria-valuenow={sideWidth}
            onPointerDown={(event) => {
              const startX = event.clientX;
              const start = sideWidth;
              const target = event.currentTarget;
              target.setPointerCapture(event.pointerId);
              const move = (pointer: PointerEvent) => {
                setSideWidth(Math.min(640, Math.max(280, start - (pointer.clientX - startX))));
              };
              const stop = () => {
                target.removeEventListener("pointermove", move);
                target.removeEventListener("pointerup", stop);
              };
              target.addEventListener("pointermove", move);
              target.addEventListener("pointerup", stop);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowLeft") setSideWidth((width) => Math.min(640, width + 24));
              if (event.key === "ArrowRight") setSideWidth((width) => Math.max(280, width - 24));
            }}
          />
        ) : null}
        {column ? (
          <aside className="ask-side" style={{ width: sideWidth }} aria-label="Produit comparé">
            <CompareActions ready={Boolean(sideSheet)} onClose={closeCompare} onPromote={promote} />
            <div className="ask-side__body">
              <CompareStatus pending={sidePending} error={sideError} />
              {sideSheet ? (
                <SheetView
                  sheet={sideSheet}
                  density="short"
                  part="fiche"
                  lists={false}
                  activeHref={null}
                  onOpen={openCompare}
                />
              ) : null}
            </div>
          </aside>
        ) : null}
      </div>

      {started ? (
        <form onSubmit={onTalk} className="ask-composer">
          <label htmlFor="chat-message" className="mb-2 block text-sm font-semibold text-encre">
            Message
          </label>
          <div className="ask-composer__glass">
            <input
              id="chat-message"
              name="message"
              type="text"
              autoComplete="off"
              value={talk}
              onChange={(event) => setTalk(event.target.value)}
              className="min-w-0 flex-1 bg-transparent px-4 py-3 text-[16px] text-encre placeholder:text-gris"
            />
            <button type="submit" className="abk-bouton shrink-0 bg-marine px-5 py-3 text-sm font-bold text-blanc">
              Envoyer
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={onSubmit} className="ask-composer" aria-busy={pending}>
          <label htmlFor="product-link" className="mb-2 block text-sm font-semibold text-encre">
            Lien du produit <span className="font-medium text-gris">(obligatoire)</span>
          </label>
          <div className="ask-composer__glass">
            <input
              id="product-link"
              name="link"
              type="url"
              inputMode="url"
              autoComplete="url"
              required
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "product-link-error" : undefined}
              placeholder="https://"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className="min-w-0 flex-1 bg-transparent px-4 py-3 text-[16px] text-encre placeholder:text-gris"
            />
          </div>
          <label htmlFor="budget-total" className="mb-2 mt-3 block text-sm font-semibold text-encre">
            Budget total, en euros <span className="font-medium text-gris">(obligatoire)</span>
          </label>
          <div className="ask-composer__glass">
            <input
              id="budget-total"
              name="budget"
              inputMode="decimal"
              autoComplete="off"
              required
              aria-invalid={budgetError ? true : undefined}
              aria-describedby={budgetError ? "budget-error" : undefined}
              value={budget}
              onChange={(event) => setBudget(event.target.value)}
              className="min-w-0 flex-1 bg-transparent px-4 py-3 text-[16px] text-encre"
            />
            <button
              type="submit"
              disabled={pending}
              className="abk-bouton shrink-0 bg-marine px-5 py-3 text-sm font-bold text-blanc disabled:opacity-60"
            >
              {pending ? "Analyse en cours" : "Analyser"}
            </button>
          </div>
          {budgetError ? (
            <p id="budget-error" className="mt-2 text-sm font-medium text-erreur" role="alert">
              {budgetError}
            </p>
          ) : null}
        </form>
      )}
    </div>
  );
}
