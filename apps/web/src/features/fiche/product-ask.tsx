"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { AnswerBlock, Candidate, ParcoursStep, ProductSheet } from "@aa/contracts";
import { MAX_SUPPLIERS, SEARCH_VERSION, productLink } from "@aa/contracts";
import { RESERVE_RATE, recommendedPrice, shortlist, simulate } from "@aa/core/parcours";
import { loadDemo } from "@/domains/demo/load";
import { askAssistant } from "@/domains/assistant/ask";
import { analyzeProduct, recallProduct } from "@/domains/fiche/analyze";
import { AssistantAnswer, AssistantThinking } from "@/features/assistant/answer";
import { contextOf } from "@/features/assistant/context";
import { AssistantSuggestions } from "@/features/assistant/suggestions";
import { keepBudgetTotal } from "@/domains/marge/actions";
import { CompareActions, CompareStatus } from "@/components/compare-actions";
import { SheetView } from "@/components/sheet-view";
import { CurrencyProvider } from "@/features/fiche/currency";
import { MessageStep } from "@/features/parcours/message-step";
import { Guide, type GuideCue } from "@/features/parcours/boarding";
import { scrollToStep, useSuitePrompt, useVisibleStep } from "@/features/parcours/motion";
import { SearchDoneDialog } from "@/features/parcours/search-done-dialog";
import { SimulationStep, bestSupplier, simulationOf } from "@/features/parcours/simulation-step";
import type { Noun, SimulationInputs } from "@/features/parcours/simulation-step";
import { ParcoursStepper } from "@/features/parcours/stepper";
import { SupplierStep } from "@/features/parcours/supplier-step";
import { TransportStep } from "@/features/parcours/transport-step";
import { useSupplierDetails } from "@/features/parcours/use-supplier-details";

const PHRASES = [
  "Lecture de la fiche",
  "Recherche sur Made-in-China",
  "Recherche sur Alibaba",
  "Recherche sur DHgate",
] as const;

type ChatMessage =
  | { id: string; kind: "user"; text: string }
  | { id: string; kind: "assistant"; text: string }
  | { id: string; kind: "product" }
  | { id: string; kind: "next" }
  | { id: string; kind: "step"; step: Exclude<ParcoursStep, 1> }
  | { id: string; kind: "thinking" }
  | { id: string; kind: "answer"; blocks: AnswerBlock[] };

const INTRO: Record<Exclude<ParcoursStep, 1>, string> = {
  2: "Voici les usines les plus sérieuses pour ce produit. Coche celles à qui écrire.",
  3: "Un message par usine, prêt à partir. Copie-le, envoie-le sur leur page, puis marque-le envoyé.",
  4: "Voici ce que ton budget ramène, livré en France.",
  5: "La liste à envoyer au transitaire, pour avoir le vrai prix du transport.",
};

function searched(sheet: ProductSheet | null | undefined): boolean {
  return Boolean(
    sheet && (sheet.probes ?? []).length >= 3 && sheet.rates !== undefined && sheet.searchVersion === SEARCH_VERSION,
  );
}

function nounOf(sheet: ProductSheet | null): Noun {
  return /desk|table|bureau/i.test(sheet?.title ?? "")
    ? { one: "bureau", many: "bureaux", delivered: "livrés" }
    : { one: "pièce", many: "pièces", delivered: "livrées" };
}

function beforeSuite(current: ChatMessage[], extra: ChatMessage[]): ChatMessage[] {
  const cut = current.findIndex((item) => item.kind === "next" || item.kind === "step");
  if (cut < 0) return [...current, ...extra];
  return [...current.slice(0, cut), ...extra, ...current.slice(cut)];
}

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
  const [asking, setAsking] = useState(false);
  const [sideHref, setSideHref] = useState<string | null>(null);
  const [sideSheet, setSideSheet] = useState<ProductSheet | null>(null);
  const [sideError, setSideError] = useState<string | null>(null);
  const [sidePending, setSidePending] = useState(false);
  const [sideWidth, setSideWidth] = useState(380);
  const sideRequest = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const run = useRef(0);
  const [stage, setStage] = useState<ParcoursStep>(1);
  const [reached, setReached] = useState<ParcoursStep>(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const announced = useRef(false);
  const [picked, setPicked] = useState<string[]>([]);
  const pickedRef = useRef(picked);
  pickedRef.current = picked;
  const [sent, setSent] = useState<string[]>([]);
  const [inputs, setInputs] = useState<SimulationInputs>({ budget: "", aside: "", sale: "" });
  const [demoPlaying, setDemoPlaying] = useState(false);
  const [ownLink, setOwnLink] = useState(false);
  const [cue, setCue] = useState<GuideCue | null>(null);
  const [simFor, setSimFor] = useState<string | null>(null);
  const candidates = useMemo(() => (sheet ? shortlist(sheet) : []), [sheet]);
  const candidatesRef = useRef(candidates);
  candidatesRef.current = candidates;
  const chosen = useMemo(
    () =>
      picked
        .map((href) => candidates.find((candidate) => candidate.offer.href === href))
        .filter((candidate): candidate is Candidate => Boolean(candidate)),
    [picked, candidates],
  );
  const { details, load, place } = useSupplierDetails(sheet);
  const rates = sheet?.rates ?? null;
  const noun = nounOf(sheet);
  const visible = useVisibleStep(productShown, reached);
  const searchDone = productShown && listsReady && (searchSettled || searched(sheet));
  useEffect(() => {
    if (!searchDone || announced.current) return;
    announced.current = true;
    setMessages((current) => (current.some((item) => item.kind === "next") ? current : [...current, { id: "next", kind: "next" }]));
  }, [searchDone]);

  const suite = useSuitePrompt(productShown && reached === 1 && !demoPlaying, searchDone, () => setDialogOpen(true));

  function resetParcours() {
    setStage(1);
    setReached(1);
    setDialogOpen(false);
    announced.current = false;
    suite.reset();
    setPicked([]);
    setSent([]);
    setSimFor(null);
  }

  function goTo(next: ParcoursStep) {
    suite.holdFor();
    setDialogOpen(false);
    if (next === 2 && pickedRef.current.length === 0) {
      const preselected = candidatesRef.current.filter((candidate) => candidate.preselected).map((candidate) => candidate.offer.href);
      setPicked(preselected);
      load(preselected);
    }
    setStage(next);
    setReached((current) => (next > current ? next : current));
    if (next > 1) {
      const step = next as Exclude<ParcoursStep, 1>;
      setMessages((current) =>
        current.some((item) => item.kind === "step" && item.step === step)
          ? current
          : [...current, { id: `etape-${step}`, kind: "step", step }],
      );
    }
    scrollToStep(`etape-${next}`);
  }

  function toggleSupplier(href: string) {
    const on = picked.includes(href);
    if (!on && picked.length >= MAX_SUPPLIERS) return;
    setPicked((current) => (on ? current.filter((item) => item !== href) : [...current, href]));
    if (!on) load([href]);
  }

  function toggleSent(href: string) {
    setSent((current) => (current.includes(href) ? current.filter((item) => item !== href) : [...current, href]));
  }

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
    if (!sheet || searchSettled || searched(sheet)) return;
    let tries = 0;
    const timer = window.setInterval(async () => {
      tries += 1;
      const next = await recallProduct(sheet.url);
      const probes = next?.probes?.length ?? 0;
      const offers = next?.offers?.length ?? 0;
      const done = searched(next);
      if (done || tries > 30) {
        if (next && (done || offers > 0)) setSheet(next);
        setSearchSettled(true);
        window.clearInterval(timer);
        return;
      }
      if (!next) return;
      const grew =
        probes > (sheet.probes?.length ?? 0) ||
        offers > (sheet.offers?.length ?? 0) ||
        next.searchVersion !== sheet.searchVersion;
      if (grew) setSheet(next);
    }, 1500);
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
    setCue(null);
    setDemoPlaying(false);
    setOwnLink(false);
    place([]);
    resetParcours();
    setInputs({ budget: String(amount), aside: String(Math.round((amount * RESERVE_RATE) / 100)), sale: "" });
    setMessages([
      { id: "user", kind: "user", text: `${parsed.data}\n${euros(amount)} pour tout le projet` },
      { id: "read", kind: "assistant", text: "Je lis la fiche." },
    ]);
    setPending(true);
    scrollRef.current?.scrollTo({ top: 0 });
    try {
      const [result] = await Promise.all([analyzeProduct(parsed.data), keepBudgetTotal(amount)]);
      if (run.current !== token) return;
      if (result.error || !result.sheet) {
        setPending(false);
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
      setMessages((current) => [
        ...current.filter((item) => item.id !== "read"),
        { id: "fail", kind: "assistant", text: "La lecture a été interrompue." },
      ]);
      setError("La lecture a été interrompue.");
    }
  }

  async function ask(question: string) {
    const text = question.trim();
    if (!text || asking) return;
    setTalk("");
    setAsking(true);
    suite.holdFor();
    const id = `question-${Date.now()}`;
    setMessages((current) =>
      beforeSuite(current, [
        { id: `${id}-toi`, kind: "user", text },
        { id: `${id}-attente`, kind: "thinking" },
      ]),
    );
    scrollToStep(`${id}-attente`);
    const context = contextOf({ sheet, stage: visible, candidates, chosen, details, rates, inputs });
    const answer = await askAssistant(text, context).catch(() => ({
      blocks: [{ type: "text", text: "Je n'ai pas pu répondre cette fois. Réessaie dans un moment." }] as AnswerBlock[],
    }));
    setMessages((current) =>
      current.map((item) => (item.id === `${id}-attente` ? { id: `${id}-reponse`, kind: "answer", blocks: answer.blocks } : item)),
    );
    setAsking(false);
    suite.holdFor();
    scrollToStep(`${id}-toi`);
  }

  function onTalk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void ask(talk);
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

  function finishOnboarding() {
    run.current += 1;
    setDemoPlaying(false);
    setOwnLink(true);
    setDraft("");
    if (!budget.trim() && inputs.budget) setBudget(inputs.budget);
    setCue("lien");
    window.setTimeout(() => document.getElementById("own-link")?.focus(), 80);
  }

  async function playDemo() {
    if (pending) return;
    const token = run.current + 1;
    run.current = token;
    const alive = () => run.current === token;
    setDemoPlaying(true);
    setError(null);
    setBudgetError(null);
    closeCompare();
    setCue(null);
    try {
      const demo = await loadDemo();
      if (!alive()) return;
      const aside = Math.round((demo.budget * RESERVE_RATE) / 100);
      const factory = demo.suppliers.find((item) => item.url === demo.factory) ?? null;
      const preview = factory
        ? simulate({ sheet: factory, rates: factory.rates ?? demo.sheet.rates ?? null, budget: demo.budget, aside })
        : null;
      const sale = preview?.kind === "ready" ? String(recommendedPrice(preview.unit.total)) : "";
      setDraft("");
      setBudget("");
      await wait(500);
      if (!alive()) return;
      setDraft(demo.url);
      await wait(1400);
      if (!alive()) return;
      setBudget(String(demo.budget));
      await wait(1400);
      if (!alive()) return;
      setSearchSettled(true);
      setListsReady(false);
      setStarted(true);
      resetParcours();
      sessionStorage.removeItem("aa-boarding-v1");
      setInputs({ budget: String(demo.budget), aside: String(aside), sale });
      setMessages([
        { id: "user", kind: "user", text: `${demo.url}\n${euros(demo.budget)} pour tout le projet` },
        { id: "read", kind: "assistant", text: "Je prépare la démo." },
      ]);
      setPending(true);
      setCue("produit");
      place(demo.suppliers);
      await revealProduct(demo.sheet, token);
      const beat = async (ms: number) => {
        await wait(ms);
        return alive();
      };
      const shown = async (id: string) => {
        for (let attempt = 0; attempt < 25; attempt += 1) {
          if (!alive()) return false;
          if (document.getElementById(id)) return true;
          await wait(200);
        }
        return alive();
      };
      if (!(await shown("etape-1"))) return;
      if (!(await beat(7000))) return;
      if (!(await shown("offres"))) return;
      scrollToStep("offres");
      setCue("offres");
      if (!(await beat(7000))) return;
      setCue("clic");
      if (!(await beat(4500))) return;
      await openCompare(demo.factory);
      if (!alive()) return;
      setCue("fiche");
      if (!(await beat(8000))) return;
      closeCompare();
      setCue("questions");
      if (!(await beat(6000))) return;
      setCue("chat");
      if (!(await beat(6000))) return;
      goTo(2);
      setCue("fournisseurs");
      if (!(await shown("etape-2"))) return;
      if (!(await beat(8000))) return;
      goTo(3);
      setCue("messages");
      if (!(await shown("etape-3"))) return;
      if (!(await beat(8000))) return;
      goTo(4);
      setCue("simulation");
      if (!(await shown("etape-4"))) return;
      if (!(await beat(9000))) return;
      goTo(5);
      setCue("transport");
      if (!(await shown("etape-5"))) return;
      if (!(await beat(7000))) return;
      finishOnboarding();
    } catch {
      if (!alive()) return;
      setPending(false);
      setError("La démo n'a pas pu démarrer.");
    } finally {
      if (alive()) setDemoPlaying(false);
    }
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
    resetParcours();
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
    <CurrencyProvider rates={sheet?.rates ?? null}>
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
            {messages.length > 0 ? <ParcoursStepper step={stage} reached={reached} onGo={goTo} /> : null}
            {messages.length > 0 ? (
              <div className="ask-thread" role="log" aria-label="Discussion">
                {messages.map((message) => {
                  if (message.kind === "user") {
                    return (
                      <div key={message.id} id={message.id} className="ask-msg ask-msg--user scroll-mt-24">
                        <p className="ask-who">Vous</p>
                        <p className="ask-say whitespace-pre-line">{message.text}</p>
                      </div>
                    );
                  }
                  if (message.kind === "thinking") {
                    return (
                      <div key={message.id} id={message.id} className="ask-msg parcours-rise scroll-mt-24">
                        <p className="ask-who">Assistant</p>
                        <AssistantThinking />
                      </div>
                    );
                  }
                  if (message.kind === "answer") {
                    return (
                      <div key={message.id} id={message.id} className="ask-msg parcours-rise scroll-mt-24">
                        <p className="ask-who">Assistant</p>
                        <div className="ask-card">
                          <AssistantAnswer blocks={message.blocks} />
                        </div>
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
                      <div key={message.id} id="etape-1" className="ask-msg parcours-rise scroll-mt-24">
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
                  if (message.kind === "next" && sheet) {
                    const passing = candidates.filter((candidate) => candidate.passes).length;
                    return (
                      <div key={message.id} id="suite" className="ask-msg parcours-rise scroll-mt-24">
                        <p className="ask-who">Assistant</p>
                        <div className="ask-say">
                          <p>
                            La recherche est finie.{" "}
                            {passing > 0
                              ? `${passing} usine${passing > 1 ? "s sérieuses" : " sérieuse"} pour ce produit.`
                              : "Aucune usine n'affiche encore assez d'ancienneté, mais tu peux choisir à qui écrire."}
                          </p>
                          {reached === 1 ? (
                            <button
                              type="button"
                              onClick={() => goTo(2)}
                              className="abk-bouton mt-3 bg-marine px-5 py-2.5 text-sm font-bold text-blanc"
                            >
                              Choisir qui contacter
                            </button>
                          ) : null}
                        </div>
                      </div>
                    );
                  }
                  if (message.kind === "step" && sheet) {
                    const simHref = simFor ?? bestSupplier(chosen, details, rates, inputs);
                    const simCandidate = chosen.find((candidate) => candidate.offer.href === simHref) ?? null;
                    const simDetail = simHref ? details[simHref] : undefined;
                    return (
                      <div key={message.id} id={`etape-${message.step}`} className="ask-msg parcours-rise scroll-mt-24">
                        <p className="ask-who">Assistant · étape {message.step}</p>
                        <p className="ask-say">{INTRO[message.step]}</p>
                        <div className="ask-card mt-2">
                          {message.step === 2 ? (
                            <SupplierStep
                              originUrl={sheet.url}
                              candidates={candidates}
                              picked={picked}
                              details={details}
                              rates={rates}
                              onToggle={toggleSupplier}
                              onContinue={() => goTo(3)}
                            />
                          ) : message.step === 3 ? (
                            <MessageStep chosen={chosen} sent={sent} onToggleSent={toggleSent} onContinue={() => goTo(4)} />
                          ) : message.step === 4 ? (
                            <SimulationStep
                              chosen={chosen}
                              details={details}
                              rates={rates}
                              noun={noun}
                              inputs={inputs}
                              onInputs={(next) => setInputs((current) => ({ ...current, ...next }))}
                              selected={simFor}
                              onSelect={setSimFor}
                              onContinue={() => goTo(5)}
                            />
                          ) : (
                            <TransportStep
                              candidate={simCandidate}
                              sheet={simDetail?.state === "ready" ? simDetail.sheet : null}
                              result={simCandidate ? simulationOf(simCandidate, details, rates, inputs) : null}
                              noun={noun}
                            />
                          )}
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
          <aside className="ask-side" data-boarding="fiche" style={{ width: sideWidth }} aria-label="Produit comparé">
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

      {demoPlaying ? (
        <div className="ask-composer !pb-2">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={finishOnboarding}
              className="abk-bouton border border-[var(--abk-bordure-clair)] bg-blanc px-4 py-2 text-sm font-semibold text-encre"
            >
              Terminer l'onboarding
            </button>
          </div>
        </div>
      ) : null}
      {ownLink ? (
        <form onSubmit={onSubmit} className="ask-composer" aria-busy={pending}>
          <p className="mb-2 text-sm font-semibold text-encre">Rentre ton lien, toi aussi.</p>
          <label htmlFor="own-link" className="sr-only">
            Ton lien
          </label>
          <div data-boarding="own-link" className="ask-composer__glass">
            <input
              id="own-link"
              name="link"
              type="url"
              inputMode="url"
              autoComplete="url"
              required
              placeholder="https://"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className="min-w-0 flex-1 bg-transparent px-4 py-3 text-[16px] text-encre placeholder:text-gris"
            />
            <button
              type="submit"
              disabled={pending}
              className="abk-bouton shrink-0 bg-marine px-5 py-3 text-sm font-bold text-blanc disabled:opacity-60"
            >
              {pending ? "Analyse en cours" : "Chercher"}
            </button>
          </div>
          <label htmlFor="own-budget" className="mb-2 mt-3 block text-sm font-semibold text-encre">
            Budget total, en euros
          </label>
          <div className="ask-composer__glass">
            <input
              id="own-budget"
              inputMode="decimal"
              autoComplete="off"
              required
              value={budget}
              onChange={(event) => setBudget(event.target.value)}
              className="min-w-0 flex-1 bg-transparent px-4 py-3 text-[16px] text-encre"
            />
          </div>
        </form>
      ) : started ? (
        <form onSubmit={onTalk} className="ask-composer" aria-busy={asking}>
          {productShown ? (
            <AssistantSuggestions stage={visible} one={noun.one} many={noun.many} busy={asking} onAsk={(question) => void ask(question)} />
          ) : null}
          <label htmlFor="chat-message" className="sr-only">
            Question pour l'assistant
          </label>
          <div
            key={productShown ? stage : 0}
            data-boarding={productShown ? "chat" : undefined}
            className={`ask-composer__glass ${productShown ? "assistant-glow" : ""}`}
          >
            <input
              id="chat-message"
              name="message"
              type="text"
              autoComplete="off"
              value={talk}
              placeholder="Pose une question sur ce produit, les usines ou ton budget"
              onChange={(event) => setTalk(event.target.value)}
              className="min-w-0 flex-1 bg-transparent px-4 py-3 text-[16px] text-encre placeholder:text-gris"
            />
            <button
              type="submit"
              disabled={asking}
              className="abk-bouton shrink-0 bg-marine px-5 py-3 text-sm font-bold text-blanc disabled:opacity-60"
            >
              {asking ? "…" : "Demander"}
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
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={pending || demoPlaying}
              onClick={() => void playDemo()}
              className="abk-bouton border border-[var(--abk-bordure-clair)] bg-blanc px-5 py-2.5 text-sm font-bold text-encre disabled:opacity-60"
            >
              Démo
            </button>
            <p className="text-sm text-gris">Un bureau déjà lu, raconté tout seul jusqu'au transport.</p>
          </div>
          {budgetError ? (
            <p id="budget-error" className="mt-2 text-sm font-medium text-erreur" role="alert">
              {budgetError}
            </p>
          ) : null}
        </form>
      )}
      <Guide key={ownLink ? "lien" : "parcours"} active={productShown || ownLink} visible={visible} sideOpen={column} paused={dialogOpen} cue={cue} />
      <SearchDoneDialog
        open={dialogOpen}
        candidates={candidates}
        onChoose={() => goTo(2)}
        onDismiss={() => setDialogOpen(false)}
        onSeeOffers={() => goTo(2)}
      />
    </div>
    </CurrencyProvider>
  );
}
