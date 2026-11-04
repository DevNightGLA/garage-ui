# Handoff : Application « Gestion de garages » (v2)

## Vue d'ensemble
Application de gestion de la location de garages : garages et historique de loyers, locataires, locations, paiements (échéances et versements), remarques, envoi de messages (avis de loyer, relances, message libre), tableau de bord, statistiques, chronologie par locataire, et section Configuration (paramètres, modèles de messages, utilisateurs, droits d'accès, journal d'audit, maintenance). Quatre profils : Admin, Gestionnaire, Locataire, Consultant. Interface FR/EN, responsive (ordinateur, tablette, smartphone).

Le projet se réalise en **deux projets IntelliJ séparés** :

| Projet | Techno | Dossier cible | Consignes |
| --- | --- | --- | --- |
| Back-end | Java 21, Spring Boot 3, Maven, JPA, Flyway, PostgreSQL | `garages-api/` | `api/CLAUDE.md` copié à la racine |
| Front-end | Angular (dernière version stable), standalone + signals, SCSS | `garages-web/` | `web/CLAUDE.md` copié à la racine |

## Contenu de ce dossier

```
README.md                        ce fichier
TASKS.md                         plan de travail ordonné
api/CLAUDE.md                    consignes du projet back-end
web/CLAUDE.md                    consignes du projet front-end
docs/regles-de-gestion.md        règles RG-xxx (chapitres 1 à 15)
docs/complements-maquette.md     ce que la maquette fait en plus ou autrement que les règles
docs/prerequis-composants.md     dépendances, tokens, composants et services du front
maquette/                        références de design HTML (voir ci-dessous)
```

Contenu de `maquette/` :

| Fichier | Contenu |
| --- | --- |
| `Gestion Garages.dc.html` | Maquette interactive principale (tableau de bord, garages, locataires, locations, paiements, messages, statistiques, paramètres, connexion) |
| `Gestion des utilisateurs.dc.html` | Utilisateurs, droits d'accès (écrans, actions, appareils), maintenance |
| `Journal audit.dc.html` | Journal d'audit avec assistant de critères |
| `Site en maintenance.dc.html` | Page affichée pendant la maintenance |
| `Modele de donnees.dc.html` | **Modèle de données** : diagramme entités-relations, dictionnaire des 9 tables, relations, contraintes, données calculées |
| `droits.js` | Droits par défaut par profil et par appareil (données de départ) |
| `i18n.js` | Dictionnaire FR → EN |
| `dc-runtime.js`, `ds/` | Moteur d'affichage de la maquette, design system (tokens CSS, polices, icônes) |

Ouvrir les fichiers `.dc.html` dans un navigateur en gardant le dossier `maquette/` tel quel (chargement relatif). La maquette charge Quill depuis un CDN : une connexion internet est nécessaire pour l'éditeur riche.

## Mise en place dans IntelliJ
1. Créer `garages-api` (Spring Initializr) et `garages-web` (`ng new garages-web --routing --style=scss --ssr=false`) comme deux projets distincts.
2. Back : copier `api/CLAUDE.md` à la racine ; copier `docs/` dans `garages-api/docs/` ; copier `maquette/Modele de donnees.dc.html`, `maquette/dc-runtime.js` et `maquette/ds/` dans `garages-api/docs/`.
3. Front : copier `web/CLAUDE.md` à la racine ; copier `docs/` dans `garages-web/docs/` ; copier tout `maquette/` dans `garages-web/docs/maquette/`.
4. Suivre `TASKS.md` dans l'ordre.

## À propos des fichiers de design
Les fichiers de `maquette/` sont des **références créées en HTML** : prototypes montrant l'apparence et le comportement attendus. Ce n'est **pas du code de production à copier**. Il faut recréer les écrans en Angular et implémenter la logique en Spring Boot. La maquette contient des données de démonstration et simule l'authentification, les droits, la maintenance et les paramètres dans le navigateur (`localStorage`) : rien de cela n'est à reprendre tel quel (liste dans `docs/complements-maquette.md` section 13).

## Fidélité
**Haute fidélité** : couleurs, typographie, espacements et interactions sont définitifs. Les valeurs de design (tokens, tailles de tableau, animations) sont dans `docs/prerequis-composants.md` section 2 ; pour toute valeur non listée, lire le style en ligne de la maquette.

## Documents sources et priorité
1. `docs/complements-maquette.md` : prime sur les règles qu'il remplace (tableau de sa section 0).
2. `docs/regles-de-gestion.md` : comportement exact, messages d'erreur à reprendre mot pour mot, droits.
3. `maquette/Modele de donnees.dc.html` : modèle relationnel, complété par la section 11 des compléments.
4. `maquette/*.dc.html` : comportement visuel.

## Principes d'architecture
- **Règles métier uniquement dans les services du back.** Le front masque les boutons selon les droits et affiche les erreurs, mais ne fait confiance à rien.
- **Droits paramétrables** : table `DROIT_PROFIL` (profil × écran × voir / ajouter / modifier / supprimer) et `DROIT_APPAREIL`, modifiables par l'Admin, vérifiés par le back à chaque requête. Profil Locataire limité à ses propres données par le back.
- **Statuts toujours calculés, jamais stockés** (RG-TRA-01) : statut de location, statut affiché du garage, état d'un loyer, statut d'échéance, statut et solde du locataire.
- **Journal d'audit** écrit par le back dans la même transaction que chaque création, modification ou suppression des 9 tables métier ; table en insertion seule.
- **Date du jour** injectée via un `Clock` Spring ; le front reçoit la date du jour de l'API.
- **Pagination, tri multi-colonnes, filtres et recherche côté serveur** (`?page=0&size=10&sort=numero,asc&sort=cles,desc&statut=LIBRE&q=...`).
- **Erreurs métier** : HTTP 409 (règle violée), 422 (validation), 403 (droit), 503 (maintenance). Corps `{ "code": "GAR_NUM_EXISTE", "message": "Ce numéro de garage existe déjà.", "fieldErrors": {}, "details": [] }`. Champs obligatoires manquants renvoyés tous ensemble (RG-VAL-01).
- **Alerte non bloquante** (doublon locataire, RG-LOCT-04) : 409 `LOCT_DOUBLON`, le front propose « Enregistrer quand même » et renvoie avec `?force=true`.
- **Montants** `BigDecimal` 2 décimales, format français à l'affichage (`1 234,50 €`). **Dates** ISO dans l'API, `jj/mm/aaaa` à l'affichage et à la saisie.
- **Authentification** JWT, BCrypt, mot de passe temporaire, mot de passe oublié, inactivité, maintenance (voir compléments sections 4 et 7).
- **E-mails** : Spring Mail, variables remplacées côté back, signature automatique, remarque « Information » créée à chaque envoi.

## Écrans (front)

| Écran | Référence | Points clés |
| --- | --- | --- |
| Connexion, mot de passe oublié, nouveau mot de passe, modification du mot de passe | Compléments ch. 4 | Maquette principale, écrans d'authentification |
| Tableau de bord | RG ch. 11 | 4 indicateurs, 2 graphiques, cartes « Impayés à relancer », « Avis de loyer à communiquer », « Remarques à traiter » |
| Statistiques | Compléments ch. 9 | 4 pages avec sélecteur d'année |
| Garages, historique des loyers, historique des locations | RG ch. 5 et 6 | Filtres Loué / Libre / Indisponible, blocages de loyer, suppression avec motifs |
| Locataires, chronologie | RG ch. 7, compléments ch. 8 | Filtres Actuels / Anciens / Sans location, alerte doublon, chronologie par locataire |
| Locations | RG ch. 8 | Filtre par période de fin, choix du locataire par recherche, date de fin = dernier jour d'un mois |
| Paiements | RG ch. 9 | Sélecteur mois / année, paiement total ou partiel, versements, annulation |
| Remarques | RG ch. 10 | Fenêtre rattachée à un garage ou à un locataire, éditeur riche, type Problème avec résolution |
| Envoi de messages : avis de loyer, relances d'impayés, message libre | RG ch. 14, compléments ch. 10 | Cases à cocher, aperçu, remarque automatique, moyens manuels |
| Paramètres, modèles de messages | RG ch. 15 | Onglets par catégorie, un bouton Enregistrer par catégorie |
| Utilisateurs | Compléments ch. 5 | Liste, création en 2 étapes, mot de passe temporaire, désactivation |
| Droits d'accès | Compléments ch. 3 et 12 | Écrans, actions, appareils, brouillon avec enregistrement |
| Journal d'audit | Compléments ch. 6 | Assistant de critères, détail avant / après, fil conducteur |
| Maintenance, page « Site en maintenance » | Compléments ch. 7 | Interrupteur Admin, prévisualisation |

## Interactions communes (RG-LST, RG-VAL)
- Pagination « x–y sur n », page ramenée à la dernière si hors limite, retour page 1 à tout changement de filtre, de recherche ou de tri.
- Tri cumulatif par clic sur en-tête : aucun, ▲, ▼, retiré ; rang affiché ; bouton « Annuler les tris (n) ».
- Champs obligatoires : astérisque rouge ; à l'enregistrement tous les champs vides passent en rouge d'un coup ; le rouge disparaît à la saisie.
- Sans droit de modification : fenêtres en consultation (champs désactivés, pas de bouton Enregistrer, intitulé « Visualiser … »), boutons d'action masqués.
- Info-bulles sur les icônes d'action, y compris la raison d'un blocage.
- Les données calculées dépendent de la date du jour ; le front affiche ce que renvoie l'API.

## Ce qui a changé depuis la v1 du handoff
- Quatre profils au lieu de trois (Lecture seule devient Consultant, ajout de Locataire) et droits paramétrables.
- Nouveaux écrans : utilisateurs, droits d'accès (dont accès par appareil), journal d'audit, maintenance, chronologie, statistiques, message libre, paramètres et modèles de messages, connexion et mot de passe.
- Modèle de données : 9 tables dans le fichier HTML (ajout de `PARAMETRE`), plus 6 modifications ou tables proposées dans `complements-maquette.md` section 11.
- Règles de gestion : chapitres 14 (envoi de messages, relances) et 15 (paramètres) ; liste des règles remplacées dans les compléments.
- Tokens : dégradé « ancien » olive (`#626753 → #7F846F`), cellules de tableau 14px.
- Le back et le front disposent chacun de leur `CLAUDE.md` mis à jour, et d'un document de prérequis des composants.

## Décisions ouvertes
À valider avec le métier avant ou pendant l'implémentation. Défaut proposé entre parenthèses.
1. **Création des échéances** : le modèle indique une création manuelle par mois, les règles (RG-PAI-01) et la maquette une ligne par garage loué pour le mois affiché. (Défaut : l'écran Paiements calcule les lignes ; l'échéance est créée au premier versement ; `montant_du` = loyer en vigueur à la période, figé.)
2. **Maximum 20 garages** : non contrôlé dans la maquette. (Défaut : contrôler.)
3. **Adresse du garage** : colonne présente, jamais saisie. (Défaut : facultative, pas d'écran.)
4. **Historique des locations d'un garage** : une location « À venir » doit s'afficher « À venir » (la maquette affiche « Terminée »).
5. **Clés totales** : ≥ 0 (maquette) ou > 0 (règles initiales). (Défaut : ≥ 0.)
6. **Suppressions par le Gestionnaire** : la maquette lui donne par défaut les mêmes droits que l'Admin, suppressions comprises ; la règle initiale les réservait à l'Admin. (Défaut : suivre la maquette, droit réglable.)
7. **Tables à ajouter** (compléments section 11) : colonnes de `UTILISATEUR`, `DROIT_PROFIL`, `DROIT_APPAREIL`, `JOURNAL_AUDIT`, `AVIS_LOYER`, `RELANCE`, `JETON_MOT_DE_PASSE`, lien utilisateur Locataire → fiche locataire. (Défaut : retenir les propositions.)
8. **Durée de validité du lien « mot de passe oublié »** : non définie dans la maquette. (Défaut : 1 heure, usage unique.)
9. **Stockage de l'état de maintenance** : ligne `PARAMETRE` de nature `systeme` ou singleton. (Défaut : ligne `PARAMETRE`.)
