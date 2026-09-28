"use client";

import type { ParcoursStep } from "@aa/contracts";

function suggestionsFor(stage: ParcoursStep, one: string, many: string): string[] {
  if (stage === 1) return ["C'est quoi le MOQ ?", "Tableau des usines trouvées", "Comment savoir si une usine est sérieuse ?"];
  if (stage === 2) return ["Tableau des usines sérieuses", "Pourquoi celles-ci sont cochées ?", "Fabricant ou négoce, ça change quoi ?"];
  if (stage === 3) return ["Comment écrire à une usine sur Alibaba ?", "Pourquoi demander un échantillon ?", "Que faire si l'usine ne répond pas ?"];
  if (stage === 4) return ["Graphique des quantités livrées", `Répartition du coût par ${one}`, "Compare les usines pour mon budget"];
  return ["C'est quoi le DDP ?", "Comment trouver un transitaire ?", `Que dois-je envoyer pour ces ${many} ?`];
}

export function AssistantSuggestions({
  stage,
  one,
  many,
  busy,
  onAsk,
}: {
  stage: ParcoursStep;
  one: string;
  many: string;
  busy: boolean;
  onAsk: (question: string) => void;
}) {
  return (
    <div key={stage} data-boarding="questions" className="assistant-hint mb-2" role="group" aria-label="Questions à poser à l'assistant">
      <p className="ask-retrieval mb-1.5 text-xs font-semibold text-gris">
        <span className="ask-retrieval__headline text-xs">
          Demande à l'assistant
          <span className="ask-retrieval__dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </span>
      </p>
      <div className="flex flex-wrap gap-2">
        {suggestionsFor(stage, one, many).map((question, index) => (
          <button
            key={question}
            type="button"
            disabled={busy}
            onClick={() => onAsk(question)}
            style={{ animationDelay: `${150 + index * 110}ms` }}
            className="assistant-chip rounded-full border border-[var(--abk-bordure-clair)] bg-blanc/90 px-3.5 py-1.5 text-sm font-medium text-encre hover:border-signal disabled:opacity-50"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
}
