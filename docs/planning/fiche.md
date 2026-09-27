# Lecture d'une fiche

On colle un lien. On lit toute la fiche, pas seulement le prix. Ces caractéristiques servent à chercher le même produit chez d'autres usines et sur d'autres sites. Le but est le moins cher qui convient : prix, MOQ, ancienneté, certificats, fabricant ou société de trading, fret.

## Deux lectures

La page du produit donne le produit et l'usine qui le vend. Les « produits liés » sur Made-in-China sont d'autres modèles de la même usine. Ce n'est pas le même bureau chez un concurrent.

Ensuite, une recherche à part, construite avec les caractéristiques lues : bureau électrique, hauteur réglable, quatre moteurs, plateau 1 200 à 1 800 mm, pieds métal. On ouvre les fiches qui correspondent, sur Made-in-China, puis Alibaba, puis un autre site si la page se lit.

Chaque offre garde son prix, son MOQ, son usine. On les compare. On ne mélange pas deux fiches en une.

## Ce qu'on garde

Tout ce qui est écrit sur la page, plus les champs qu'on compare toujours :

- lien, titre, modèle
- prix, monnaie, paliers s'il y en a
- MOQ, et un second MOQ s'il est écrit ailleurs sur la page
- dimensions, poids, carton, code HS
- matière, charge, course de hauteur, plateau
- photos
- usine : nom, ville, type (fabricant, trading, ou les deux)
- ancienneté, années d'export, membre depuis
- certificats
- traits affichés : audité, délai annoncé, port, mode de transport
- liens des autres modèles de cette usine
- liens des mêmes produits trouvés ailleurs

Absent reste absent. On n'invente pas un fret.

## Navigateur

Pour Made-in-China, une requête HTTP suffit : la fiche Keno répond en HTML. Pas de Browserless pour lire cette page, ni pour ouvrir la page usine et la liste de ses produits, qui sont des liens dans le même HTML.

Browserless sert si une recherche Alibaba, ou une autre fiche, ne rend rien en HTTP. On ne prend pas les dépôts qui contournent l'anti-bot.

## À quel moment

On garde tout. L'écran ne montre que ce qui sert à la phase en cours.

| Moment | Ce qu'on montre |
|---|---|
| Lecture de la fiche | Sérieux de l'usine : nom, fabricant ou trading, lieu, ancienneté, audit, note |
| Devis et transitaire | Capacité à livrer : délai annoncé, équipe export, port, acheteurs qui reviennent |
| Plus tard, en badges | Le même sérieux, en pastilles, le détail au survol |

Les libellés du viewer 360° ne servent à aucune phase. On ne les affiche pas. Les notes de livraison restent dans la fiche, elles n'apparaissent pas tant qu'on n'est pas au devis.

## Parcours à l'écran

1. On colle le lien. Analyser.
2. Animation pendant la lecture.
3. La fiche complète s'affiche, puis les autres offres du même produit, avec le prix et pourquoi l'une convient mieux.
4. La discussion guidée vient après. Pas dans cette tranche.

## Premier test — Keno, 27 septembre 2026

Lien : [GS3011 sur Made-in-China](https://kenofurniture.en.made-in-china.com/product/arBRnxLOJNku/China-Factory-Four-Motors-Work-Study-Office-Electric-Height-Adjustable-Lifting-Computer-Table.html).

| Champ | Lu |
|---|---|
| Titre | Factory Four Motors Work Study Office Electric Height Adjustable Lifting Computer Table |
| Prix | 65 à 207 USD |
| MOQ affiché | 10 sets |
| MOQ dans la FAQ | 5 sets en EXW avec un transitaire en Chine. Sinon plus de 10 m³ |
| Modèle | GS3011 |
| Carton | 65 × 30 × 20 cm, 20 kg |
| Matière | pieds métal, plateau bois |
| Code HS | 9403300090 |
| Hauteur | 615 à 1 225 mm |
| Plateau | 1 200 à 1 800 mm |
| Charge | 120 kg |
| Certificats | SGS, ISO 9001 |
| Ancienneté | 15 ans d'export sur la fiche, 20 ans dans le texte usine, membre Diamond depuis 2021 |
| Traits | usine auditée, livraison annoncée sous 30 jours, garantie 3 ans |
| Usine | Foshan Keno Furniture, Guangdong. Manufacturer et trading company |
| Port | Shenzhen ou Guangzhou, mer seulement |
| Autres modèles Keno | une dizaine de liens sur la même page, d'autres bureaux, pas le même GS3011 ailleurs |
| Fret | absent |
