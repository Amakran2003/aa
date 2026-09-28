import type { AnswerBlock } from "@aa/contracts";

type Factory = {
  usine?: string;
  ancienneteAns?: number | null;
  verifiee?: boolean | null;
  tradeAssurance?: boolean | null;
  note?: number | null;
  prixAffiche?: string | null;
  moq?: string | null;
  serieuse?: boolean;
  cochee?: boolean;
  cadreSeul?: boolean;
};

type Chosen = {
  usine?: string;
  role?: string | null;
  simulation?:
    | {
        estimation?: boolean;
        quantiteRamenee?: number;
        coutRenduParPiece?: number;
        echantillonLivre?: number;
        prixDeVenteConseille?: number;
        dont?: { usine?: number; livraison?: number; tva?: number };
      }
    | string;
};

type Context = {
  produit?: { titre?: string | null; prix?: string | null; moq?: string | null; carton?: string | null; poids?: string | null };
  budget?: { total?: number | null; misDeCote?: number | null };
  usinesProposees?: Factory[];
  usinesChoisies?: Chosen[];
};

const euros = (value: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);

const cents = (value: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(value);

function ready(chosen: Chosen) {
  return typeof chosen.simulation === "object" && chosen.simulation ? chosen.simulation : null;
}

function has(question: string, ...words: string[]): boolean {
  return words.some((word) => question.includes(word));
}

export function localAnswer(question: string, raw: string): AnswerBlock[] | null {
  let context: Context;
  try {
    context = JSON.parse(raw) as Context;
  } catch {
    return null;
  }
  const q = question.toLowerCase();
  const product = context.produit ?? {};
  const proposed = context.usinesProposees ?? [];
  const chosen = context.usinesChoisies ?? [];
  const serious = proposed.filter((factory) => factory.serieuse);
  const picked = chosen.length > 0 ? chosen : proposed.filter((factory) => factory.cochee);

  if (has(q, "moq")) {
    return [
      {
        type: "text",
        text: "Le MOQ, c'est la plus petite quantité que l'usine accepte de vendre. En dessous, elle ne fait pas de prix, sauf parfois pour un échantillon.",
      },
      {
        type: "stats",
        items: [
          { label: "MOQ de ta fiche", value: product.moq || "Absent de la fiche" },
          { label: "Prix affiché", value: product.prix || "Absent" },
        ],
      },
    ];
  }

  if (has(q, "tableau")) {
    const rows = (serious.length > 0 ? serious : proposed).slice(0, 6).map((factory) => [
      factory.usine ?? "Usine",
      factory.prixAffiche ?? "—",
      factory.moq ?? "—",
      factory.ancienneteAns != null ? `${factory.ancienneteAns} ans` : "—",
    ]);
    if (rows.length === 0) return [{ type: "text", text: "La recherche n'a pas encore ramené d'usines." }];
    return [
      { type: "text", text: "Les usines du même type, les moins chères en premier. Le prix est celui affiché sur la fiche." },
      { type: "table", columns: ["Usine", "Prix affiché", "MOQ", "Ancienneté"], rows },
    ];
  }

  if (has(q, "graphique", "répartition", "repartition")) {
    if (has(q, "répartition", "repartition")) {
      const best = (chosen as Chosen[]).map((item) => ({ item, sim: ready(item) })).find((row) => row.sim?.dont);
      const parts = best?.sim?.dont;
      if (!best || !parts) return [{ type: "text", text: "La répartition apparaît à l'étape Simulation, pour une usine dont la livraison est chiffrée." }];
      return [
        { type: "text", text: `Ce qui compose le coût rendu d'un bureau chez ${best.item.usine ?? "l'usine"}. Estimation.` },
        {
          type: "chart",
          title: "Coût d'un bureau",
          unit: "€",
          items: [
            { label: "Usine", value: parts.usine ?? 0 },
            { label: "Livraison", value: parts.livraison ?? 0 },
            { label: "TVA", value: parts.tva ?? 0 },
          ],
        },
      ];
    }
    const bars = (chosen as Chosen[])
      .map((item) => ({ label: item.usine ?? "Usine", value: ready(item)?.quantiteRamenee }))
      .filter((item): item is { label: string; value: number } => typeof item.value === "number" && item.value > 0);
    if (bars.length < 2) {
      return [{ type: "text", text: "Le graphique compare les usines dont la livraison est chiffrée. Il en faut au moins deux, à l'étape Simulation." }];
    }
    return [
      { type: "text", text: "Nombre de pièces que ton enveloppe ramène, livrées, chez chaque usine. Estimation." },
      { type: "chart", title: "Pièces livrées", unit: "pièces", items: bars },
    ];
  }

  if (has(q, "sérieuse", "serieuse", "sérieux")) {
    return [
      {
        type: "text",
        text: `${serious.length} usine${serious.length > 1 ? "s ont" : " a"} au moins 2 ans sur le site et vend le même type de produit. C'est le premier filtre.`,
      },
      {
        type: "steps",
        items: [
          "Au moins 2 ans sur le site.",
          "Fabricant, pas seulement une société de négoce.",
          "Profil vérifié et Trade Assurance, quand le site l'affiche.",
          "Le même type de produit que le tien.",
        ],
      },
    ];
  }

  if (has(q, "coch")) {
    const names = picked.map((factory) => ("usine" in factory ? factory.usine : "")).filter(Boolean);
    return [
      {
        type: "text",
        text:
          names.length > 0
            ? `${names.join(", ")} : les moins chères parmi les usines sérieuses. Tu peux en décocher et en choisir d'autres, cinq au plus.`
            : "Les cases cochées sont les usines sérieuses les moins chères. Tu peux les changer.",
      },
    ];
  }

  if (has(q, "compar")) {
    const rows = picked.filter((item) => ready(item as Chosen));
    if (rows.length === 0) {
      return [{ type: "text", text: "Ouvre l'étape Simulation : la comparaison se fait sur les usines dont la livraison est chiffrée." }];
    }
    const list = rows as Chosen[];
    return [
      { type: "text", text: "Comparaison sur ton budget, livraison et TVA comprises. Ce sont des estimations." },
      {
        type: "compare",
        columns: list.map((item) => item.usine ?? "Usine"),
        rows: [
          { label: "Bureaux livrés", values: list.map((item) => String(ready(item)?.quantiteRamenee ?? "—")) },
          { label: "Coût par bureau", values: list.map((item) => (ready(item)?.coutRenduParPiece != null ? cents(ready(item)!.coutRenduParPiece!) : "—")) },
          { label: "Échantillon livré", values: list.map((item) => (ready(item)?.echantillonLivre != null ? cents(ready(item)!.echantillonLivre!) : "—")) },
        ],
      },
    ];
  }

  if (has(q, "fabricant", "négoce", "negoce")) {
    return [
      {
        type: "text",
        text: "Un fabricant produit lui-même. Une société de négoce revend la production d'une autre usine : un intermédiaire de plus, souvent un prix plus haut.",
      },
      { type: "tip", text: "Quand les deux existent au même prix, écris d'abord au fabricant." },
    ];
  }

  if (has(q, "échantillon", "echantillon")) {
    return [
      {
        type: "text",
        text: "Une seule pièce sert à juger la qualité et la vitesse de l'usine avant de commander le lot. C'est le seul achat à faire maintenant.",
      },
      {
        type: "tip",
        text: "Demande si ce prix est déduit de la future commande. La livraison d'une pièce est chère : un transitaire groupera plusieurs échantillons.",
      },
    ];
  }

  if (has(q, "répond pas", "repond pas", "pas de réponse", "pas de reponse", "silence")) {
    return [
      {
        type: "steps",
        items: [
          "Attends deux jours ouvrés en Chine.",
          "Renvoie le même message, plus court.",
          "Sans réponse quatre jours après, passe à l'usine suivante.",
        ],
      },
    ];
  }

  if (has(q, "écrire", "ecrire", "alibaba")) {
    return [
      {
        type: "steps",
        items: [
          "Copie le message.",
          "Ouvre la page de l'usine.",
          "Colle-le dans la messagerie du site.",
          "Reviens ici et marque-le envoyé.",
        ],
      },
    ];
  }

  if (has(q, "nombre", "pourquoi ce")) {
    const best = (chosen as Chosen[]).find((item) => ready(item));
    const sim = best ? ready(best) : null;
    if (!sim || sim.quantiteRamenee == null) {
      return [{ type: "text", text: "Le nombre apparaît à l'étape Simulation, pour chaque usine dont la livraison est affichée." }];
    }
    return [
      {
        type: "text",
        text: `${sim.quantiteRamenee} pièces, c'est le plus grand lot qui tient dans ton enveloppe, au palier de prix de ${best?.usine ?? "l'usine"}.`,
      },
      {
        type: "stats",
        items: [
          { label: "Coût rendu", value: cents(sim.coutRenduParPiece ?? 0), hint: "Usine, livraison et TVA" },
          {
            label: "Enveloppe",
            value: context.budget?.total != null ? euros(context.budget.total - (context.budget.misDeCote ?? 0)) : "—",
          },
        ],
      },
    ];
  }

  if (has(q, "baisser", "moins cher")) {
    return [
      {
        type: "steps",
        items: [
          "Monter en quantité : le palier d'usine baisse.",
          "Demander un devis à un transitaire : il est souvent moins cher que la livraison à la pièce.",
          "Garder la réserve de côté seulement pour l'entrepôt et les imprévus.",
        ],
      },
    ];
  }

  if (has(q, "bon choix", "ce produit")) {
    return [
      {
        type: "text",
        text: product.titre
          ? `${serious.length} usines sérieuses vendent ce type de produit. Le choix se joue sur le coût livré, pas sur le prix d'usine seul.`
          : "Colle d'abord un lien de fiche.",
      },
      {
        type: "stats",
        items: [
          { label: "Prix affiché", value: product.prix || "Absent" },
          { label: "MOQ", value: product.moq || "Absent" },
          { label: "Carton", value: product.carton || "Absent" },
        ],
      },
    ];
  }

  if (has(q, "ddp")) {
    return [
      {
        type: "text",
        text: "DDP veut dire livré chez toi, droits et TVA compris dans le prix du transporteur. EXW, c'est le prix sortie d'usine : le transport et la douane restent à ta charge.",
      },
    ];
  }

  if (has(q, "transitaire")) {
    return [
      {
        type: "steps",
        items: [
          "Cherche « freight forwarder » et « DDP France » sur Alibaba.",
          "Garde ceux qui ont 4 à 5 ans, un profil vérifié, et un port dans le Guangdong ou le Zhejiang.",
          "Envoie-leur la liste de l'étape Transport : quantité, carton, poids, trajet, DDP par bateau.",
        ],
      },
    ];
  }

  if (has(q, "envoyer au transitaire", "packing", "liste", "envoyer pour")) {
    return [
      {
        type: "text",
        text: "La liste est à l'étape Transport : quantité, dimensions du carton, volume, poids, port de départ, adresse d'arrivée, et DDP par bateau.",
      },
    ];
  }

  return null;
}
