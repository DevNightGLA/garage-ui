# Prérequis des composants (front-end Angular)

Ce document liste ce que le projet Angular doit fournir avant de construire les écrans : dépendances, tokens, composants partagés avec leur contrat, services et comportements transversaux. La référence visuelle est `maquette/Gestion Garages.dc.html` (styles en ligne, valeurs exactes). Les règles métier sont dans `regles-de-gestion.md` et `complements-maquette.md`.

## 1. Dépendances

| Besoin | Choix | Remarque |
| --- | --- | --- |
| Framework | Angular, dernière version stable, composants standalone, signals, SCSS, TypeScript strict | `ng new garages-web --routing --style=scss --ssr=false` |
| Traduction | `@ngx-translate/core` + `@ngx-translate/http-loader` | Clés explicites, jamais de texte français comme clé. Source : `maquette/i18n.js` (dictionnaire FR → EN, environ 200 entrées) |
| Police | Open Sans 400, 600, 700 | `@fontsource/open-sans` ou les `woff2` de `maquette/ds/.../assets/fonts` |
| Icônes | Font Awesome Free 6 (`fa-solid`, `fa-regular`) | `@fortawesome/fontawesome-free` ; mêmes classes que la maquette (`fa-solid fa-warehouse`…) |
| Éditeur riche | Quill via `ngx-quill` | La maquette utilise Quill 1.3.7 (thème snow). Barre d'outils : gras, italique, souligné, liste numérotée, liste à puces, lien |
| Graphiques | `ng2-charts` (Chart.js) | Barres (loyers encaissés), ligne (taux d'occupation), camembert (répartition par statut), barres (remarques par type) |
| Dates | `Date` natif + utilitaires maison (ou `date-fns`) | Pas de bibliothèque de calendrier : le sélecteur est un composant maison. Locale `fr` enregistrée |
| Pas de bibliothèque UI | — | L'apparence « Soft UI » est recréée en SCSS |

Proxy de développement : `proxy.conf.json` redirige `/api` vers `http://localhost:8080`.

## 2. Tokens à transposer en SCSS

Source : `maquette/ds/soft-ui-gregory-92ffefa8-13be-41ae-8046-f1a46cb5dfba/tokens/*.css` et le bloc `<style>` de `Gestion Garages.dc.html`. Créer `src/styles/_tokens.scss` (variables CSS `:root`) puis `_base.scss`, `_table.scss`, `_quill.scss`.

Couleurs (la maquette surcharge certaines valeurs du design system, ce sont celles-ci qui font foi) :

| Usage | Valeur |
| --- | --- |
| Fond de page | `#F8F9FA` |
| Carte | `#FFFFFF` ; bordure `#E9ECEF` ; bordure d'input `#D2D6DA` |
| Titres / texte / atténué | `#344767` / `#67748E` / `#8392AB` |
| Primaire (fuchsia) | `#CB0C9F` ; dégradé `linear-gradient(310deg,#7928CA,#FF0080)` |
| Danger | `#D40505` ; dégradé `linear-gradient(to top left,#D40505,#F2566F)` |
| Succès | `#0F8A2A` ; dégradé `linear-gradient(to top left,#0C7A25,#62BD1D)` |
| Ancien locataire | dégradé `linear-gradient(to top left,#626753,#7F846F)` ; version claire `#8F9482 → #A9AE9A` |
| Avertissement | `#F97316` ; dégradé orange de la maintenance `linear-gradient(310deg,#F5A623,#FB8C00)` |
| Info | `#17C1E8` ; dégradé `linear-gradient(to top left,#2152FF,#21D4FD)` |
| Sombre | dégradé `linear-gradient(to top left,#141727,#3A416F)` |
| Surcouche des fenêtres | `rgba(52,71,103,.45)` |
| Info-bulle | fond `#212529`, texte blanc 12px/600 |

Espacements : 4, 8, 12, 16, 20, 24, 32, 40, 48, 64 px. Rayons : 8 (champs, boutons), 12 (fenêtres), 16 (cartes), 9999 (pastilles), 50 % (avatars, icônes rondes). Ombres : carte `0 20px 27px rgba(0,0,0,.05)`, bouton `0 3px 5px rgba(0,0,0,.08)`, fenêtre `0 20px 27px rgba(0,0,0,.2)`, focus `0 0 0 3px rgba(226,147,211,.5)`.

Typographie : Open Sans. Titre de page 24px/700. Titre de carte 16 à 19px/700. Titre de fenêtre 18 à 19px/700. Libellé de formulaire 12 à 13px/700 majuscules. Champs et listes déroulantes 15px. **Cellules de tableau 14px**, en-têtes 700, padding des cellules `18px 10px`, première colonne 24px à gauche (variantes par tableau dans le bloc `<style>` : classes `.gt.tt`, `.gt.tg`, `.gt.tc`, `.gt.tp`). Champs obligatoires : astérisque `#D40505`. Placeholders en italique.

Animations : indicateur glissant des filtres `transform/width/height .5s cubic-bezier(.2,.8,.2,1)` ; `ggSpin` (bouton en cours d'enregistrement) ; `ggToast` (message de succès, 4 s).

Points d'arrêt : ordinateur > 1024 px, tablette 641 à 1024 px, smartphone ≤ 640 px (`@media (max-width:1024px)`, `(max-width:640px)`).

## 3. Composants partagés (`src/app/shared`)

Chaque composant : standalone, `ChangeDetectionStrategy.OnPush`, inputs/outputs typés, test unitaire. Les noms sont conseillés.

### 3.1 Structure de page

| Composant | Contrat et comportement |
| --- | --- |
| `app-shell` | Menu latéral + en-tête + contenu + zone de messages. Sous 1024 px le menu devient un tiroir avec surcouche, fermé après chaque navigation |
| `sidebar-menu` | Sections et entrées à sous-menu (voir `complements-maquette.md` section 1), dépliables. Mode replié : icônes seules. État replié mémorisé (`localStorage`), valeur par défaut = paramètre `menu_replie`. Entrées filtrées par droits (`RightsService`) et par appareil (`DeviceService`). Pied : avatar, nom, profil, « Modifier le mot de passe », « Se déconnecter » |
| `page-header` | Fil d'Ariane « Pages / Section / Titre », titre, champ de recherche (selon la page, placeholder propre à la page), sélecteur de langue FR/EN. Le sélecteur de rôle et le sélecteur de mode d'affichage de la maquette sont des simulations : ne pas les reprendre |
| `kpi-card` | Carré d'icône en dégradé, libellé, valeur 24px/700, note. 4 sur le tableau de bord |
| `task-card` | Carte de liste de 5 lignes de même hauteur, pagination interne, état vide. Utilisée pour Impayés à relancer, Remarques à traiter, Avis de loyer à communiquer |
| `chart-card` | Graphique 12 mois avec navigation entre deux graphiques (loyers encaissés / taux d'occupation). Dernier point = valeur courante |

### 3.2 Listes

| Composant | Contrat et comportement |
| --- | --- |
| `data-table` | Entrées : `columns` (clé, libellé, triable, alignement, largeur), `rows`, `total`, `page`, `size`, `sorts` (liste ordonnée `{key, dir}`), `loading`. Sorties : `sortChange`, `pageChange`, `rowClick`. Gabarits de cellule et de ligne vide. Tri cumulatif au clic : aucun, ▲, ▼, retiré ; rang affiché si plusieurs tris ; indicateur ↕ à opacité réduite sur les colonnes non triées ; bouton « Annuler les tris (n) ». Tri et pagination **côté serveur**. Lignes atténuées pour les anciens (locataires, comptes désactivés). Info-bulles sur toutes les icônes d'action, y compris la raison d'un blocage (icône grisée mais l'info-bulle reste affichée) |
| `pagination` | Compteur « x–y sur n » et boutons. Page ramenée à la dernière si hors limite, retour page 1 à tout changement de filtre, de recherche ou de tri |
| `filter-pills` | Boutons de filtre avec compteur et indicateur dégradé qui glisse. Les compteurs viennent de l'API et tiennent compte de la recherche. Tient sur une ligne, défile horizontalement si nécessaire |
| `search-input` | Champ avec icône loupe, 40px de haut, déclenchement anticipé (debounce) |
| `status-badge` | Pastille en dégradé : entrée `color` (primary, info, success, warning, danger, dark, ancien) et libellé. Les correspondances statut → couleur sont dans la maquette (composant Badge du design system) |
| `avatar` | Cercle d'initiales, dégradé par profil ou « ancien » |

### 3.3 Formulaires

| Composant | Contrat et comportement |
| --- | --- |
| `form-field` | Libellé 12/700 majuscules, astérisque rouge si obligatoire, message d'erreur. À l'envoi, **tous** les champs obligatoires vides passent en rouge d'un coup (bordure et libellé `#D40505`) ; le rouge disparaît dès la saisie dans le champ. Les erreurs `fieldErrors` du back se rattachent au champ par son nom |
| `date-input` | `ControlValueAccessor`, valeur ISO `yyyy-MM-dd`, affichage et saisie `jj/mm/aaaa` avec masque automatique. Une date inexistante vide le champ. Calendrier : semaine commençant le lundi (L M M J V S D), jour du jour en évidence, bouton « Aujourd'hui », navigation mois et année |
| `money-input` | Décimal à 2 chiffres, virgule à l'affichage, suffixe €. Valeur `number` |
| `switch` | Interrupteur avec libellé ; état désactivé et mention (« Verrouillé : le garage est loué. ») |
| `rich-text` | Enveloppe Quill (`ControlValueAccessor`, valeur HTML). Hauteur minimale 120px, placeholder en italique. Surlignage rouge de la barre et du conteneur si obligatoire et vide. Sortie à assainir côté back |
| `variable-chips` | Liste de variables `{nom}`… groupées ; un clic insère à l'emplacement du curseur dans le champ ou l'éditeur actif |
| `password-input` | Champ mot de passe avec icône œil |
| `tenant-picker` | Recherche (nom, prénom, accents ignorés) + liste de 5 par page, chaque ligne indique « Actuel » ou « Ancien » |
| `stepper` | Étapes numérotées avec Précédent / Suivant (création d'utilisateur, assistant du journal d'audit) |
| `recipient-table` | Cases à cocher par ligne, case d'en-tête à état indéterminé, compteur « Envoyer (n) » désactivé à 0, aperçu par ligne (œil) |

### 3.4 Fenêtres et retours

| Composant | Contrat et comportement |
| --- | --- |
| `modal` | Surcouche `rgba(52,71,103,.45)`, largeur 440 à 480px, rayon 12, en-tête et pied séparés par `1px solid #E9ECEF`, titre 18px/700, croix de fermeture, fermeture par clic sur la surcouche et par Échap, piégeage du focus, retour du focus à l'ouverture. Variante large pour historiques, remarques, aperçu d'e-mail. Bouton Enregistrer avec état « Enregistrement… » et spinner |
| `confirm-dialog` | Titre, message, boutons Oui / Non ou libellés personnalisés, variante danger |
| `tooltip` (directive) | Fond `#212529`, texte blanc 12px/600, flèche ; au-dessus de l'élément, en dessous s'il n'y a pas la place ; reste dans la fenêtre. Fonctionne aussi sur les éléments désactivés |
| `toast` | Message de succès ou d'erreur, disparaît après 4 s |
| `temp-password-dialog` | Affiche le mot de passe temporaire une seule fois, bouton Copier, mention de non-réaffichage |

### 3.5 Composants métier

| Composant | Contrat et comportement |
| --- | --- |
| `remarks-panel` | Liste des remarques d'un garage ou d'un locataire (plus récentes d'abord), formulaire (type Information / Problème / Autre, texte riche, interrupteur « Résolu » et date de résolution pour Problème en modification), suppression selon le droit |
| `rent-history-modal` | Historique des loyers, 5 par page, formulaire nouveau / modifier / supprimer le dernier loyer, blocages RG-LOY-08 et 09 avec info-bulles |
| `lease-history-modal` | Historique des locations d'un garage, 5 par page |
| `payment-detail` | Dû, reçu, reste dû et liste des versements (date, mode en icône, montant), annulation selon le droit |
| `timeline` | Chronologie d'un locataire : événements avec icône, titre, pastille, montant, date et heure, description tronquée à 5 lignes avec « voir plus », « Afficher plus (n) » |
| `email-preview` | Champs De, Cci, À, Objet, corps HTML, signature ajoutée |
| `rights-grid` | Grille profils × écrans avec cases à bascule (coche verte, croix, tiret si non applicable), cellule verrouillée pour l'Admin, pastille orange sur les cases modifiées, sections repliables, brouillon non enregistré |
| `diff-table` | Tableau Champ / avant / après du journal d'audit, mise en évidence mot à mot des textes modifiés, valeurs masquées |
| `audit-wizard` | Assistant 4 étapes : période (avec calendrier et raccourcis), utilisateurs, concepts, validation |

## 4. Services et intercepteurs (`src/app/core`)

| Élément | Rôle |
| --- | --- |
| `AuthService` | Connexion, déconnexion, jeton JWT, profil courant (signal), changement de mot de passe, mot de passe oublié, réinitialisation, mot de passe temporaire à changer |
| `authInterceptor` | Ajoute le jeton ; sur 401, retour à la connexion |
| `errorInterceptor` | Traduit 409 / 422 / 403 / 404 / 503 en erreur typée `ApiError {code, message, fieldErrors?, details?}`. Sur 503 `MAINTENANCE`, redirige vers la page de maintenance |
| `RightsService` | `can(ecran, action)` avec `action` dans `v | a | m | d`, chargé après connexion depuis l'API. Pilote le masquage des boutons, les fenêtres en consultation et le menu. Le back reste l'autorité |
| `rightsGuard` | Garde de route par écran (droit `v`), redirection vers le premier écran autorisé |
| `DeviceService` | Mode ordinateur / tablette / smartphone selon la largeur, et écrans autorisés par appareil (réglage lu depuis l'API) |
| `SettingsService` | Paramètres utiles au front : `lignes_liste`, `lignes_hist`, `graph_mois`, `langue_defaut`, `menu_replie`, `inactivite_min`, `mdp_min`, `jour_limite` |
| `IdleService` | Déconnexion après `inactivite_min` minutes d'inactivité |
| `I18nService` | Langue FR/EN, choix mémorisé (`gg-lang`), langue par défaut = paramètre |
| `PreferencesService` | Dernière page visitée (`gg-page`), menu replié |
| `maintenanceGuard` / vérification périodique | Page « Site en maintenance » avec « Réessayer » et contrôle espacé (15 à 30 s) |
| Pipes | `eur` (`currency:'EUR':'symbol':'1.2-2':'fr'`), `dateFr` (ISO → jj/mm/aaaa) |

La date du jour utilisée pour les valeurs par défaut (date de paiement, « Aujourd'hui ») est celle renvoyée par l'API, pour rester cohérente avec le `Clock` du back.

## 5. Comportements transversaux à respecter

- **Aucune règle métier dans le front.** Statuts, soldes, retards et blocages viennent de l'API.
- Pagination, tri multi-colonnes, filtres et recherche sont envoyés au serveur : `?page=0&size=10&sort=col,asc&sort=col2,desc&statut=…&q=…`.
- Erreur métier (409) ou de validation (422) : message affiché en rouge dans la fenêtre, sans la fermer. Alerte doublon locataire : 409 `LOCT_DOUBLON`, bouton « Enregistrer quand même », second clic avec `?force=true`.
- Fenêtres en consultation quand le droit « modifier » manque : champs désactivés, pas de bouton Enregistrer, intitulé « Visualiser … ».
- Cibles cliquables d'au moins 30px (taille des boutons ronds de la maquette), focus visible, info-bulles sur les icônes d'action.
- Mémoriser côté navigateur : dernière page, langue, menu replié.
- Les valeurs de démonstration, le sélecteur de rôle, le sélecteur de mode d'affichage et toutes les clés `localStorage` listées dans `complements-maquette.md` section 13 ne sont pas à reprendre.

## 6. Tests attendus

- Unitaires : `data-table`, `pagination`, `date-input`, `rich-text`, `rights-grid`, services, gardes, intercepteurs.
- Composant, par écran : chargement, vide, erreur, consultation seule, profil Locataire, hors-appareil, maintenance.
- Comparaison visuelle de chaque écran avec la maquette avant validation.
