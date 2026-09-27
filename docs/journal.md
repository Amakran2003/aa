# Journal

Une entrée par tranche livrée. La date, ce qui est en place, ce qui ne l'est pas.

## 2026-09-27 — Lien, budget, une carte

Le départ demande le lien et le budget total. Le fil reste en haut : d'abord la lecture, puis une carte « Voici le produit ». Les modèles proches arrivent dans cette carte, sans le décompte des sites. Ensuite le champ du bas est un message. Le budget n'est pas en base. Le repère d'étape à gauche n'est pas là.

## 2026-09-27 — Fil, trois marchés, budget

La lecture s'affiche comme une discussion : le lien, la fiche, puis Made-in-China, Alibaba et DHgate. Alibaba et DHgate répondent encore que la liste n'est pas arrivée en HTTP. Après la recherche, l'assistant demande le budget total. Le montant reste dans le fil, pas en base. Le repère d'étape à gauche n'est pas là. Le plafond par pièce non plus.

## 2026-09-27 — Budget et étapes, sur le papier

Le fil d'étapes et les trois questions de budget sont dans `docs/planning/etapes.md`. L'enveloppe est le budget total moins la part mise de côté. Le prix usine max attend une quantité écrite et des cases remplies. Rien de ce rail n'est à l'écran. La tranche 2, le marché, n'est pas finie.

## 2026-09-27 — Modèles similaires, toutes usines

Modèles similaires mélange Keno et les autres usines, le même bureau, prix compris. Autres produits à explorer garde le reste, tous fournisseurs. Le prix est plus gros. Le champ se vide après le lien. Le bouton Étape suivante est affiché, il ne change pas encore d'étape.

## 2026-09-27 — Postgres, Redis, MinIO, worker

Une fiche lue est enregistrée dans Postgres, le HTML part dans MinIO, et Redis la ressert. La recherche et l'appel au modèle partent dans le worker (`pnpm worker`), pas dans la requête. La segmentation des gammes n'est pas encore posée.

## 2026-09-27 — Volet retenu

La comparaison garde le volet étroit à droite. Les autres présentations sont retirées. Chaque offre affiche le logo de son site. La segmentation des gammes n'est pas encore posée.

## 2026-09-27 — Domaines et coins ABK

Le métier est rangé par domaine : auth, fiche. L'écran est découpé en composants. Les fenêtres ont le rayon carte ABK, les boutons le rayon bouton. La grille ABK est en fond, légère. Le verre reste.

## 2026-09-27 — Cinq présentations

Cinq pastilles, A à E, changent la façon d'afficher le produit comparé : volet court, bandeau, dans la liste, face à face, épingle. Le design ABK reste. La segmentation des gammes n'est pas encore posée.

## 2026-09-27 — Produit à droite

Un modèle proche ou une autre usine s'ouvre à droite, dans la même page, avec la même fiche. La fiche de départ reste à gauche. Ouvrir en grand la remplace. Alibaba et DHgate ne rendent toujours pas leur HTML. La segmentation des gammes n'est pas encore posée.

## 2026-09-27 — Autres usines

Une fiche bureau Made-in-China lance deux recherches HTTP : poste quatre moteurs, et bureau simple deux moteurs. Les cartes à un moteur, ou sous 100 kg quand la charge est écrite, ne s'affichent pas. Alibaba et DHgate collés dans le champ répondent que la page n'a pas été envoyée. Pas de proxy, pas de Browserless.

## 2026-09-27 — Ville de l'usine

La pastille lieu lit la page usine en HTTP. Pour Keno : Foshan, Guangdong, Chine. Si la ville est absente, la province et Chine restent. Pas encore de recherche du même bureau chez d'autres usines.

## 2026-09-27 — Usine en pastilles

Le sérieux de l'usine s'affiche en pastilles : Diamond depuis 2021, note, rôle, lieu, audit. Les phrases anglaises ne sont plus listées. Le volet des caractéristiques se ferme quand la fiche défile. Pas encore de recherche du même bureau chez d'autres usines.

## 2026-09-27 — Photos, volets, carousel

La fiche montre la photo, les caractéristiques et l'usine dans des volets, et les autres modèles en carousel avec lien. Si `OPENAI_API_KEY` est dans `.env.local`, les photos sont décrites pour séparer les modèles proches des autres produits. Pas encore de recherche hors de l'usine.

## 2026-09-27 — Lecture HTML d'une fiche

Analyser télécharge la page en HTTPS et affiche prix, MOQ, carton, certificats, usine et autres modèles. Testé sur le HTML Keno. Pas de Browserless. Pas encore de recherche du même produit chez d'autres usines.

## 2026-09-27 — Champ produit, thème clair

Après connexion, un champ au centre. On colle un lien, Analyser ouvre la fiche à l’écran. Titre, prix, MOQ, dimensions, poids et matière restent vides : aucune lecture n’est branchée.

## 2026-09-27 — Page de connexion

`/connexion` reprend les tokens ABK, sans le logo. E-mail et mot de passe, deux comptes dans `AA_ACCOUNTS`, pas de Google. La session est un cookie signé. Sans `AUTH_SECRET` et sans comptes, la page le dit et n'ouvre rien.

Pas encore de fiche produit.

## 2026-09-27 — Dépôt, règles, arborescence

Le plan métier est dans `docs/plan.md`. L'arborescence est posée : `apps/web`, `packages/contracts`, `packages/core`, `packages/db`, Postgres et Redis dans Docker. Les règles Cursor et le hook git sont en place. Le livre et le catalogue ne sont pas dans le dépôt public.

Pas encore d'écran. La tranche 1 (saisir un produit, scraper la fiche) n'est pas commencée.
