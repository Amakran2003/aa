# Étapes à l'écran, et le budget

Le pipeline complet reste dans `docs/plan.md` (idée, fiche, simulation, décision, fournisseurs, message, envoi). Ici, c'est ce que l'écran montre, et comment le budget entre dans le calcul.

L'écran reste une discussion. L'assistant guide : il pose une étape à la fois, et chaque étape finit par un seul bouton qui mène à la suivante. L'utilisateur ne cherche rien sous la page.

## Ce que l'écran montre

En haut du fil, un repère d'étapes : Produit, Fournisseurs, Messages, Simulation, Transport. L'étape en cours est marquée. Une étape faite se clique et ramène à son bloc. Une étape future ne se clique pas.

Chaque étape arrive comme un message de l'assistant : une phrase courte, puis un bloc. Le bouton du bas du bloc dit ce qui vient ensuite. Les blocs d'avant restent dans le fil.

## Les étapes

1. **Produit** — le départ demande le lien et le budget total. La fiche s'affiche, puis les meilleurs prix sur Made-in-China, Alibaba et DHgate. Quand la recherche est finie, une fenêtre dit combien d'usines passent les critères du livre et propose de les choisir.
2. **Fournisseurs** — les usines qui passent les critères du livre sont cochées d'avance, trois au plus : même type de produit, au moins 2 ans sur le site. On en coche cinq au maximum, pour ne pas écrire pour rien. Chaque fiche s'ouvre en arrière-plan : paliers de prix, MOQ, rôle (fabricant ou négoce), prix de l'échantillon et sa livraison vers la France quand le site la donne. Un cadre vendu sans plateau est signalé.
3. **Messages** — un message par usine choisie, en anglais, tiré du livre : un échantillon, les prix EXW et DDP France à 100, 300 et 500 pièces, carton, poids, CBM et code HS, certifications, délai, paiement 30 % puis 70 %. Le budget réel n'y entre jamais. On copie, on ouvre la page de l'usine, on marque envoyé. Rien ne part tout seul.
4. **Simulation** — la réponse en une phrase : combien de bureaux le budget ramène livrés en France, et à quel prix pièce. Voir « Simulation » plus bas.
5. **Transport** — la packing list du lot (cartons, volume, poids) pour le transitaire. Le devis du transitaire arrive dans une tranche suivante.

## Budget — ce qu'on demande

Le départ demande le budget total, et seulement lui. La simulation propose deux champs de plus, jamais préremplis avec le scénario bureau :

| Champ | Sens |
|---|---|
| Mis de côté | Entrepôt, voiture, tout ce qui n'est pas la marchandise rendue. Vide veut dire zéro : tout le budget sert à ramener les produits |
| Prix de vente visé | Facultatif. Sans lui, pas de marge affichée |

L'enveloppe = budget total − mis de côté.

Le budget annoncé au fournisseur est un autre sujet. Le message demande des paliers de prix. Il ne recopie jamais le budget total.

## Simulation

La simulation est une estimation. Elle dit toujours d'où vient chaque chiffre, et elle ne passe jamais au vert.

Pour une usine choisie, elle prend :

- le prix usine au palier de la quantité, lu sur la fiche ;
- la livraison vers la France que le site calcule pour la commande minimum, ramenée à la pièce ;
- les droits de douane quand le produit a un taux connu (meuble de bureau en métal, code 9403 : 0 %, à confirmer avec le commissionnaire), sinon la mention « droits non chiffrés » ;
- la TVA import à 20 % sur la marchandise et la livraison.

Elle cherche la plus grande quantité dont le coût rendu tient dans l'enveloppe, palier par palier. Elle montre trois quantités, comme le livre : l'échantillon (seul achat immédiat), ce que le budget paie, et le palier demandé à l'usine (300 pièces).

Si le site ne donne pas la livraison, la simulation le dit et renvoie au message. Elle n'invente pas de fret.

La marge par pièce, si un prix de vente est tapé : prix de vente − coût rendu − cotisations − frais de paiement. Cotisations micro-entreprise 12,3 % du chiffre encaissé et paiement 1,5 % par défaut, réglables. Le livre vise au moins 25 à 30 % net.

La marge verte reste celle de la tranche transitaire : elle attend les devis, case par case, comme dit le plan.

## Ordre de construction

1. Cette page fait foi pour l'écran et pour le budget.
2. Produit, Fournisseurs, Messages, Simulation dans le fil. Transport annoncé.
3. Transitaire : la packing list part, son devis remplit les cases, la marge case par case s'en sert.
