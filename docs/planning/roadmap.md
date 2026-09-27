# Roadmap

On livre une tranche fine, on la voit tourner, on passe à la suivante. Le métier reste dans `docs/plan.md`. Ici, c'est l'ordre de construction.

Le journal des tranches livrées est `docs/journal.md`.

## Tranche 1 — Connexion

Page `/connexion`. E-mail et mot de passe, pas Google. Deux comptes, lus dans `AA_ACCOUNTS`. Session signée, 14 jours.

Le design vient des tokens ABK (nuit, dégradé, General Sans, carte 32 px). Pas le logo.

Fini quand : un bon couple e-mail / mot de passe ouvre le dossier, un mauvais reste sur la page avec l'erreur, et l'autre compte voit la même chose.

## Tranche 2 — Saisir un produit et lire sa fiche

Le détail est dans `docs/planning/fiche.md`.

Le champ est déjà à l'écran. La lecture, non.

1. Lire toute la fiche : produit, usine, ancienneté, certificats, traits, autres modèles de la même usine.
2. Chercher le même produit chez d'autres fournisseurs et sur d'autres sites, à partir de ces caractéristiques.
3. Afficher les offres. Le moins cher qui convient, pas seulement le prix d'usine le plus bas.
4. Analyser joue une animation le temps des lectures.

Le départ demande le lien et le budget total. Une carte montre le produit, puis les modèles proches. Le détail est dans `docs/planning/etapes.md`. Pas de plafond, pas de rail d'étapes.

Pas dans cette tranche : marge chiffrée, transitaire, brouillon, envoi.

Fini quand : une URL de fiche bureau donne un écran avec les champs remplis ou marqués absents, et le produit est retrouvable après un rechargement.

## Tranche 3 — Marge, cases vides

À partir de la fiche, un écran de coût. D'abord les questions de `docs/planning/etapes.md` : budget total, part mise de côté, prix de vente visé. L'enveloppe est le maximum pour ramener les produits. Le plafond par pièce n'est dit que lorsque les cases dues sont remplies.

Les postes sont des cases séparées : usine, fret jusqu'au port, port → adresse, commissionnaire en douane, droits, TVA.

Ce que le scrape a lu (souvent le prix) est recopié. Le reste reste vide tant qu'il n'y a pas de devis. La marge ne passe pas au vert.

Les chiffres du scénario bureau (7 000 € pour tout ramener, vente à 400 €, 12,3 %) sont des réglages du projet, pas des nombres écrits dans l'écran.

Fini quand : une fiche sans CBM affiche une marge incomplète, et saisir un fret à la main recalcule sans toucher aux cases encore vides.

## Tranche 4 — Transitaire

Même gravité que le produit. Tu colles une URL ou un nom, tu qualifies (verified, Trade Assurance, ancienneté, part d'export Europe, port), tu colles son devis. L'incoterm coche les cases que son prix inclut déjà. Le reste reste à ta charge.

Fini quand : un devis EXW laisse le fret et la douane vides, un devis DDP les remplit, et la marge de la tranche 3 s'en sert.

## Tranche 5 — Usines et brouillon

Liste d'usines sur le produit. Score accessible / limite / gros poisson à partir du MOQ, de l'ancienneté et du prix, pas du ton du message. Brouillon anglais pour le palier mobilier (intention 30 000 à 40 000 €). Tu valides avant que quoi que ce soit soit considéré comme envoyé. Pas d'envoi automatique dans cette tranche : le texte se copie.

Fini quand : le fil Phoebe, sans prix, se range en « répond, sans devis », et la marge ne bouge pas.

## Tranche 6 — File du matin

Les brouillons validés attendent la fenêtre Chine (9 h–11 h, UTC+8). Le cron Vercel les présente à l'envoi. Redis sert de verrou, Postgres garde le message.

Fini quand : un brouillon validé le soir en France n'est pas marqué envoyable avant le matin là-bas.

## Après

Entrepôts à la main, pas dans l'outil. Boutique rattachée, ventes, réassort : seulement quand une marge est verte et un fournisseur est retenu.
