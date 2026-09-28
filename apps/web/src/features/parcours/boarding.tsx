"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { createPortal } from "react-dom";
import type { ParcoursStep } from "@aa/contracts";

const STORAGE_KEY = "aa-boarding-v1";

const SPOTS = [
  "produit",
  "offres",
  "clic",
  "fiche",
  "questions",
  "chat",
  "fournisseurs",
  "messages",
  "simulation",
  "transport",
  "lien",
] as const;

type Spot = (typeof SPOTS)[number];

export type GuideCue = Spot;

const COPY: Record<Spot, string> = {
  produit: "Ici, c'est le produit. Le prix, les photos, d'où vient l'usine.",
  offres: "Là, les usines trouvées. Les moins chères qui conviennent.",
  clic: "Clique cette usine. Sa fiche s'ouvre à côté.",
  fiche: "Voilà la fiche. Le prix, les photos, l'usine.",
  questions: "Ces questions sont déjà prêtes. Choisis-en une.",
  chat: "Tu peux aussi écrire ta question directement ici.",
  fournisseurs: "Ici tu choisis à qui écrire. Trois usines sont déjà cochées.",
  messages: "Le message est prêt. Tu le copies, rien ne part tout seul.",
  simulation: "Combien de pièces ton budget ramène, livrées en France.",
  transport: "La liste à envoyer au transitaire. Le devis n'est pas encore là.",
  lien: "Rentre ton lien, toi aussi.",
};

const TARGET: Record<Spot, string> = {
  produit: "[data-boarding='produit']",
  offres: "[data-boarding='offres']",
  clic: "[data-boarding='offer']",
  fiche: "[data-boarding='fiche']",
  questions: "[data-boarding='questions']",
  chat: "[data-boarding='chat']",
  fournisseurs: "#etape-2",
  messages: "#etape-3",
  simulation: "#etape-4",
  transport: "#etape-5",
  lien: "[data-boarding='own-link']",
};

const LATER: Partial<Record<ParcoursStep, Spot>> = {
  2: "fournisseurs",
  3: "messages",
  4: "simulation",
  5: "transport",
};

const STICKY = new Set<Spot>(["clic", "questions", "chat"]);

type Box = { left: number; top: number; width: number; height: number };

type Layout = {
  spot: Spot | null;
  left: number;
  top: number;
  bubbleLeft: boolean;
  halo: Box | null;
};

function isSpot(value: unknown): value is Spot {
  return typeof value === "string" && (SPOTS as readonly string[]).includes(value);
}

function readSeen(): Spot[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isSpot) : [];
  } catch {
    return [];
  }
}

function elementOf(spot: Spot): HTMLElement | null {
  const element = document.querySelector(TARGET[spot]);
  return element instanceof HTMLElement ? element : null;
}

function onScreen(spot: Spot): boolean {
  const element = elementOf(spot);
  if (!element) return false;
  const rect = element.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) return false;
  if (spot === "questions" || spot === "chat" || spot === "fiche") {
    return rect.bottom > 8 && rect.top < window.innerHeight - 8;
  }
  const root = document.querySelector(".ask-scroll");
  const bounds = root instanceof HTMLElement ? root.getBoundingClientRect() : new DOMRect(0, 0, window.innerWidth, window.innerHeight);
  const visible = Math.min(rect.bottom, bounds.bottom) - Math.max(rect.top, bounds.top);
  return visible > 72;
}

function mostlyGone(spot: Spot): boolean {
  const element = elementOf(spot);
  if (!element) return false;
  const rect = element.getBoundingClientRect();
  const root = document.querySelector(".ask-scroll");
  const top = root instanceof HTMLElement ? root.getBoundingClientRect().top : 0;
  return rect.bottom < top + 96;
}

function liveSpot(seen: Spot[], visible: ParcoursStep, sideOpen: boolean): Spot | null {
  const done = (spot: Spot) => seen.includes(spot);
  if (sideOpen && !done("fiche")) return "fiche";
  if (visible >= 2) {
    const step = LATER[visible];
    if (step && !done(step) && onScreen(step)) return step;
    return null;
  }
  if (!done("produit")) {
    if (mostlyGone("produit") && onScreen("offres")) return "offres";
    return "produit";
  }
  if (!done("offres") && onScreen("offres")) return "offres";
  if (!done("clic") && onScreen("clic")) return "clic";
  if (!done("questions") && (done("clic") || done("fiche"))) return onScreen("questions") ? "questions" : null;
  if (!done("chat") && done("questions")) return onScreen("chat") ? "chat" : null;
  return null;
}

function placeNow(visible: ParcoursStep, sideOpen: boolean): Spot {
  if (sideOpen) return "fiche";
  if (visible >= 2) return LATER[visible] ?? "transport";
  if (onScreen("offres")) return onScreen("clic") ? "clic" : "offres";
  return "produit";
}

function haloOf(spot: Spot): Box | null {
  const element = elementOf(spot);
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  const pad = 8;
  const left = Math.max(8, rect.left - pad);
  const top = Math.max(8, rect.top - pad);
  const right = Math.min(window.innerWidth - 8, rect.right + pad);
  const bottom = Math.min(window.innerHeight - 8, rect.bottom + pad);
  const width = right - left;
  const height = bottom - top;
  if (width < 24 || height < 24) return null;
  return { left, top, width, height };
}

function columnEdge(): number {
  const thread = document.querySelector(".ask-thread");
  const composer = document.querySelector(".ask-composer");
  const element = thread instanceof HTMLElement ? thread : composer instanceof HTMLElement ? composer : null;
  if (!element) return 96;
  return element.getBoundingClientRect().left;
}

function besideColumn(top: number): { left: number; top: number; bubbleLeft: boolean } {
  const size = 72;
  const gap = 18;
  const edge = columnEdge();
  return { left: Math.max(12, edge - size - gap), top, bubbleLeft: false };
}

function anchorOf(spot: Spot, halo: Box | null): { left: number; top: number; bubbleLeft: boolean } {
  const size = 76;
  const topOf = (value: number) => Math.min(Math.max(value, 168), window.innerHeight - 210);
  if (spot === "fiche" && halo) {
    return {
      left: Math.min(Math.max(halo.left - size - 12, 12), window.innerWidth - size - 12),
      top: topOf(halo.top + 36),
      bubbleLeft: true,
    };
  }
  if ((spot === "questions" || spot === "chat" || spot === "lien") && halo) return besideColumn(topOf(halo.top - 8));
  const rect = elementOf(spot)?.getBoundingClientRect();
  return besideColumn(topOf(rect ? rect.top + 24 : window.innerHeight * 0.36));
}

function MascotFace() {
  return (
    <svg viewBox="0 0 72 72" aria-hidden="true" className="boarding-face">
      <circle cx="36" cy="36" r="34" fill="var(--abk-marine)" />
      <circle cx="36" cy="38" r="26" fill="var(--abk-blanc)" />
      <circle cx="27" cy="36" r="3.2" fill="var(--abk-marine)" />
      <circle cx="45" cy="36" r="3.2" fill="var(--abk-marine)" />
      <path d="M28 46c2.4 3.2 5 4.6 8 4.6s5.6-1.4 8-4.6" fill="none" stroke="var(--abk-marine)" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M18 30c4-8 10-12 18-12" fill="none" stroke="var(--abk-signal)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="54" cy="18" r="6" fill="var(--abk-signal)" />
    </svg>
  );
}

export function Guide({
  active,
  visible,
  sideOpen,
  paused,
  cue = null,
}: {
  active: boolean;
  visible: ParcoursStep;
  sideOpen: boolean;
  paused: boolean;
  cue?: GuideCue | null;
}) {
  const [seen, setSeen] = useState<Spot[]>([]);
  const [ready, setReady] = useState(false);
  const [replay, setReplay] = useState<Spot | null>(null);
  const [layout, setLayout] = useState<Layout>({ spot: null, left: 16, top: 180, bubbleLeft: false, halo: null });
  const seenRef = useRef(seen);
  const replayRef = useRef(replay);
  const cueRef = useRef(cue);
  const previous = useRef<Spot | null>(null);
  const opened = useRef(false);
  seenRef.current = seen;
  replayRef.current = replay;
  cueRef.current = cue;

  const remember = useCallback((spot: Spot) => {
    setSeen((current) => {
      if (current.includes(spot)) return current;
      const next = [...current, spot];
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    setReplay(null);
  }, []);

  useEffect(() => {
    setSeen(readSeen());
    setReady(true);
  }, []);

  useEffect(() => {
    if (sideOpen) {
      opened.current = true;
      return;
    }
    if (!opened.current) return;
    opened.current = false;
    remember("produit");
    remember("offres");
    remember("clic");
    remember("fiche");
  }, [sideOpen, remember]);

  useEffect(() => {
    if (!active || !ready || paused) return;
    const root = document.querySelector(".ask-scroll");
    let frame = 0;
    const update = () => {
      frame = 0;
      const guided = cueRef.current;
      const live = guided ?? liveSpot(seenRef.current, visible, sideOpen);
      const showing = guided ? guided : (replayRef.current ?? live);
      if (
        !guided &&
        previous.current &&
        previous.current !== showing &&
        !replayRef.current &&
        !STICKY.has(previous.current) &&
        previous.current !== "fiche"
      ) {
        remember(previous.current);
      }
      if (!guided && !replayRef.current) previous.current = live;
      const halo = showing ? haloOf(showing) : null;
      const anchor = showing
        ? anchorOf(showing, halo)
        : besideColumn(Math.round(window.innerHeight * 0.34));
      const next = {
        spot: showing,
        left: Math.round(anchor.left),
        top: Math.round(anchor.top),
        bubbleLeft: anchor.bubbleLeft,
        halo: halo
          ? {
              left: Math.round(halo.left),
              top: Math.round(halo.top),
              width: Math.round(halo.width),
              height: Math.round(halo.height),
            }
          : null,
      };
      setLayout((current) =>
        current.spot === next.spot &&
        current.left === next.left &&
        current.top === next.top &&
        current.bubbleLeft === next.bubbleLeft &&
        current.halo?.left === next.halo?.left &&
        current.halo?.top === next.halo?.top &&
        current.halo?.width === next.halo?.width &&
        current.halo?.height === next.halo?.height
          ? current
          : next,
      );
    };
    const schedule = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };
    update();
    root?.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      root?.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [active, ready, paused, visible, sideOpen, seen, replay, remember, cue]);

  useEffect(() => {
    if (!active) return;
    const input = document.getElementById("chat-message");
    if (!(input instanceof HTMLElement)) return;
    const finish = () => {
      if (seenRef.current.includes("chat")) return;
      if (layout.spot === "chat" || replayRef.current === "chat") remember("chat");
    };
    input.addEventListener("focus", finish);
    return () => input.removeEventListener("focus", finish);
  }, [active, layout.spot, remember]);

  if (!active || !ready || paused) return null;

  const spot = cue ?? layout.spot;
  const text = spot ? COPY[spot] : null;

  return createPortal(
    <>
      {layout.halo ? (
        <div
          className="boarding-halo"
          style={{ left: layout.halo.left, top: layout.halo.top, width: layout.halo.width, height: layout.halo.height }}
          aria-hidden="true"
        />
      ) : null}
      <div
        className="boarding-mascot"
        style={
          {
            left: layout.left,
            top: layout.top,
            "--boarding-room": `${Math.max(140, layout.left + 64)}px`,
          } as CSSProperties
        }
      >
        {text ? (
          <div className={`boarding-bubble ${layout.bubbleLeft ? "boarding-bubble--left" : ""}`} role="note">
            <p>{text}</p>
            <button
              type="button"
              className="boarding-ok"
              onClick={() => {
                if (spot) remember(spot);
              }}
            >
              D'accord
            </button>
          </div>
        ) : null}
        <button
          type="button"
          className="boarding-guy"
          aria-label={text ? "Fermer le commentaire" : "Revoir le commentaire de cet endroit"}
          onClick={() => {
            if (spot) remember(spot);
            else setReplay(placeNow(visible, sideOpen));
          }}
        >
          <MascotFace />
        </button>
      </div>
    </>,
    document.body,
  );
}
