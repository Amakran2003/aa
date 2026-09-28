# Plan — outil de sourcing et de pilotage

Document de travail pour toi et ton associé. Il fixe le premier outil à construire, le process qu’on fera évoluer, et la façon de chiffrer un produit avant d’écrire à une usine.

L'ordre de construction est dans `docs/planning/roadmap.md`. Ce qui est déjà livré est dans `docs/journal.md`.

Source métier : l’ebook *Business Halal* (texte et figures dans `ebook/`). Le cas concret de départ est la vente de bureaux, avec un budget réel de 10 000 €.

Premier dossier réel : l’échange WhatsApp avec Phoebe (Keno), bureau GS3011, dans `docs/WhatsApp Chat - Phoebe Fournisseur Chine Keno.zip`.

## 1. À quoi sert l’outil

L’outil est un CRM de sourcing partagé. Deux axes, au même niveau : le produit, et le transitaire. Un prix d’usine sans cotation de transport ne donne pas une marge.

Il sert à quatre choses, dans cet ordre :

1. Trouver un produit et lire sa fiche (prix, MOQ, dimensions, poids, volume) avant d’écrire à l’usine.
2. Trouver un transitaire et chiffrer le trajet selon l’incoterm : qui paie le fret, l’assurance, la douane, la TVA. EXW, FOB, CFR, CIF, DAP et DDP ne laissent pas les mêmes cases vides.
3. Contacter beaucoup d’usines et de transitaires, avec des messages préparés par des agents et validés par un humain, en tenant compte du décalage horaire.
4. Garder la mémoire du projet à deux : budget réel, budget annoncé, devis, relances, décision.

Les boutiques et la remontée des ventes viennent après. On ne les construit pas tant qu’un produit n’a pas une marge tenable, une usine qui répond, et un transitaire qui a chiffré le trajet.

## 2. Situation de départ

| Fait | Conséquence dans l’outil |
|---|---|
| Vente de bureaux déjà faite, environ 6 000 € de résultat à réinvestir | Le budget n’est pas celui d’un premier essai à 1 000–2 000 € décrit dans l’ebook |
| Un associé ajoute 4 000 € | Budget réel du projet : **10 000 €**, visible par vous deux |
| Les bureaux sont chers et volumineux | Le transport peut manger la marge. L’ebook déconseille l’agent en Chine qui expédie à l’unité pour le lourd et le volumineux. L’outil doit le calculer, pas le supposer |
| Les fournisseurs contactés répondent en EXW | EXW est un prix sortie d’usine. Le fret, la douane et la livraison ne sont pas dedans |
| Les usines parlent sec et filtrent les petits acheteurs | Le message et les quantités demandées s’adaptent au MOQ et au prix |
| Vous êtes deux | Un seul projet partagé, les deux peuvent agir |
| Le process va changer | Les étapes du pipeline sont des données modifiables, pas du code figé |

« 70 produits » est traité comme une **quantité d’exemple** pour un scénario bureau (70 unités), le temps de voir la marge et le volume. L’outil ajoute les références une par une. Ce n’est pas un lancement à 70 catalogues.

## 3. Maintenant, et ensuite

### Maintenant

- Un projet, deux utilisateurs, un budget réel et un budget annoncé.
- Une fiche produit lue par un navigateur (Browserless) : prix, MOQ, dimensions, poids, matière, photos, URL.
- Une simulation de marge par incoterm. Chaque devis dit ce qui est inclus (fret, assurance, droits, TVA) et ce qu’il reste à demander au transitaire.
- Une liste d’usines et une liste de transitaires. Même file de messages, mêmes scores de sérieux. Les filtres transitaire viennent du livre : verified, Trade Assurance, 4–5 ans, une part réelle d’exports vers l’Europe de l’Ouest, basé près d’un grand port (Guangdong ou Zhejiang).
- Un score usine « accessible / limite / gros poisson », et une file de messages.
- Des agents qui préparent la recherche, les brouillons et les relances. Un humain valide avant envoi.
- Un pipeline dont on peut renommer, réordonner et ajouter les étapes.

### Ensuite, quand un produit est validé

- Checklist commande : packing list, contrôle qualité, paiement 30 % puis 70 %, numéro EORI, choix mer / air.
- Une boutique par univers produit (la première : les bureaux), rattachée à l’outil.
- Les ventes de la boutique remontent dans le projet pour voir si le réassort se justifie.
- La moitié SEO de l’ebook (mots-clés, fiche, collection, maillage, netlinking) sert au moment de créer la boutique, pas avant.

Les entrepôts ne sont pas dans l’outil. On les cherche à la main. Le jour où le volume le demande, on pourra y ajouter une recherche d’entrepôts. Hors sujet aussi, tant qu’un devis usine et un devis transitaire ne sont pas là : thème Shopify, photos, marque blanche, OEM.

## 4. Stack

Next.js (App Router, TypeScript), un seul dépôt, déployé sur Vercel. La façon de découper le code vient de deux projets déjà en place, pas d’un modèle générique.

| Projet | Où | Ce qu’on en garde |
|---|---|---|
| Selmea v2 | `Perso/selmea-v2` | Monorepo pnpm. Le métier dans `packages/core`, sans HTTP. Les contrats Zod dans `packages/contracts`. Drizzle seulement dans `packages/db`. L’écran n’importe ni la base ni le métier. `docs/` fait foi. |
| Wai-Y | `Rodium/wai-i/wai-y` | Le front est déjà un Next.js (`waiy-frontend/app`). Docker pour Postgres et Redis en local. Un contrat partagé, pas deux versions du même type. |

On ne recopie pas le Nest de Selmea, ni l’Express et le Prisma de Wai-Y, ni l’infra AWS. Ici la surface HTTP, c’est Next. Le cron du matin en Chine est une route Vercel, pas un worker séparé.

```
apps/web              Next.js : pages, actions, routes. Aucun SQL.
packages/contracts    Zod, types d’écran et d’API
packages/core         marge, incoterms, pipeline. Pas de Next, pas de HTTP.
packages/db           Drizzle, seul endroit qui parle à Postgres
docker-compose.yml    Postgres et Redis locaux
docs/plan.md          le métier
```

Une page valide avec `contracts`, appelle `core`, et `core` passe par `db`. Pas de deuxième calcul de marge dans un composant.

Vercel ne vend plus sa propre Postgres ni son KV. Les équivalents du Marketplace :

| Rôle | Production | Développement |
|---|---|---|
| Données du CRM | Neon Postgres | Postgres dans Docker |
| Verrous, cache de pages scrapées | Upstash Redis | Redis dans Docker |
| Images de fiches | Vercel Blob | Dossier local `.data/blob` |
| Navigateur des agents | Browserless cloud | Browserless cloud, ou l’image Docker open source sans captcha |

Redis ne porte pas le métier. Une validation, un devis ou un budget réel vivent dans Postgres. Si Redis se vide, la file du matin se reconstruit depuis les messages déjà en base.

Drizzle a un seul schéma. En local le driver parle à Docker. En production il parle à Neon (`@neondatabase/serverless`). On ne réécrit pas les requêtes entre les deux.

Les comptes sont les nôtres : deux utilisateurs, sessions en Postgres, via Auth.js. Pas d’abonnement d’auth pour deux personnes.

Le cron Vercel réveille l’app dans la fenêtre Chine. Il lit les messages « programmés » en base. On n’ajoute pas une deuxième file tant que Postgres suffit.

On branche Neon et Upstash au premier déploiement (`vercel integration add neon` et `vercel integration add upstash`). D’ici là, `docker compose` suffit pour Postgres et Redis. Next, lui, tourne sur la machine, comme sur Vercel.

## 5. Utilisateurs

Deux comptes sur le même projet, au même niveau. Chacun voit le budget réel, les simulations et la file d’envoi. Chaque message validé, chaque changement de budget et chaque étape franchie garde le nom de celui qui l’a fait.

Le budget réel ne part jamais dans un message. Seul le texte validé part.

## 6. Le process

Le pipeline est une liste d’étapes qu’on réordonne dans l’application. Départ proposé :

1. **Idée** — nom du produit, hypothèse de prix de vente, marché (France).
2. **Fiche** — URL, champs extraits, ce qui manque (souvent le poids ou le carton).
3. **Simulation** — plusieurs routes logistiques, marge estimée, volume, trésorerie immobilisée.
4. **Décision** — on contacte, on ajuste la quantité, ou on laisse tomber.
5. **Fournisseurs** — URLs qui passent les filtres de l’ebook.
6. **Qualification** — fabricant ou société de trading, ancienneté, verified, Trade Assurance, certifications, MOQ.
7. **Message** — brouillon anglais, quantités calées sur le budget, validation humaine.
8. **Relance** — si pas de réponse dans le délai, dans une fenêtre horaire Chine.
9. **Devis** — EXW, DDP si obtenu, MOQ, délai, conditions de paiement. La simulation est recalculée avec ces chiffres, plus avec les prix de fiche.
10. **Négociation** — premier ordre réel, demande d’arrangement sur le MOQ.
11. **Échantillon** — comparaison qualité et réactivité. Les échantillons d’un même coup partent groupés chez le transitaire, comme dans l’ebook.
12. **Retenu** — un fournisseur. On ne paie rien tant que la marge recalculée n’est pas acceptée par l’un de vous deux.

Étapes déjà prévues dans la liste, activées plus tard : packing list, contrôle qualité, commande, boutique, ventes.

Une étape peut être sautée (pas d’échantillon si le fournisseur l’offre et que vous assumez le risque). Le saut est noté.

À l’écran, le départ demande le lien et le budget total. Ensuite une carte montre le produit et les modèles proches. La part mise de côté vient avec la marge. L’enveloppe qui reste est le maximum pour ramener les produits. Le détail est dans `docs/planning/etapes.md`. Le budget réel ne part pas dans un message.

## 7. Parcours d’un produit

Exemple visé : un bureau, budget réel 10 000 €, intention annoncée 30 000 à 40 000 €.

1. Tu crées le produit et tu colles l’URL de la fiche Alibaba (ou une fiche équivalente).
2. L’outil remplit la fiche : titre, prix affiché, fourchette, MOQ écrit, dimensions, poids, matière, nombre de pièces par carton si c’est écrit. Chaque champ est « lu sur la fiche » ou « absent ». Rien n’est inventé pour combler un trou.
3. S’il manque le poids ou les dimensions du carton, la simulation tourne quand même et affiche une fourchette large, avec la liste de ce qu’il faudra demander en premier message.
4. L’outil calcule le volume (m³), le poids taxable, et le coût rendu selon les routes de la section 7.
5. Vous voyez la marge sur trois lignes : le MOQ de la fiche, le lot que 10 000 € peuvent vraiment payer, et le palier annoncé (30 000 à 40 000 € pour le mobilier). Le fret au MOQ est souvent ce qui tue la ligne, pas le prix d’usine.
6. Si la fiche est déjà invendable (MOQ incompatible, volume qui fait exploser le fret, marge sous le seuil), on ne contacte pas.
7. Sinon l’agent propose une liste de fiches du même produit. Vous gardez celles qui passent les filtres. L’agent rédige un message par fournisseur. Vous validez la série. L’envoi part dans la fenêtre Chine.
8. Les réponses réinjectent EXW, DDP, MOQ et délai. La simulation remplace les estimations. Là seulement on décide d’un échantillon ou d’un premier ordre.

## 8. Simulation de marge, avant le premier message

Règle de l’ebook, reprise telle quelle : on ne paie rien tant que la marge n’est pas calculée.

Seuil de travail, réglable dans le projet : marge nette d’au moins 25–30 % après cotisations, sur un prix de vente plutôt au-dessus de 20–30 €. Un bureau est déjà au-dessus de ce prix plancher. Le point dur est le transport et la trésorerie, pas le prix psychologique.

L’imposition micro-entreprise se calcule sur le chiffre d’affaires, pas sur le bénéfice. Le taux et le plafond sont des réglages du projet, parce qu’ils bougent. L’ebook recommande la micro-entreprise pour débuter ; le choix du statut reste le vôtre, l’outil ne le décide pas.

### Estimation avant les devis

Avant tout devis, l’outil peut estimer ce que le budget ramène, à une condition : chaque chiffre dit sa source. Le prix usine vient de la fiche. La livraison vient du calcul que le site fait lui-même vers la France pour la commande minimum (Alibaba le donne pour une partie des bureaux, avec le délai et la mention « droits non compris »). Les droits viennent du tarif douanier quand le produit a un taux connu. La TVA import est de 20 %. Sans livraison affichée, l’estimation s’arrête et renvoie au message : pas de fret « raisonnable ».

Cette estimation n’est pas la marge. Elle ne passe jamais au vert. Les cases de la marge restent vides tant que le transitaire et le commissionnaire n’ont pas chiffré.

### Ce qui entre dans le coût unitaire

- Prix marchandise (EXW de la fiche, puis EXW confirmé).
- Aller jusqu’au transitaire en Chine, si ce n’est pas inclus.
- Fret international jusqu’au port français (exemple : Le Havre).
- Trajet intérieur du port jusqu’à l’adresse (exemple : Le Havre → Gennevilliers). Ligne à part. Un devis qui s’arrête au port ne remplit pas cette case.
- Commissionnaire en douane. Son honoraire est un poste, distinct des droits et de la TVA.
- Droits de douane et TVA import, dès qu’on a un code HS. Avant ça, une case « douane non chiffrée » empêche d’afficher une marge nette comme si elle était sûre.
- Contrôle qualité, si la commande le justifie (SGS, V-Trust, Bureau Veritas, ou un inspecteur trouvé sur Alibaba).
- Emballage, étiquette, carton d’expédition client, protection, carte. Pour un bureau déjà cartonné, une partie de ces postes est à zéro. On les laisse visibles pour les produits suivants.
- Livraison jusqu’au client, sauf si elle est facturée à part.
- Frais de paiement (Shopify, Stripe, PayPal) : un pourcentage réglable, pris sur la vente.
- Cotisations sur le chiffre d’affaires.

Le profit du mois, plus tard, reprend la règle de l’ebook : chiffre d’affaires moins cotisations moins toutes les dépenses du mois, y compris l’abonnement de la boutique.

### Routes à comparer

L’outil calcule les cinq routes pour la même quantité. Il ne choisit pas à votre place. Il montre le coût rendu, le délai indicatif et la trésorerie.

| Route | Quand elle existe | Ce qu’il faut pour la chiffrer |
|---|---|---|
| EXW + transitaire, mer, livré à l’adresse | Lot groupé. Souvent la piste des bureaux. Le devis va jusqu’à l’adresse, pas seulement jusqu’au port | m³, poids, port d’arrivée, adresse finale. Exemple : Le Havre, puis Le Havre → Gennevilliers. Le trajet intérieur est une ligne à part si le transitaire s’arrête au port |
| EXW + transitaire, air, DDP | Urgence, ou la part « 30 % » de la règle 70/30 de l’ebook pour ne pas être en rupture | Les mêmes données, tarif air |
| DDP proposé par l’usine | Simple, souvent plus cher que un transitaire séparé | Le prix DDP du devis |
| Agent en Chine, stock là-bas, envoi client par client | Produit léger, petit MOQ, test rapide | Prix unitaire du transport DDP avion vers la France, frais de stockage, délai de traitement |
| Achat Europe (grossiste) | Quand le fret Chine ne passe pas | Devis européen, souvent déjà rendu |

Règle 70/30 de l’ebook : 70 % du stock par bateau, 30 % par avion, pour avoir de la marchandise vite sans payer tout le lot en avion. Ce n’est pas « 70 % le prix du produit, 30 % le transport ». Le pourcentage est réglable.

Pour un produit léger, l’agent en Chine peut gagner parce qu’on n’immobilise pas un conteneur. Pour un bureau, le même agent facture un transport unitaire cher. Les deux phrases restent des hypothèses tant que les cases m³ et tarif ne sont pas remplies.

### Quantités demandées

Le livre ne donne pas un budget annoncé. Il donne des quantités de prix, selon le produit qu’il a en tête (une huile, un accessoire) : 500, 1 000 et 2 000 pièces, en EXW et en DDP. Ce sont des demandes de prix. La seule chose achetée tout de suite est l’échantillon, quantité X.

L’outil change ces quantités selon la catégorie, parce que 2 000 bureaux et 2 000 flacons ne parlent pas aux mêmes usines.

| Catégorie | Palier de prix demandé | Premier argent sorti |
|---|---|---|
| Petit et léger (accessoire, générique) | 500 / 1 000 / 2 000, comme le livre | Échantillon X, groupé chez le transitaire |
| Mobilier, lourd, volumineux | La bande où l’usine vend vraiment. Pour les bureaux : intention 30 000 à 40 000 €, soit environ 300 à 400 pièces si l’EXW est proche de 70 € | Échantillon d’1 à 2 sets. Le lot à 10 000 € seulement si le rendu tient |
| Alimentaire | Les mêmes questions de prix, plus les certificats que la douane exige pour cette denrée | Échantillon, après les certificats. Pas de stock sans ça |

Dire « 10 000 € » en premier, sur un bureau, s’est soldé par un refus. Le message mobilier ouvre donc sur l’intention 30 000 à 40 000 € et demande le prix à ce palier. Les 10 000 € restent le cash du projet. On ne les annonce pas comme le programme.

### Scénario bureau enregistré

Les 10 000 € sont le budget du projet, pas le budget d’un bureau.

- 7 000 € pour tout ramener : usine, fret maritime, trajet port → adresse, commissionnaire en douane, droits, TVA.
- 3 000 € pour l’entrepôt et la voiture. Cherchés à la main, pas par l’outil.
- Prix d’usine visé : 60 à 70 €.
- Prix de vente visé : 400 €, sans livraison client et sans montage. Ces deux prestations ne sont pas dans les 400 €, donc pas dans cette marge.
- Statut : micro-entreprise, vente de marchandises. Cotisations 12,3 % du chiffre encaissé. L’ACRE les baisse la première année si tu es éligible. Le taux du projet reste un réglage.

Chiffre déjà posé, incomplet : usine 60 € + transport 25 € (tes 500 € pour 20 pièces) + TVA 17 € = 102 €. Droits de douane à 0 faute de code HS. Ce 102 € ne contient ni Le Havre → Gennevilliers, ni le commissionnaire. La marge ne passe pas au vert tant que ces deux cases sont vides.

Avec ce 102 € provisoire, 7 000 € sortent 68 bureaux. Vendus 400 € :

- cotisations 49 €
- paiement carte environ 6 €
- reste environ 243 € par bureau avant l’entrepôt
- les 3 000 € répartis sur 68 bureaux font 44 €, reste environ 199 €

Le livre vise 25 à 30 % nets après cotisations. 199 € sur 400 € est au-dessus, seulement si les 68 se vendent et si le trajet intérieur plus le commissionnaire tiennent encore dans les 7 000 €. Chaque euro de ces deux postes se retire des 199 €.

Au MOQ de 20, 500 € de transport font déjà 25 € par bureau avant la douane, le port intérieur et le commissionnaire. On ne commande pas ce MOQ. Le palier demandé à l’usine reste 30 000 à 40 000 €.

### Lecture du résultat

Pour chaque route et chaque quantité, l’écran montre :

- coût rendu par unité
- marge nette estimée au prix de vente visé
- cash sorti (marchandise + fret + douane estimée)
- part du fret dans le coût
- ce qui est encore une estimation (dimensions absentes, douane sans code HS, tarif fret non demandé)

Si le cash sorti dépasse 10 000 €, ou si le rendu dépasse 100 € sur un bureau, la ligne est refusée. Le message peut quand même demander le prix du palier 30 000 à 40 000 €.

## 9. Lire un fournisseur

Filtres de l’ebook, cases à cocher avant d’écrire :

- recherche Alibaba filtrée fabricants, pas revendeurs de fiches
- verified
- Alibaba Trade Assurance
- au moins 2–3 ans
- produits dans la même catégorie
- fabricant, pas société de trading
- profil entreprise correct
- certifications utiles à l’import (à confirmer douane ou DGCCRF pour le meuble : stabilité, émissions, bois). « verified » ne remplace pas la lecture du certificat

Le transitaire est l’autre moitié du dossier, pas une étape plus tard. Mêmes filtres que le livre : verified, Trade Assurance, 4–5 ans, une part réelle d’exports vers l’Europe de l’Ouest, basé près d’un grand port (Guangdong ou Zhejiang). On lui envoie la packing list (quantité, poids, dimensions, code HS, enlèvement, livraison, incoterm). Son prix entre dans la marge au même titre que l’EXW.

### Gros poisson ou pas

On ne classe pas une usine sur sa façon d’écrire. Une usine de 40 ans peut mettre des emojis et ne répondre qu’à 300 ou 400 pièces. Le signal, c’est l’ancienneté, la catégorie, le prix de ce qu’elle vend, et le MOQ comparé au fret.

Le livre demande au minimum 2 à 3 ans. Au-delà, plus l’usine est ancienne, plus le palier de prix qu’on demande monte vers la bande où elle a l’habitude de vendre. Quarante ans et des bureaux à 65–220 dollars : on ouvre à 30 000–40 000 €, pas à 10 000 €.

- **Accessible** — le MOQ, le fret et la douane tiennent dans le budget réel, et le rendu reste sous la cible (100 € pour un bureau visé à 70 € EXW).
- **Limite** — le MOQ papier est bas (20 bureaux) mais le fret au MOQ mange la cible (500 € pour 20, soit 25 € pièce avant douane). On demande le prix au palier annoncé, on n’achète pas le MOQ.
- **Gros poisson** — le premier prix sérieux est un conteneur plein ou plusieurs centaines de pièces, sans prix en dessous. On demande quand même ce palier. On n’envoie pas 10 000 € comme si c’était le programme.

Un refus immédiat quand on annonce 10 000 € fait passer la fiche en « limite » ou « gros poisson », selon le seuil qu’ils ont nommé.

## 10. Stratégie de négociation

L’ebook est la règle. L’échange Phoebe montre ce qui arrive quand on ne l’applique pas encore.

### Ce que dit le livre

Trois gestes, séparés. On ne les mélange pas.

1. **Demander les grands paliers de prix, sans les commander.** Le premier message demande un prix EXW et un prix DDP pour 500, 1 000 et 2 000 pièces. Le livre ne dit pas « annonce 30 000 € pour pouvoir en acheter 10 000 ». Il dit de demander ces grands prix, et de ne pas avoir l’air d’un débutant. Pour le mobilier, 500 et 2 000 pièces ne sont pas le bon langage : le palier qui correspond, c’est l’intention 30 000 à 40 000 € (environ 300 à 400 bureaux à 70 €), ou le 40HQ si l’usine a nommé ce seuil. On demande le prix. On ne dit pas que la commande est déjà signée.
2. **Acheter un échantillon, quantité X, à part.** Le livre dit : « a test quantity of X units », pour juger la qualité et la vitesse, puis comparer les fournisseurs. X est petit. Les échantillons partent groupés chez le transitaire. On demande s’ils sont offerts, ou déduits de la future commande. Ce n’est pas un pourcentage du gros palier.
3. **Le 30 % / 70 % est un paiement, pas une taille d’échantillon.** Quand la commande finale fait plusieurs milliers d’euros : 30 % avant production, 70 % une fois la marchandise prête et le contrôle qualité validé. Jamais 100 % d’avance sur un gros montant. On ne paie rien tant que la marge n’est pas recalculée.

Le livre dit aussi de ne jamais se montrer débutant. Si les commandes n’existent pas encore, on présente un projet nouveau, précis, et on sait où on va. On ne se présente pas comme quelqu’un qui « regarde ».

### Ce que Phoebe a répondu

Du 15 au 25 septembre 2026, bureau électrique GS3011, 1 600 × 700 mm, demande de 30 sets en FOB.

Elle a répondu une règle d’usine, puis elle n’a pas envoyé le devis :

- Pas de prix FOB tant que ce n’est pas un 40HQ plein. En dessous : EXW seulement, et le transitaire est de notre côté.
- Elle a demandé manuel ou électrique, puis « ok ».
- Relances les 17, 21 et 25. Visite en Chine en décembre acceptée. Au 25 septembre : toujours pas de prix EXW, pas de CBM, pas de poids, pas de packing list.

30 sets est sous son seuil. Le devis ne vient pas. C’est le signal « pas pris au sérieux », et c’est cohérent avec le livre : un petit lot, sans palier conteneur et sans quantité test nommée, ne donne pas le prix.

### Règle dans l’outil

L’échantillon n’est pas 30 % de la quantité annoncée. Ce 30 % là, dans le livre, est l’acompte de la vraie commande, après l’échantillon et après la marge.

L’outil garde trois quantités :

| Quantité | Rôle | Exemple GS3011 |
|---|---|---|
| Palier usine | Prix demandé, pas encore acheté | Intention 30 000 à 40 000 €, ou le 40HQ si c’est son seuil. EXW et, s’ils l’acceptent à ce volume, DDP |
| Palier qu’on peut payer | 10 000 € de cash réel | Environ 140 sets à 70 € EXW, avant fret. Acheté seulement si le rendu reste ≤ 100 € |
| Échantillon X | Seul achat immédiat | 1 set électrique, 2 si on compare une finition. On demande s’il est offert ou déduit de la commande |

Le MOQ 20 n’est pas une ligne d’achat : 500 € de transport y font 25 € par bureau, et le cap à 100 € saute. Le budget réel plafonne l’échantillon, puis le premier lot si le rendu passe. Il ne plafonne pas la demande de prix à 30 000–40 000 €.

Le prochain message à Phoebe, dans cet ordre :

1. EXW du GS3011 électrique 1 600 × 700, au palier 40HQ plein, et la quantité exacte qui remplit ce 40HQ.
2. Les mêmes données qu’elle n’a pas encore données, pour l’échantillon et pour 30 sets : cartons, dimensions, poids brut, CBM, packing list. Sans ça, pas de cotation transitaire, donc pas de marge.
3. Un échantillon d’1 set, prix, et s’il est déduit quand la commande conteneur part.
4. Délai, certifications, paiement. Le 30 % / 70 % se discute sur la future commande, pas sur l’échantillon.

On ne redemande pas un FOB sur 30 sets. Elle a déjà dit non.

Le premier montant qu’on s’engage à payer est le prix de l’échantillon plus son transport, un montant qu’on a. Le palier conteneur décrit la suite. L’outil ne génère pas un faux bon de commande.

Chaque fournisseur reçoit les questions du livre, avec son modèle et son seuil à lui. Chez une usine de petit produit, les paliers restent 500 / 1 000 / 2 000. Chez une usine de bureaux, le palier haut est le conteneur qu’elle a nommé.

## 11. Agents

Les agents préparent. Ils n’envoient rien sans validation de l’un de vous deux.

| Agent | Entrée | Sortie |
|---|---|---|
| Fiche | URL ouverte dans Browserless | Champs extraits, trous explicites, images de la fiche rangées avec le produit |
| Simulation | Fiche + budgets + quantité 70 | Tableau des routes, marges, alertes |
| Recherche | Nom du produit, matière, mots-clés anglais, session Browserless | Liste d’URLs candidates à valider. Pas d’envoi |
| Qualification | Fiche fournisseur | Cases de l’ebook + classe accessible / limite / gros poisson |
| Rédaction | Fiche, catégorie, ancienneté, palier de prix | Brouillon anglais + version courte de relance |
| Relance | Fil sans réponse, fuseau | Brouillon daté, proposé dans la fenêtre d’envoi |
| Devis | Réponse collée ou transférée | EXW, DDP, MOQ, délai, paiement, extraits vers la simulation |

Il n’existe pas d’API Alibaba grand public à une dizaine d’euros pour chercher des usines et leur écrire. Les API Alibaba / Taobao ouvertes visent des vendeurs déjà dans leur écosystème, pas la prospection d’usines de meubles. WeChat n’a pas non plus d’API de prospection ; automatiser l’envoi fait fermer le compte.

Le trou se comble avec un navigateur piloté, pas avec une API marchande. C’est le rôle de Browserless.

### Browserless

MCP officiel : [browserless/browserless-mcp](https://github.com/browserless/browserless-mcp). Il est déjà branché dans Cursor (`plugin-browserless-browserless`) et demande une connexion avant usage.

Deux outils portent la V1 :

- `browserless_smartscraper` — ouvre une URL et rend la page en markdown, HTML, liens ou capture. C’est la lecture d’une fiche produit (prix affiché, MOQ, dimensions, poids).
- `browserless_agent` — session de navigateur qui dure : la page est observée, l’agent clique, tape, scrolle, puis relit. C’est la recherche de plusieurs fiches à partir d’un mot-clé anglais, et le passage des bandeaux cookies. Les skills inclus couvrent cookies, modales, contenu dynamique et captchas.

Le captcha n’est pas dans l’image Docker open source. L’image gratuite (`ghcr.io/browserless/chromium` et les variantes Chrome, Firefox, WebKit) donne Puppeteer, Playwright et les API de scrape, capture et PDF. Le solveur de captcha, le mode stealth et BrowserQL sont dans le cloud Browserless, ou dans l’image Enterprise avec une clé de solveur (par exemple CapSolver). Le skill captcha du MCP le dit : `solve` ne marche que sur le cloud. Si le solveur échoue, la session expose une URL live pour qu’un humain finisse la page.

Licence : l’image open source est sous SSPL-1.0, gratuite pour un usage non commercial. Un outil fermé, utilisé pour ce business, demande leur licence commerciale. On peut prototyper en local sur l’image open source. Le jour où l’app tourne pour de vrai à deux, on passe soit sur le cloud (captcha inclus, facturé à l’usage), soit sur une licence. On ne construit pas le produit sur l’hypothèse « captcha gratuit et illimité ».

Ce que Browserless fait dans le process :

- lire une fiche dont l’URL est collée, y compris si la page est en JavaScript
- chercher d’autres fiches du même bureau et ramener les URLs à valider
- s’arrêter sur un captcha cloud, ou vous passer la main via l’URL live
- sortir les champs et une capture, que la simulation range avec le produit

Ce qu’il ne fait pas : envoyer le message à l’usine, parler sur WeChat, ni inventer un poids qui n’est pas sur la page. L’envoi reste la file validée par l’un de vous deux.

Conséquence pour la V1 :

- La fiche et la recherche passent par Browserless. Vous pouvez encore coller une URL à la main si la session bloque.
- L’envoi de masse est une file : des dizaines de brouillons, une validation groupée, puis l’envoi par le canal que vous utilisez déjà (message Alibaba, e-mail). WeChat et WhatsApp servent après la première réponse, au moment où l’usine accepte de continuer. L’outil suit le canal et la prochaine action, il ne pilote pas WeChat.
- Le décalage horaire est géré par la file, pas par un robot qui parle la nuit tout seul.

Recherche de tendance, pour plus tard et pour les produits légers : Google Trends suffit pour voir si une courbe est stable ou saisonnière (critère de l’ebook). Une librairie open source type Trendspyg lit Trends sans abonnement. Le volume mensuel « 28 000 à 32 000 » de l’ebook vient de SEMrush ou Ubersuggest, qui sont des abonnements bien au-dessus de 10 €. En V1 on colle ce volume à la main si on valide une niche. On ne bloque pas les bureaux là-dessus : la niche est déjà choisie, le sujet est le coût rendu.

## 12. Fuseau et relances

Chine continentale : UTC+8. Quand il est 9 h à Shenzhen, il est 3 h en France l’été (UTC+2).

Fenêtre d’envoi par défaut : 9 h–11 h, heure Chine, en semaine. Les brouillons validés le soir en France partent le matin là-bas, pas à 23 h heure de l’usine.

Relance : une première après 2 jours ouvrés Chine sans réponse, une seconde après 4, puis la fiche passe en silence. Les délais sont réglables. On ne relance pas un fournisseur qui a déjà répondu : sa fiche passe à « devis ».

L’ebook a raison sur la suite : une fois qu’un agent ou une usine travaille avec vous, la relation se tient (réponses complètes, régularité, un peu de conversation). Ça se fait après le premier bon échange, pas dans le message de prospection.

## 13. Règles qu’on garde de l’ebook

Avant de passer une fiche en « on contacte » :

- le produit est compatible avec ce que vous acceptez de vendre
- pas de contrefaçon, pas de licence qu’on n’a pas
- pas de vente sans stock (le modèle retenu est un stock, même court, pas une vente d’un article qu’on ne détient pas)
- la description client, le jour où la boutique existera, dit ce que le produit est
- les paiements en plusieurs fois, s’il y en a un jour, sont vérifiés avant d’être proposés
- pas de musique sur les contenus de promo, et pas de visuels hors cadre que vous vous êtes fixés

Ces règles concernent ce que le client voit. Le script fournisseur, lui, parle de capacité d’achat. Les deux ne se mélangent pas dans le même texte.

Checklist logistique gardée pour l’étape commande, pas pour la V1 fonctionnelle : packing list détaillée (quantités, poids, dimensions, code HS), adresse d’enlèvement, incoterm, revalidation du prix de transport avant d’expédier chez le transitaire, échantillons groupés.

## 14. Cas bureaux

Les bureaux sont le premier dossier, pas le modèle de tous les produits.

- Prix unitaire élevé : peu de pièces dans 10 000 €, donc un MOQ d’usine « 100 » peut déjà être le sujet de la négociation.
- Volume : le m³ du carton décide si la mer groupée bat l’agent à l’unité. Le devis mer va jusqu’à l’adresse, avec une ligne port → entrepôt (Le Havre → Gennevilliers sur ce dossier) et une ligne commissionnaire en douane.
- EXW seul ne suffit pas. Un devis sans m³, sans poids, sans trajet intérieur et sans honoraire du commissionnaire reste une simulation incomplète.
- Objectif du premier lot : rentrer dans les 7 000 € tout compris jusqu’à Gennevilliers, vendre autour de 400 € sans livraison ni montage, garder les 3 000 € pour l’entrepôt et la voiture. Le réassort vient si les ventes suivent.

Les produits suivants (plus petits, plus légers) réutilisent le même process. Seuls les chiffres des routes changent. C’est pour ça que la route « agent en Chine » reste dans le tableau même si elle perd sur un bureau.

## 15. Données que l’outil retient

- **Projet** — budget réel, budgets annoncés, taux de cotisations, frais de paiement, seuil de marge, fenêtre horaire, étapes du pipeline.
- **Produit** — nom, URL, prix de vente visé, quantité scénario (70 par défaut sur ce dossier), marché.
- **Fiche** — champs lus, champs vides, date de lecture, images.
- **Simulation** — une ligne par route et par quantité. Postes séparés : usine, fret jusqu’au port, port → adresse, commissionnaire en douane, droits, TVA, cotisations, paiement. Case vide = marge non verte.
- **Fournisseur** — URL, cases de qualification, classe, MOQ, prix, canal, prochaine action.
- **Message** — brouillon, texte validé, auteur de la validation, heure d’envoi prévue, statut (à valider, programmé, envoyé, répondu, silence).
- **Devis** — chiffres extraits de la réponse, lien vers la simulation recalculée.

Le texte de l’ebook déjà extrait (`ebook/content.jsonl`) peut servir plus tard de base à un assistant qui répond « que dit le guide sur le DDP ». Ce n’est pas un prérequis de la V1 sourcing.

## 16. Boutiques, plus tard

Quand un produit est au stade « retenu » et qu’un premier lot est décidé :

- une boutique par univers (bureaux d’abord)
- la boutique est rattachée au projet
- chaque vente remonte : produit, quantité, encaissement
- l’outil compare les ventes au stock et au délai mer, pour dire s’il faut relancer l’usine

La création du site (Shopify, domaine, thème, fiches SEO) suit l’ebook au moment où ce lien existe. On ne ouvre pas la boutique pour meubler l’outil.

## 17. La V1 est bonne quand

- À partir d’une URL de fiche bureau ouverte dans Browserless, vous obtenez une simulation en moins de quelques minutes, avec les trous affichés.
- Sur un bureau à 70 € EXW, le MOQ 20 avec 500 € de fret est refusé, et le palier demandé au fournisseur est 30 000 à 40 000 €.
- Un fournisseur au MOQ trop haut est classé sans que vous refassiez le calcul à la main.
- Vous validez une série de brouillons, et la file les présente à envoyer le matin en Chine.
- Une réponse EXW collée dans le fil recalcule la marge et montre les cases encore vides : fret jusqu’au port, trajet port → adresse, commissionnaire en douane, droits, TVA.
- Un transitaire qualifié a un devis dans le même dossier, et la marge ne passe au vert que lorsque l’incoterm dit qui paie chaque poste.
- Ton associé voit le même dossier, le même budget réel, et le même historique.

Le zip est déjà là : `docs/WhatsApp Chat - Phoebe Fournisseur Chine Keno.zip`. Il n’y a pas de prix dedans. Du 15 au 25 septembre, Phoebe répond, lentement, et tourne autour du pot : pas de FOB sous un 40HQ, EXW à arranger de notre côté, manuel ou électrique, visite en décembre acceptée. Pas d’EXW, pas de CBM, pas de poids, pas de packing list. Le test de l’outil, c’est de ranger ce fil en « répond, sans devis », et de laisser la marge vide tant que ces chiffres n’y sont pas.
