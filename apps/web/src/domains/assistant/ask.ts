"use server";

import { cookies } from "next/headers";
import type { AnswerBlock } from "@aa/contracts";
import { askInput, assistantAnswer, sessionCookie } from "@aa/contracts";
import { openSession } from "@aa/core";
import { localAnswer } from "@/domains/assistant/local";

const SYSTEM = `Tu es l'assistant d'un outil qui aide à importer un produit de Chine vers la France : trouver les usines, leur écrire, estimer ce que le budget ramène.

Règles :
- Réponds en français simple. Tutoie. Phrases courtes.
- Utilise uniquement les chiffres du contexte. Si un chiffre manque, dis-le et dis comment l'obtenir : demander à l'usine, au transitaire ou au commissionnaire en douane. N'invente jamais un prix, un fret, un délai ou un taux.
- Les chiffres de simulation du contexte sont des estimations : dis-le quand tu t'en sers.
- Ne parle jamais de livre, de méthode ou de source interne.
- Réponds uniquement en JSON, sans markdown : {"blocks":[...]}.
- Types de blocs :
  {"type":"text","text":"une ou deux phrases"}
  {"type":"stats","items":[{"label":"...","value":"...","hint":"..."}]} pour deux à quatre chiffres clés
  {"type":"compare","columns":["Usine A","Usine B"],"rows":[{"label":"Prix usine","values":["...","..."]}]} pour comparer les mêmes critères entre usines
  {"type":"table","columns":["Usine","Prix","MOQ"],"rows":[["Aoqi","18 $","1"]]} pour une liste à lire en colonnes
  {"type":"chart","title":"Bureaux livrés","unit":"bureaux","items":[{"label":"Aoqi","value":124},{"label":"Ofitech","value":73}]} pour comparer des quantités. value est un nombre, sans symbole.
  {"type":"steps","items":["...","..."]} pour une marche à suivre
  {"type":"tip","text":"..."} pour un conseil
- Choisis la forme la plus claire : un graphique pour des quantités à comparer, un tableau pour une liste, des chiffres clés pour deux à quatre nombres, des étapes pour une marche à suivre.
- Commence toujours par un bloc text. Deux à quatre blocs en tout.`;

function say(text: string): { blocks: AnswerBlock[] } {
  return { blocks: [{ type: "text", text }] };
}

export async function askAssistant(question: string, context: string): Promise<{ blocks: AnswerBlock[] }> {
  if (!openSession((await cookies()).get(sessionCookie)?.value)) return say("Ta session a expiré. Reconnecte-toi.");
  const parsed = askInput.safeParse({ question, context });
  if (!parsed.success) return say(parsed.error.issues[0]?.message ?? "Question refusée.");
  const known = localAnswer(parsed.data.question, parsed.data.context);
  if (known) return { blocks: known };
  const key = process.env.OPENAI_API_KEY;
  if (!key) return say("L'assistant n'est pas encore branché sur ce poste.");

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      signal: AbortSignal.timeout(30000),
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: `Contexte (JSON) :\n${parsed.data.context}\n\nQuestion : ${parsed.data.question}` },
        ],
      }),
    });
    if (!response.ok) {
      console.error(`Assistant : OpenAI a répondu ${response.status}`);
      if (response.status === 401) {
        return say("La clé OpenAI de ce poste est refusée. Les questions proposées ont une réponse, une question libre non.");
      }
      return say("Je n'ai pas pu répondre cette fois. Réessaie dans un moment.");
    }
    const payload = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    const answer = assistantAnswer.safeParse(JSON.parse(payload.choices?.[0]?.message?.content ?? "{}"));
    if (!answer.success) return say("Je n'ai pas su mettre ma réponse en forme. Reformule ta question.");
    return { blocks: answer.data.blocks };
  } catch (error) {
    console.error("Assistant :", error);
    return say("Je n'ai pas pu répondre cette fois. Réessaie dans un moment.");
  }
}
