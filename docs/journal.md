# Journal

Une entrée par tranche livrée. La date, ce qui est en place, ce qui ne l'est pas.

## 2026-09-28 — Terminer l'onboarding, et les autres produits

Pendant la démo, « Terminer l'onboarding » coupe le récit. À la fin, le champ du lien prend le focus et le bonhomme dit de rentrer le sien. La recherche qui suit n'est plus limitée aux bureaux : un pyjama retrouve les annonces du même genre, dont Alibaba.

## 2026-09-28 — La démo laisse le temps de lire, fiches déjà remplies

La démo écrit d'abord le lien et le budget. Chaque commentaire reste plusieurs secondes. Les fiches des usines de la démo sont posées tout de suite, avec leurs prix, leur livraison quand Alibaba l'a donnée, et le prix de vente conseillé.

## 2026-09-28 — Démo d'un bureau, jusqu'au transport

Sur la page d'entrée, Démo charge le bureau Keno déjà lu et les usines dont la livraison est connue. Rien n'est rescrapé. Le bonhomme raconte le produit, les usines, la fiche, les questions, puis les fournisseurs, les messages, la simulation et le transport. Le coin de sa bulle est en bas à droite, et s'inverse quand il passe à droite.

Pas encore là : la démo ne garde pas les choix en base. Le devis du transitaire n'est pas encore là.

## 2026-09-28 — Une question ne saute plus l'étape

Les questions et les réponses restent dans le fil, au-dessus de la suite : recherche finie, fournisseurs, messages, simulation, transport. Descendre vers une réponse ne fait plus apparaître la fenêtre « Choisir qui contacter ». Cette fenêtre s'ouvre quand on arrive soi-même sur la suite.

Le bonhomme se cale à gauche de la colonne, plus contre le bord de l'écran. Quand une fiche est ouverte à droite, le champ de question reste sous le fil, dans la même colonne.

Pas encore là : les choix, les messages et la simulation ne sont toujours pas gardés en base.

## 2026-09-28 — Boarding : le bonhomme commente l'écran

Un bonhomme à gauche du fil commente l'endroit visible, une phrase à la fois. Le halo autour de la zone pulse sans s'arrêter tant que le commentaire est là. Au départ il présente le produit, puis les usines, puis il demande de cliquer une carte. Au clic, il passe à droite et présente la fiche ouverte. Ensuite il montre les questions, puis le champ pour écrire. Plus bas, chaque étape a sa phrase, une fois. Remonter ne la répète pas. Un clic sur le bonhomme la relance. D'accord ferme la bulle. Rien ne bloque l'écran.

Pas encore là : le boarding est retenu le temps de l'onglet, un nouvel onglet le rejoue. Les choix, les messages et la simulation ne sont toujours pas gardés en base.

## 2026-09-28 — Réponses en tableau et en graphique, questions selon l'écran

L'assistant peut répondre en tableau et en barres, en plus des chiffres, de la comparaison, des étapes et du conseil. Le modèle choisit la forme. Les questions proposées en montrent une chacune : tableau des usines, graphique des quantités, répartition du coût, comparaison.

Les pastilles suivent l'endroit visible à l'écran. Arrivé au transport, remonter sur les usines remet les questions des usines.

Pas encore là : une question libre dépend de la clé OpenAI. Les questions proposées, non.

## 2026-09-28 — Voir les offres, et l'assistant sans la clé refusée

« Voir les offres » ferme la fenêtre et remonte à « Les meilleurs prix ». Avant, la fenêtre se fermait et la page restait en bas.

Les questions proposées ont une réponse à partir du dossier, sans appeler OpenAI : MOQ, usine sérieuse, comparaison, échantillon, DDP, transitaire. Une question libre tombe encore sur la clé, qui est refusée (401).

Vérifié dans le navigateur : le bouton ramène aux trois meilleurs prix, et « C'est quoi le MOQ ? » répond « 10 Sets » pour la fiche Keno.

## 2026-09-28 — Plus d'usines Alibaba, pop-up en bas, prix conseillé, assistant en blocs

L'écran ne cite plus le livre. La recherche Alibaba lit trois pages, soit environ 140 fiches, et garde pour chaque usine : vérifié, Trade Assurance, note, taux de réponse, effectif et le lien pour écrire. Une fiche Alibaba ouverte reprend toutes ses caractéristiques (matière, usage, style) et le carton même quand il n'est que dans les données de la page. Une recherche déjà faite avant ce jour est relancée une fois. Les fournisseurs sont triés Alibaba d'abord, une ligne par usine, les moins chères en tête : 10 à l'écran, un bouton pour la suite. Sur la fiche Keno, 42 usines sérieuses, 56 au total. Les trois premières se cochent seules.

La fenêtre « la recherche est finie » n'apparaît plus tout de suite. Elle s'ouvre quand on arrive en bas, sur le message de fin de recherche.

Le budget met de côté 30 % tout seul (3 000 € sur 10 000 €), et le champ se change. La simulation propose un prix de vente qui garde au moins 30 % net : 109 € pour le bureau Aoqi à 56 € rendu, avec 124 bureaux dans les 7 000 €. La marge s'affiche à ce prix, et se recalcule si on tape le sien.

L'assistant, en bas, propose trois questions selon l'étape, dans des pastilles qui apparaissent. Une question reçoit une réponse en blocs : phrase, chiffres, tableau de comparaison, étapes ou conseil. Il ne parle qu'avec les chiffres du dossier.

Vérifié dans le navigateur : fenêtre seulement après le défilement, 10 usines puis « voir 10 autres (46 en tout) », badges Trade Assurance et note, réserve à 3 000 €, prix conseillé 109 €, 124 bureaux. Vingt-trois tests passent.

Pas encore là : la clé OpenAI du poste est refusée (réponse 401), donc l'assistant dit qu'il n'a pas pu répondre. Il faut une clé valable dans `.env.local`. DHgate et Made-in-China n'ont pas encore le même niveau de détail qu'Alibaba. Les choix et les messages ne sont toujours pas gardés en base.

## 2026-09-28 — Parcours guidé : fournisseurs, messages, simulation

Le fil devient un parcours en cinq étapes : Produit, Fournisseurs, Messages, Simulation, Transport. Un repère en haut du fil suit l'étape en cours et ramène aux étapes faites. Chaque étape arrive comme un message de l'assistant, avec un seul bouton pour la suite. Quand la recherche est finie, une fenêtre dit combien d'usines passent les critères du livre et propose de les choisir.

Fournisseurs : les usines du même type, avec au moins 2 ans sur le site, sont cochées d'avance, trois au plus. On en coche cinq au maximum. Leur fiche s'ouvre en arrière-plan, deux à la fois, sans relancer de recherche. Chaque ligne montre les paliers de prix, le MOQ, le rôle, le prix de l'échantillon et l'échantillon livré en France quand Alibaba calcule la livraison. Un cadre vendu sans plateau est signalé.

Messages : un message en anglais par usine, tiré du livre (échantillon, EXW et DDP France à 100, 300 et 500 pièces, carton, CBM, code HS, certifications, délai, 30 % puis 70 %). Le budget n'y entre pas. On le modifie, on le copie, on ouvre la page de l'usine, on le marque envoyé.

Simulation : « Avec 10 000 €, chez Ningbo Huasheng, tu ramènes 87 bureaux livrés en France », avec 113,64 € par bureau, décomposés en usine, livraison et TVA. L'usine qui ramène le plus est choisie d'avance, les autres se comparent d'un clic. Budget, mis de côté et prix de vente se changent sur place. Trois quantités, comme dans le livre : l'échantillon, ce que le budget paie, le palier demandé. La marge par bureau s'affiche si un prix de vente est tapé. Chaque chiffre dit sa source. Une usine sans livraison affichée n'a pas de fret inventé. Transport : la packing list du lot pour le transitaire.

La livraison vient du calcul qu'Alibaba fait lui-même vers la France : 30,77 € pour un bureau Huasheng, 58,61 € pour les 2 pièces minimum d'Ofitech, 45 à 50 jours, droits non compris. Les fiches Alibaba s'ouvrent en France et en euros, et la page de vérification à curseur n'est plus prise pour une fiche. Droits : 0 % pour un meuble de bureau en métal (code 9403), à confirmer. Animations : entrée des étapes, repère qui se remplit, fenêtre, barre, compteur, confettis au résultat et quand tous les messages sont partis. Elles se coupent si le système demande moins de mouvement.

Vingt et un tests tournent avec `pnpm test`. Vérifié dans le navigateur, sur ordinateur et sur téléphone, avec la fiche Keno et 10 000 € : 87 bureaux Huasheng, 73 Ofitech, 61 avec 3 000 € de côté, échantillon Huasheng 117,90 €, marge de 231,16 € par bureau à 400 €.

Pas encore là : les usines choisies, les messages envoyés et les champs de la simulation ne sont pas gardés en base, ils se perdent au rechargement. Rien ne part tout seul, le texte se copie. La livraison d'échantillon n'est lue que sur Alibaba, pour une partie des bureaux, et pour la commande minimum seulement : ce n'est pas un devis de lot. Le devis du transitaire arrive avec la tranche suivante. Les blocs budget et marge case par case de la tranche 3 sont sortis du fil, gardés pour cette tranche. Le serveur de développement ne voit pas toujours les changements de fichiers sur le disque externe : il faut parfois le relancer.

## 2026-09-28 — Marge avec ses cases vides, fiches gardées en base

Les fiches restent en base. Un autre PostgreSQL 18, installé sur le Mac, répondait sur le port 5432 à la place de celui de Docker : aucune fiche n'avait jamais été enregistrée, elles ne vivaient que 24 heures dans Redis. Le Postgres de Docker passe sur le port 5434, les 29 fiches encore en cache y sont recopiées, et une fiche vidée de Redis se relit depuis la base. Une écriture ratée s'écrit maintenant dans le terminal.

Après la fiche, l'assistant pose le budget et la marge. Le budget total tapé au départ est gardé. On tape la part mise de côté, le prix de vente visé, et dans les réglages du projet les cotisations, les frais de paiement, le seuil de marge et, si on veut, un coût rendu maximum par pièce. Rien n'est prérempli. L'enveloppe, c'est le budget total moins la part mise de côté.

La marge a une case par poste. La quantité vient du MOQ de la fiche ou se tape. Le prix usine est lu sur la fiche, au palier de la quantité, converti au taux BCE. Le volume et le poids du lot viennent du carton de la fiche. Fret jusqu'au port, port → adresse, commissionnaire en douane, droits et TVA restent vides tant qu'il n'y a pas de devis. Chaque case dit d'où vient son chiffre et qui l'a saisi. Le prix usine maximum par pièce n'apparaît que lorsque la quantité et ces cinq cases sont remplies. La ligne passe hors budget dès que le déjà chiffré dépasse l'enveloppe, et au-dessus du coût rendu maximum dès que le minimum par pièce le dépasse. Elle passe au vert seulement quand tout est rempli, dans l'enveloppe et au-dessus du seuil.

Huit tests tournent avec `pnpm test`, dont le bureau au MOQ 20 à 70 € avec 500 € de fret, refusé. Vérifié dans le navigateur : une fiche avec carton, une fiche sans carton qui reste incomplète, un fret saisi qui recalcule sans toucher aux cases encore vides.

Pas encore là : l'incoterm qui coche les cases et le devis du transitaire (tranche 4). Les droits et la TVA se tapent à la main, sans code HS. La marge est en euros seulement. On ne choisit pas encore plusieurs offres : la marge porte sur le produit affiché. Seul le dernier auteur de chaque case est gardé, pas l'historique. Le PostgreSQL 18 du Mac tourne toujours.

## 2026-09-27 — Fiche repensée, devise au choix

Sur PC, la fiche tient en deux colonnes : photos à gauche, prix et cotes à droite, puis usine et caractéristiques. En dessous, « Les meilleurs prix » montre trois modèles, le reste du classement se déplie. « Tous les modèles trouvés » remplace les quatre rangées : un seul tri du moins cher au plus cher, des filtres Même usine, Made-in-China, Alibaba, DHgate, six modèles à la fois, les produits d'un autre type cachés par défaut. Un même modèle ne s'affiche plus deux fois. La page fait deux écrans au lieu de cinq. Les cartes Made-in-China retrouvent leur photo. Les cotes s'écrivent « 65 × 30 × 20 cm » et « 20 kg ».

Tous les prix passent par une devise choisie en haut de la fiche : euro par défaut, dollar ou yuan. Les taux viennent de la BCE, leur date est affichée, et le prix d'origine reste écrit en petit. Le classement compare les prix après conversion.

Pas encore là : la devise est mémorisée dans le navigateur, pas dans un réglage du projet en base. Le budget n'est pas en base. La marge n'est pas commencée.

## 2026-09-27 — Les moins chers qui conviennent, paliers, photos

La fiche produit affiche « Les moins chers qui conviennent » : les modèles du même type trouvés sur Made-in-China, Alibaba, DHgate et chez l'usine, classés du prix affiché le plus bas au plus haut, puis par MOQ et par ancienneté. Les prix DHgate en euros sont convertis en dollars au taux BCE du jour, et la date est écrite. Une fiche ouverte montre les prix par quantité quand la page les donne (Alibaba : 1 à 9, 10 à 99, 100 à 499, 500 et plus ; DHgate : 1 à 13, 14 et plus), et toutes ses photos, cotes comprises, en grand avec vignettes. Les photos sont entières, pas recadrées. Une photo que le site refuse est retirée. Vérifié dans le navigateur, sur ordinateur et au format téléphone : aucune page ne déborde.

Pas encore là : le classement compare le prix « à partir de », pas le prix à une quantité choisie. Le budget n'est pas en base. La marge n'est pas commencée.

À régler plus tard, côté design : les titres DHgate sont coupés par le site (« ... ») ; le modèle DHgate reste souvent absent. Réglés depuis : la barre du panneau est opaque, les cartes ont la même hauteur.

## 2026-09-27 — Ancienneté sur Alibaba et DHgate

La fiche ouverte reprend l'ancienneté écrite sur la page (Alibaba : « Fournisseur depuis 10 ans », DHgate : « Fournisseur depuis 2012 »), le rôle, la note, la ville, le carton, le poids et le modèle quand ils sont écrits. Un lien « Ouvrir la fiche » mène à la page du site. Les photos coupées et les débordements restent pour plus tard. Le budget n'est pas en base. La marge n'est pas commencée.

## 2026-09-27 — Fiche Alibaba et DHgate au clic

Ouvrir une carte Alibaba ou DHgate lit la page dans Chrome. Le prix, le minimum et la photo s'affichent. Le même lien déjà lu n'est pas recherché à nouveau. Carton, poids et modèle restent absents quand la page ne les donne pas. À régler plus tard : photos du carousel coupées, titres trop longs, débordements. Le budget n'est pas en base. La marge n'est pas commencée.

## 2026-09-27 — Alibaba et DHgate à l'écran

Une fiche déjà lue est recherchée à nouveau si Alibaba ou DHgate n'ont pas abouti. Leurs cartes ont leur propre rangée, avec le logo du site. Made-in-China ne remplit plus toute la liste. Le budget n'est pas en base. La marge n'est pas commencée.

## 2026-09-27 — Recherche plus courte

L'assistant dit « Recherche sur Made-in-China », « Recherche sur Alibaba », « Recherche sur DHgate », et pose le logo du site sur chaque carte. Les offres sont enregistrées sans attendre la description des photos. Une erreur de lecture reste dans le fil. Le budget n'est pas en base. La marge n'est pas commencée.

## 2026-09-27 — MOQ DHgate

Chaque carte DHgate reprend le minimum écrit sur la page (`1 Piece`, `100 Pieces`). S'il n'est pas écrit, la case reste vide. Le budget n'est pas en base. La marge n'est pas commencée.

## 2026-09-27 — Alibaba et DHgate

Une recherche de bureau ramène des cartes Alibaba et DHgate avec titre, prix, image et fournisseur. Alibaba passe par sa recherche JSON. DHgate passe par Chrome installé sur le Mac, sans enregistrer la page. Le budget n'est pas en base. La marge n'est pas commencée.

## 2026-09-27 — Produit ouvert, au-dessus sur petit écran

Ouvrir un modèle depuis la conversation le pose à droite sur un grand écran, au-dessus sur un écran étroit. Fermer reste collé en haut. « Ouvrir en grand » n'est plus là : « Passer à ce produit » met cette fiche à la place du produit du fil, et les modèles proches restent affichés. Le budget n'est pas en base. Le repère d'étape à gauche n'est pas là.

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
