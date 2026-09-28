"use client";

import type { ParcoursStep } from "@aa/contracts";
import { PARCOURS_STEPS } from "@aa/contracts";

export function ParcoursStepper({
  step,
  reached,
  onGo,
}: {
  step: ParcoursStep;
  reached: ParcoursStep;
  onGo: (step: ParcoursStep) => void;
}) {
  const progress = (reached - 1) / (PARCOURS_STEPS.length - 1);
  return (
    <nav className="parcours-steps" aria-label="Étapes">
      <ol className="relative flex items-center justify-between gap-2">
        <span className="parcours-steps__track" aria-hidden="true">
          <span className="parcours-steps__fill" style={{ transform: `scaleX(${progress})` }} />
        </span>
        {PARCOURS_STEPS.map((label, index) => {
          const number = (index + 1) as ParcoursStep;
          const state = number === step ? "current" : number <= reached ? "done" : "todo";
          const open = number <= reached;
          return (
            <li key={label} className="relative z-[1]">
              <button
                type="button"
                data-state={state}
                aria-current={number === step ? "step" : undefined}
                aria-disabled={open ? undefined : true}
                onClick={() => {
                  if (open) onGo(number);
                }}
                className={`parcours-step flex items-center gap-2 rounded-full bg-blanc/90 p-0.5 text-sm ${
                  state === "current" ? "pr-3" : "sm:pr-2.5"
                } ${
                  state === "current" ? "font-bold text-encre" : state === "done" ? "font-semibold text-encre" : "text-gris"
                } ${open ? "cursor-pointer" : "cursor-default"}`}
              >
                <span className="parcours-dot" aria-hidden="true">
                  {state === "done" ? "✓" : number}
                </span>
                <span className={state === "current" ? "" : "hidden sm:inline"}>{label}</span>
                {state === "done" ? <span className="sr-only">, faite</span> : null}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
