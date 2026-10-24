# Handoff : Application « Gestion de garages »

## Vue d'ensemble
Application de gestion de la location de garages : garages et historique de loyers, locataires, locations, paiements (échéances et versements), remarques, tableau de bord. Trois rôles : Admin, Gestionnaire, Lecture seule. Interface FR/EN.

L'application doit être réalisée en **deux projets séparés** :

| Projet | Techno | Dossier | Fichier de consignes |
| --- | --- | --- | --- |
| Back-end | Java 21, Spring Boot 3, Maven, JPA, Flyway, PostgreSQL | `garages-api/` | `api/CLAUDE.md` (à copier à la racine du projet) |
| Front-end | Angular (dernière version stable), standalone + signals, SCSS | `garages-web/` | `web/CLAUDE.md` (à copier à la racine du projet) |

## À propos des fichiers de design
Les fichiers de `maquette/` sont des **références de design créées en HTML** : prototypes montrant l'apparence et le comportement attendus. Ce n'est **pas du code de production à copier**. Il faut recréer ces écrans en Angular (front) et implémenter la logique en Spring Boot (back). La maquette contient des données de démonstration et simule l'authentification par un sélecteur de rôle : ni l'un ni l'autre ne doivent être repris tels quels.

Pour ouvrir la maquette : ouvrir `maquette/Gestion Garages.dc.html` dans un navigateur (garder le dossier tel quel : `support.js`, `i18n.js` et `_ds/` sont chargés en relatif). `maquette/Modele de donnees.dc.html` présente le diagramme entités-relations, le dictionnaire des 8 tables, les contraintes et les données calculées.

## Fidélité
**Haute fidélité** : couleurs, typographie, espacements et interactions sont définitifs. Recréer l'interface au pixel près avec Angular. La maquette s'appuie sur un design system « Soft UI » (dossier `maquette/_ds/`, tokens dans `_ds/.../tokens/*.css`) : reprendre ses valeurs en variables CSS/SCSS dans le projet Angular.

## Documents sources (source de vérité)
1. `docs/regles-de-gestion.md` : toutes les règles `RG-xxx` (comportement exact, messages d'erreur, droits). **Les messages d'erreur sont à reprendre mot pour mot.**
2. `maquette/Modele de donnees.dc.html` : modèle relationnel (8 tables : LOCATAIRE, LOCATION, GARAGE, LOYER_GARAGE, ECHEANCE, VERSEMENT, REMARQUE, UTILISATEUR), relations, CHECK/UNIQUE, données calculées, règles applicatives.
3. `maquette/Gestion Garages.dc.html` : comportement visuel et interactions.

En cas de conflit : règles de gestion > modèle de données > maquette. Le chapitre 13 des règles de gestion liste les écarts à trancher (voir « Décisions ouvertes » ci-dessous).

## Principes d'architecture
- **Règles métier uniquement dans les services du back.** Le front masque les boutons selon le rôle et affiche les erreurs, mais ne fait confiance à rien : le back refuse toute action non autorisée.
- **Statuts toujours calculés, jamais stockés** (RG-TRA-01) : statut de location, statut affiché du garage (Loué), état d'un loyer, statut d'échéance, statut du locataire. Les DTO les exposent.
- **Date du jour** injectée via un `Clock` Spring (testabilité). Toutes les règles de dates en dépendent.
- **Pagination, tri multi-colonnes, filtres et recherche côté serveur** (`?page=0&size=10&sort=numero,asc&sort=cles,desc&statut=LIBRE&q=...`).
- **Erreurs métier** : réponse HTTP 409 (règle violée) ou 422 (validation), corps `{ "code": "GAR_NUM_EXISTE", "message": "Ce numéro de garage existe déjà.", "details": [] }`. Les champs obligatoires manquants sont renvoyés tous ensemble (`fieldErrors`) pour le surlignage rouge (RG-VAL-01).
- **Alerte non bloquante** (doublon locataire, RG-LOCT-04) : le back répond 409 `LOCT_DOUBLON`, le front propose « Enregistrer quand même » et renvoie la requête avec `?force=true`.
- **Montants** : `BigDecimal`, 2 décimales. Format français à l'affichage (`1 234,50 €`).
- **Dates** : ISO `yyyy-MM-dd` dans l'API ; affichage et saisie `jj/mm/aaaa` côté front (masque + calendrier).
- **Authentification** : JWT, rôles `ADMIN`, `GESTIONNAIRE`, `LECTURE_SEULE`. Écrans à créer d'après la maquette : connexion, déconnexion, changement de mot de passe, mot de passe oublié / réinitialisation.

## Écrans (front)
Navigation latérale repliable (dernière page mémorisée) : Tableau de bord, Garages, Locataires, Locations, Paiements. En-tête : fil d'Ariane « Pages / … », titre, recherche (selon la page), sélecteur FR/EN, rôle de l'utilisateur. Pied du menu : nom, rôle, changer le mot de passe, déconnexion.

Pour chaque écran, le détail des colonnes, filtres, tris, formulaires et validations est dans `docs/regles-de-gestion.md` :

| Écran | Chapitre | Points clés |
| --- | --- | --- |
| Tableau de bord | 11 | 4 indicateurs (occupation, loyers mensuels, impayés, garages libres), 2 graphiques 12 mois (loyers encaissés, taux d'occupation), liste « Impayés à relancer » paginée par 3 |
| Garages | 5 | Filtres Loué/Libre/Indisponible/Tous, tri multi-colonnes, remarques en pastille, menu (…) historiques loyers et locations, formulaire, suppression Admin avec motifs de refus |
| Historique des loyers | 6 | Fenêtre : liste 5 par page, nouveau / modifier / supprimer le dernier loyer, blocages RG-LOY-08 et 09 |
| Locataires | 7 | Filtres Actuels (défaut)/Anciens/Sans location/Tous, badges À jour/En retard/Ancien, alerte doublon |
| Locations | 8 | Filtres Actives/À venir/Terminées, filtre par période de fin, choix du locataire par recherche, date de fin = dernier jour d'un mois |
| Paiements | 9 | Sélecteur mois/année, une ligne par garage loué, paiement total ou partiel, détail des versements, annulation Admin |
| Remarques | 10 | Fenêtre rattachée à un garage ou à un locataire, éditeur riche (Quill dans la maquette), type Problème avec résolution |

## Interactions communes (RG-LST, RG-VAL)
- Pagination « x–y sur n », page ramenée à la dernière si hors limite, retour page 1 à tout changement de filtre/recherche/tri.
- Tri cumulatif par clic sur en-tête : aucun, ▲, ▼, retiré ; rang affiché ; bouton « Annuler les tris (n) ».
- Champs obligatoires : astérisque rouge ; à l'enregistrement tous les champs vides passent en rouge d'un coup ; le rouge disparaît à la saisie.
- Lecture seule : fenêtres en consultation (champs désactivés, pas de bouton Enregistrer, intitulé « Visualiser … »), boutons d'action masqués.
- Info-bulles sur les icônes d'action, y compris la raison d'un blocage.
- Les données calculées dépendent de la date du jour ; le front ne les recalcule pas, il affiche ce que renvoie l'API.

## Design tokens (extraits de `maquette/_ds/.../tokens`)
Police : **Open Sans** (400, 600, 700). Icônes : Font Awesome (voir `_ds/.../tokens/fontawesome.css` et `assets/fonts`).

Couleurs
- Fond de page `#F8F9FA` ; cartes `#FFFFFF` ; bordures `#E9ECEF` ; bordure d'input `#D2D6DA`
- Titres `#344767` ; texte `#67748E` ; atténué `#8392AB`
- Primaire (fuchsia) `#CB0C9F` ; dégradé primaire `linear-gradient(to top left, #7928CA, #FF0080)`
- Danger : `#D40505` (texte/bordure d'erreur), dégradé `linear-gradient(to top left, #D40505, #F2566F)`
- Succès : `#0F8A2A`, dégradé `linear-gradient(to top left, #0C7A25, #62BD1D)`
- Ancien locataire : dégradé `linear-gradient(to top left, #5C6672, #8A949F)`
- Avertissement/Partiel : orange `#F97316` ; info `#17C1E8`
- Surcouche modale : `rgba(52,71,103,.45)`

Espacement (px) : 4, 8, 12, 16, 20, 24, 32, 40, 48, 64. Rayons : 8 (champs, boutons), 12 (modales), 16 (cartes), 9999 (pastilles).
Ombres : carte `0 20px 27px rgba(0,0,0,.05)` ; bouton `0 3px 5px rgba(0,0,0,.08)` ; modale `0 20px 27px rgba(0,0,0,.2)`.

Typographie observée dans la maquette
- Titre de page 24px/700 `#344767` ; fil d'Ariane 12px
- Titre de carte 16px/700 ; titre de modale 18px/700
- Libellés de formulaire 12px/700 majuscules ; valeur d'indicateur 24px/700
- Cellules de tableau 13px ; en-têtes de tableau 700, cellules `padding:12px 10px`, première colonne 24px à gauche
- Modales : largeur 440 à 480px, `border-radius:12px`, en-tête et pied séparés par `1px solid #E9ECEF`

Pour toute valeur non listée ici, lire directement le style en ligne dans `maquette/Gestion Garages.dc.html`.

## Décisions ouvertes (chapitre 13 des règles de gestion)
À valider avec le métier avant ou pendant l'implémentation. Proposition par défaut entre parenthèses :
1. **Création des échéances** : la maquette n'a pas d'écran de génération. (Défaut : l'écran Paiements calcule une ligne par garage loué pour le mois affiché ; l'échéance est créée en base au premier versement, `montant_du` = loyer en vigueur à la période, figé.)
2. **Maximum 20 garages** : contrôle applicatif non présent dans la maquette. (Défaut : contrôler.)
3. **Gestion des utilisateurs** : absente de la maquette. (Défaut : back seulement — CRUD Admin sans écran, dernier admin actif protégé ; écran à prévoir plus tard.)
4. **Adresse du garage** : colonne présente, jamais saisie. (Défaut : colonne facultative, pas d'écran.)
5. **Historique des locations d'un garage** : une location « À venir » doit afficher « À venir » (la maquette affiche « Terminée » par erreur).
6. **Clés totales** : ≥ 0 (maquette) ou > 0 (règles initiales). (Défaut : ≥ 0.)

## Fichiers
- `maquette/Gestion Garages.dc.html` : maquette interactive complète
- `maquette/Modele de donnees.dc.html` : modèle de données
- `maquette/i18n.js` : dictionnaire FR → EN de la maquette (base des fichiers de traduction Angular)
- `maquette/_ds/` : design system (tokens CSS, polices, icônes)
- `docs/regles-de-gestion.md` : règles de gestion
- `api/CLAUDE.md`, `web/CLAUDE.md` : consignes par projet
- `TASKS.md` : plan de travail ordonné
