# Gestion de garages : interface web

Front-end de l'application de gestion de la location de garages : garages et historiques des loyers et des locations,
locataires et chronologie, locations, paiements, remarques, envoi de messages (avis de loyer, relances d'impayés, message
libre), tableau de bord, statistiques, et Configuration (paramètres, modèles de messages, utilisateurs, droits d'accès,
journal d'audit, maintenance). Quatre profils : Admin, Gestionnaire, Locataire, Consultant. Interface FR/EN, adaptée à
l'ordinateur, à la tablette et au smartphone.

Angular 22 (composants standalone, signals, OnPush), TypeScript, SCSS, `@ngx-translate/core`, Quill (`ngx-quill`),
`ng2-charts` (Chart.js), Font Awesome, Open Sans. Pas de bibliothèque UI : l'apparence « Soft UI » de la maquette est
recréée en SCSS.

## Prérequis
- Node.js et npm (versions de `package.json`).
- Le back **garage-api** démarré sur <http://localhost:8080> (voir son README).

## Démarrage
```bash
npm install
```
```bash
npm start
```
L'application s'ouvre sur <http://localhost:4200>. Les appels `/api` sont redirigés vers le back par `proxy.conf.json`.

Avec le back en profil `dev`, les comptes de démonstration ont le mot de passe `Garages2026!` : `admin` (Admin),
`gestionnaire`, `consultant`, `mdupont` (Locataire relié à Marie Dupont), `ancien.gestionnaire` (désactivé) et `nouveau`
(mot de passe temporaire, à changer à la connexion).

## Tests et build
```bash
npm test
```
Tests unitaires et de composants (Vitest, via `ng test`). Ne pas valider un travail avec des tests rouges.
```bash
npm run build
```
Build de production dans `dist/garages-web/`.

## Structure
```
src/app
├── core/       contexte (SettingsService), droits (RightsService, guards), appareil, inactivité, langue, intercepteurs
├── layout/     cadre de l'application, menu latéral, en-tête, pages d'information
├── shared/     composants génériques (data-table, modal, date-input, rich-text, toast, stepper, diff-table…)
└── features/   un dossier par écran ou domaine (garages, locataires, messages, utilisateurs, droits, journal…)
src/assets/i18n fr.json et en.json
src/styles      tokens et styles communs
src/testing     aides de test (profils et droits, largeur d'écran, traductions)
```

## Documentation
| Fichier | Contenu |
| --- | --- |
| `CLAUDE.md` | Conventions du projet et décisions validées |
| `docs/decisions-front.md` | Choix faits pendant la réalisation des écrans, validés ou à valider |
| `docs/TASKS.md` | Plan de travail du front v2 |
| `docs/regles-de-gestion.md` | Règles de gestion `RG-xxx` (copie de `garage-api/docs`) |
| `docs/api-contract.md` | Contrat d'API (copie de `garage-api/docs`) |
| `docs/maquette/` | Maquette HTML : apparence, interactions, dictionnaire FR → EN (`i18n.js`) |

## Git
Branches `master` et `develop` ; le travail se fait sur une branche `feature/…`, fusionnée dans `develop`. Ne pas committer
directement sur `develop` ni sur `master`.
