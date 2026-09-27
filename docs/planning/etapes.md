# Étapes à l'écran, et le budget

Le pipeline complet reste dans `docs/plan.md` (idée, fiche, simulation, décision, fournisseurs, message, envoi). Ici, c'est ce que l'écran montre, et comment le budget entre dans le prix.

Le départ demande le lien et le budget total. Ensuite une seule carte dit « Voici le produit » et, un temps après, les modèles proches. Le champ du bas devient un message. Le repère d'étape à gauche n'est pas encore là.

## Ce que l'écran montre

À gauche, dans la marge, un seul repère : l'étape en cours. Exemple : « 2 · Budget ».

Dès qu'une fiche s'ouvre, ce repère monte et flotte au-dessus du fil. Au survol, et au clavier, il se déplie : étapes faites, étape en cours, étapes qui restent. Une étape future ne se clique pas.

Dans la fenêtre, on parle. L'assistant appelle un bloc déjà écrit. En bas de son message : **Passer à l'étape suivante**. On avance seulement par là, et seulement si la règle de l'étape est tenue. Sinon le bouton nomme ce qui manque.

## Les étapes visibles

1. **Article** — le lien, la fiche lue. Règle : une fiche est là, chaque champ lu ou marqué absent.
2. **Marché** — le même produit sur Made-in-China, Alibaba, DHgate, et les autres sites chinois dès qu'une page se lit. Chaque offre garde son prix. Règle : la recherche a tourné, les prix sont affichés.
3. **Budget** — avec le lien, avant la recherche. Règle : le budget total est tapé par l'utilisateur. La part mise de côté vient avec la marge.
4. **Tranche** — on coche ceux qu'on garde. Règle : la sélection est enregistrée, y compris si on n'en garde aucun.
5. **Marge** — une case par poste. Règle pour la suite : on a vu l'enveloppe, et les cases vides sont nommées. La marge ne passe pas au vert tant qu'une case due est vide.
6. **Message** — un brouillon par usine retenue. Le budget réel n'y entre pas. Règle : le texte est validé par un humain.
7. **Envoi** — la file, fenêtre 9 h–11 h heure Chine, quelques messages à la fois.

## Budget — ce qu'on demande

Trois nombres, tapés par l'utilisateur. Aucun n'est prérempli avec le scénario bureau.

| Champ | Sens |
|---|---|
| Budget total | Ce qu'on est prêt à mettre pour tout le projet |
| Part mise de côté | Entrepôt, voiture, tout ce qui n'est pas la marchandise rendue. L'outil ne cherche pas l'entrepôt. Zéro veut dire : tout le budget sert à ramener les produits |
| Prix de vente visé | Le prix auquel on compte vendre, plus tard, pour expliquer la marge. Ce n'est pas le budget |

L'enveloppe marchandise = budget total − part mise de côté.

C'est le maximum de cash pour : prix usine, fret jusqu'au port, trajet port → adresse, honoraire du commissionnaire, droits, TVA.

Le budget annoncé au fournisseur est un autre champ, plus tard, à l'étape Message. Il ne recopie jamais le budget total.

## Ce que l'assistant explique

Il dit l'enveloppe, et la liste de ce qu'elle couvre.

Le prix usine maximum par pièce n'est dit que lorsque les deux conditions sont là :

- une quantité écrite (le MOQ de la fiche, ou une quantité choisie dans la tranche) ;
- chaque case que l'incoterm laisse à notre charge est remplie par un devis.

Tant qu'une case due est vide, l'assistant répète l'enveloppe et nomme la case. Il ne propose pas un prix « raisonnable ».

Quand les cases sont remplies :

prix usine max = (enveloppe ÷ quantité) − (fret + trajet intérieur + commissionnaire + droits + TVA) ÷ quantité.

Si ce nombre est négatif, ou si le cash rendu dépasse l'enveloppe, la ligne est hors budget. On peut quand même demander un prix à l'usine. On ne la retient pas.

Le scénario bureau du plan (10 000 €, dont 7 000 € pour tout ramener et 3 000 € pour l'entrepôt et la voiture, vente à 400 €) est un exemple déjà enregistré. L'écran utilise les nombres tapés, pas cet exemple.

## Le prix dans le marché

Chaque offre affiche son prix, en grand.

- Plafond pas encore calculé : le prix est là, avec la mention « plafond unitaire pas encore calculé », et l'enveloppe à côté.
- Plafond calculé : une offre au-dessus est marquée hors budget. Elle peut rester dans les produits à explorer. Elle n'entre pas seule dans la tranche.

On garde le moins cher qui tient dans l'enveloppe, pas le prix d'usine le plus bas.

## Blocs que l'assistant peut poser

L'assistant ne dessine pas l'écran. Il appelle un de ces blocs, avec les données de l'étape.

| Bloc | Étape | Rôle |
|---|---|---|
| Fiche | Article | Ce qui est lu, ce qui est absent |
| Budget | Budget | Les trois champs, puis l'enveloppe et les cases encore vides |
| Sélection | Marché, Tranche | Les offres, le prix, la coche, la marque hors budget quand le plafond existe |
| Marge | Marge | Une case par poste, vide sans devis |
| Brouillon | Message | Le texte à relire. Pas le budget réel dedans |

## Ordre de construction

1. Cette page fait foi pour l'écran et pour le budget.
2. Tranche 2 : le départ demande le lien et le budget total. Une carte montre la fiche, puis les modèles proches avec leur prix. Pas de plafond calculé.
3. Tranche 3 : la part mise de côté, le prix de vente, les cases de marge. Le plafond unitaire apparaît seulement là.
