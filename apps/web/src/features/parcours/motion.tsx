"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ParcoursStep } from "@aa/contracts";
import type { CSSProperties } from "react";

function reducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function scrollToStep(id: string, frames = 30) {
  window.requestAnimationFrame(() => {
    const step = document.getElementById(id);
    if (!step) {
      if (frames > 0) scrollToStep(id, frames - 1);
      return;
    }
    step.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });
  });
}

export function useVisibleStep(active: boolean, marker: number): ParcoursStep {
  const [step, setStep] = useState<ParcoursStep>(1);

  useEffect(() => {
    if (!active) return;
    const root = document.querySelector(".ask-scroll");
    if (!(root instanceof HTMLElement)) return;
    const update = () => {
      const rootRect = root.getBoundingClientRect();
      const line = rootRect.top + Math.min(180, rootRect.height * 0.28);
      let best: { step: ParcoursStep; dist: number } | null = null;
      for (const number of [1, 2, 3, 4, 5] as ParcoursStep[]) {
        const element = document.getElementById(`etape-${number}`);
        if (!element) continue;
        const rect = element.getBoundingClientRect();
        if (rect.bottom < rootRect.top + 24 || rect.top > rootRect.bottom - 24) continue;
        const dist = Math.abs(rect.top - line);
        if (!best || dist < best.dist) best = { step: number, dist };
      }
      if (best) setStep((current) => (current === best.step ? current : best.step));
    };
    update();
    root.addEventListener("scroll", update, { passive: true });
    return () => root.removeEventListener("scroll", update);
  }, [active, marker]);

  return step;
}

export function useSuitePrompt(enabled: boolean, marker: boolean, onReach: () => void) {
  const callback = useRef(onReach);
  const done = useRef(false);
  const hold = useRef(false);
  const timer = useRef(0);

  useEffect(() => {
    callback.current = onReach;
  });

  const holdFor = useCallback((ms = 1500) => {
    hold.current = true;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      hold.current = false;
    }, ms);
  }, []);

  const reset = useCallback(() => {
    done.current = false;
    hold.current = false;
    window.clearTimeout(timer.current);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const root = document.querySelector(".ask-scroll");
    if (!(root instanceof HTMLElement)) return;
    const check = () => {
      if (hold.current || done.current) return;
      const node = document.getElementById("suite");
      if (!node) return;
      const rootRect = root.getBoundingClientRect();
      const line = rootRect.top + Math.min(200, rootRect.height * 0.42);
      const rect = node.getBoundingClientRect();
      if (rect.top > line || rect.bottom < line) return;
      const answers = root.querySelectorAll("[id$='-reponse'], [id$='-toi'], [id$='-attente']");
      for (const answer of answers) {
        const box = answer.getBoundingClientRect();
        if (box.top <= line && box.bottom >= line) return;
      }
      done.current = true;
      window.setTimeout(() => callback.current(), 450);
    };
    check();
    root.addEventListener("scroll", check, { passive: true });
    return () => root.removeEventListener("scroll", check);
  }, [enabled, marker]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return { holdFor, reset };
}

export function useCountUp(target: number, duration = 900): number {
  const [value, setValue] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    if (reducedMotion()) {
      from.current = target;
      setValue(target);
      return;
    }
    const origin = from.current;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - progress) ** 3;
      setValue(origin + (target - origin) * eased);
      if (progress < 1) frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(frame);
      from.current = target;
    };
  }, [target, duration]);

  return value;
}

const COLORS = ["var(--abk-marine)", "var(--abk-signal)", "var(--abk-bleu-400)", "var(--abk-corail)", "var(--abk-bulle)"];

const PIECES = Array.from({ length: 18 }, (_, index) => {
  const angle = (index / 18) * Math.PI * 2;
  const distance = 90 + ((index * 37) % 60);
  return {
    x: `${Math.round(Math.cos(angle) * distance * 1.6)}px`,
    y: `${Math.round(Math.sin(angle) * distance - 40)}px`,
    r: `${(index * 67) % 360}deg`,
    color: COLORS[index % COLORS.length],
    delay: `${(index % 4) * 40}ms`,
  };
});

export function Burst({ play }: { play: number }) {
  if (play === 0) return null;
  return (
    <span key={play} className="parcours-burst" aria-hidden="true">
      {PIECES.map((piece, index) => (
        <i
          key={index}
          style={
            {
              background: piece.color,
              animationDelay: piece.delay,
              "--x": piece.x,
              "--y": piece.y,
              "--r": piece.r,
            } as CSSProperties
          }
        />
      ))}
    </span>
  );
}
