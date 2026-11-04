# garages-web : front-end « Gestion de garages »

Version 2. Tous les écrans du menu sont réalisés (voir `docs/TASKS.md`).

## Stack
Angular 22, composants standalone, signals, OnPush, SCSS, `@ngx-translate/core` (FR/EN), Font Awesome, Quill (`ngx-quill`), `ng2-charts` (Chart.js). Pas de bibliothèque UI : l'apparence est celle de la maquette (design system « Soft UI »), recréée en SCSS (`src/styles/_tokens.scss`, `src/styles/_ui.scss`).

## Sources de vérité (ordre de priorité)
1. `docs/api-contract.md` : contrat d'API v2, pour tout ce qui touche à l'API. Les choix du back sont dans `garage-api/docs/decisions-v2.md`.
2. `docs/regles-de-gestion.md` : règles `RG-xxx` v2 consolidées (chapitres 1 à 24, compléments de la maquette inclus), messages à reprendre tels quels. Messages d'erreur du back affichés tels quels.
3. `docs/decisions-front.md` : choix faits pendant la réalisation des écrans.
4. `docs/maquette/Gestion Garages.dc.html` : apparence et interactions (ouvrir dans un navigateur, lire le HTML pour les valeurs exactes). Écrans de configuration : `Gestion des utilisateurs.dc.html` (utilisateurs, droits d'accès, maintenance), `Journal audit.dc.html`, `Site en maintenance.dc.html`. Garder le dossier tel quel : `dc-runtime.js`, `i18n.js`, `droits.js` et `ds/` sont chargés en relatif.
5. `docs/maquette/i18n.js` : dictionnaire FR → EN de référence pour `src/assets/i18n/en.json`.

`docs/api-contract.md` et `docs/regles-de-gestion.md` sont des **copies** de `garage-api/docs/` : ne pas les modifier ici, les recopier quand le back les change.

## Structure
```
src/app
├── core/       api (intercepteurs JWT, session, erreurs), auth (AuthService, guards), rights (RightsService,
│               screenRights, screenGuard, homeGuard), SettingsService, DeviceService, IdleService, LanguageService
├── layout/     shell, sidebar, en-tête, nav-items (menu), info-pages (écran non disponible, accès refusé)
├── shared/     data-table (tri cumulatif, appCell, appHeader), pagination, filter-buttons, segmented, search-input,
│               date-input, month-picker, year-picker, form-field, password-input, rich-text, variable-chips,
│               modal, confirm, toast, tooltip, popover-menu, stepper, toggle-cell, diff-table, email-preview,
│               status-badge, stat-tiles, summary-card, task-card, timeline, pick-list, clamp-text, bar-chart, pie-chart
└── features/   auth, tableau-de-bord, statistiques, garages, locataires, chronologie, locations, paiements, remarques,
                messages (avis, relances, libre), parametres, modeles, utilisateurs, droits, journal, maintenance
```
Un écran = une entrée de `layout/nav-items.ts` et son chargement dans `SCREENS` (`app.routes.ts`) ; `SCREEN_DATA` donne la `vue` d'un composant partagé par plusieurs pages.

## Conventions
- Le front n'implémente aucune règle métier : il affiche les statuts et erreurs renvoyés par l'API. Il masque ou désactive les actions selon les droits (`RightsService.can(ecran, action)`, `screenRights('GAR')` dans un composant), mais le back reste l'autorité.
- **Droits** : quatre profils (Admin, Gestionnaire, Locataire, Consultant). Les droits viennent de l'API (`GET /api/droits/moi`), pas du profil codé en dur. Un écran sans droit `v` n'apparaît pas au menu et sa route redirige vers l'accueil. Sans droit `m`, les fenêtres s'ouvrent en consultation (« Visualiser … »). Le profil Locataire ne voit que ses données : c'est le back qui filtre.
- **Appareils** : ordinateur > 1024 px, tablette 641 à 1024 px, smartphone ≤ 640 px. Les écrans retirés pour un appareil disparaissent du menu (réglage de l'Admin) ; un accès direct affiche le message de RG-APP-04.
- Listes : pagination, tri multi-colonnes, filtres et recherche envoyés au serveur (`page`, `size`, `sort=col,dir` répété, `statut`, `q`). Le `data-table` partagé porte tri cumulatif, rang, « Annuler les tris (n) », compteur « x–y sur n ». Nombre de lignes par page = paramètres `lignes_liste` (listes) et `lignes_hist` (historiques, cartes, choix du locataire), lus dans `SettingsService`.
- Formulaires réactifs typés. À l'envoi, tous les champs obligatoires vides se surlignent en rouge ensemble (`FormField`), le rouge disparaît à la saisie. `fieldErrors` et `message` du back s'affichent dans la fenêtre sans la fermer. Un éditeur riche ou un groupe de boutons se place dans `<app-form-field [group]="true">` (pas de `<label>` autour : un clic activerait son premier bouton).
- Alerte doublon locataire : sur 409 `LOCT_DOUBLON`, afficher l'alerte et « Enregistrer quand même » ; second clic = renvoi avec `?force=true`.
- Dates : saisie et affichage `jj/mm/aaaa` (masque + calendrier avec « Aujourd'hui »), envoi `yyyy-MM-dd`. Une date inexistante vide le champ. Date du jour : `SettingsService.today()` (celle du serveur).
- Montants : pipe `currency:'EUR':'symbol':'1.2-2':'fr'` ou `formatCurrency(…, 'fr', '€', 'EUR', '1.2-2')`.
- Mot de passe temporaire : après connexion, écran obligatoire de choix d'un nouveau mot de passe. Le mot de passe temporaire d'un compte créé ou réinitialisé ne s'affiche qu'une fois.
- Maintenance : sur 503 `MAINTENANCE`, rediriger vers « Site en maintenance » ; bouton « Réessayer » et vérification toutes les `intervalleVerifSec` secondes (paramètre `maintenance_verif_sec`).
- Éditeur riche (remarques, modèles, message libre, signature) : HTML conservé tel quel dans l'envoi et dans la remarque créée ; variables insérées au curseur (`variable-chips` + `RichText.insertText`).
- Messages de succès : `ToastService.show(texte)`.
- Mémoriser côté navigateur : dernière page visitée, langue, menu replié.
- Traductions : clés explicites dans `src/assets/i18n/fr.json` et `en.json`, jamais de texte français comme clé ; le test `i18n-parite.spec.ts` vérifie que les deux fichiers ont les mêmes clés.
- Accessibilité : cibles cliquables ≥ 32 px, focus visible (`0 0 0 3px rgba(226,147,211,.5)`), info-bulles sur les icônes d'action, y compris la raison d'un blocage. `appTooltip` pose un `aria-label` sur un élément sans texte : pour garder un nom distinct de l'info-bulle, mettre un texte `visually-hidden` dans l'élément.

## Tests
- Unitaires : composants partagés, services, guards, intercepteurs.
- Composant par écran : chargement, vide, erreur, consultation seule, profil Locataire, appareil restreint, maintenance.
- Aides : `src/testing/rights.ts` (`signInAs`, `defaultDroits`, `withRight`, `revokeRight`), `src/testing/match-media.ts` (`mockViewport`), `src/testing/translations.ts`.
- Pas de `whenStable` tant qu'une requête simulée est ouverte : boucle `setTimeout` + `detectChanges`. jsdom : Quill écrit les espaces saisis en `&nbsp;` ; `Range.getBoundingClientRect` est à simuler pour placer le curseur.
- Comparer visuellement chaque écran à la maquette avant de valider.

## Commandes
- `npm start` (`ng serve`, port 4200, `/api` redirigé vers `http://localhost:8080` par `proxy.conf.json`)
- `npm test`, `npm run build`

## Façon de travailler
- Un écran ou un sujet par commit ; ne committer qu'avec tous les tests verts.
- Avant de coder, relire le chapitre des règles et la partie de la maquette concernés.
- Poser la question plutôt que deviner quand le comportement n'est ni dans la maquette ni dans les règles, ou qu'il est marqué « (à confirmer) ». Noter le choix retenu dans `docs/decisions-front.md`.

## Décisions du projet (04/11/2026)
- **Branche** : tout le travail v2 sur `feature/v2-gestion-garages` ; Gregory fusionne dans `develop`.
- **Suppression d'un compte** : bouton « Supprimer » dans les actions de la ligne Utilisateurs, avec confirmation, si le droit `USR` d est accordé.
- **Page « Site en maintenance »** : l'intervalle de vérification est le paramètre `maintenance_verif_sec` (catégorie Sécurité, 5 à 300 s, 15 par défaut), lu dans `GET /api/maintenance/etat` (`intervalleVerifSec`).
- **Historiques** : « Historique des loyers » et « Historique des locations » sont des pages du menu avec choix du garage, et restent ouvrables depuis la ligne d'un garage. Statistiques : quatre sous-pages.
- **Tableau de bord** : suit la maquette (cartes, sans graphiques ; les graphiques sont dans Statistiques).
- **Cibles cliquables** : 32 px (couvre les 30 px minimum).

Les autres choix, en attente de validation, sont dans `docs/decisions-front.md`.
