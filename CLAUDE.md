# garages-web : front-end « Gestion de garages »

Copier ce fichier à la racine du projet Angular. Copier aussi dans `docs/` du projet : `docs/regles-de-gestion.md` et tout le dossier `maquette/`.

## Stack
Angular (dernière version stable), composants standalone, signals, SCSS, `@ngx-translate/core` (FR/EN), Font Awesome, Quill (éditeur riche des remarques, via `ngx-quill`), graphiques : `ng2-charts` (Chart.js). Pas de bibliothèque UI imposante : l'apparence est celle de la maquette (design system « Soft UI »), à recréer en SCSS.

## Sources de vérité
- `docs/maquette/Gestion Garages.dc.html` : apparence et interactions. Ouvrir dans un navigateur, lire le HTML pour les valeurs exactes (styles en ligne).
- `docs/maquette/_ds/.../tokens/*.css` : couleurs, espacements, rayons, ombres. À transposer en variables CSS dans `src/styles/_tokens.scss`.
- `docs/regles-de-gestion.md` : comportements, messages, droits. Messages d'erreur du back affichés tels quels.
- `docs/maquette/i18n.js` : dictionnaire FR → EN. À convertir en `src/assets/i18n/fr.json` et `en.json` (clés explicites, pas de texte français comme clé).
- Contrat d'API : `docs/api-contract.md` (à générer par le back à l'étape 2 de `TASKS.md`).

## Structure
```
src/app
├── core/       (api client, auth service, intercepteur JWT, guards, role service, i18n)
├── shared/     (data-table triable multi-colonnes, pagination, filtre à boutons avec compteur,
│                date-input jj/mm/aaaa + calendrier, modal, confirm, badge statut, tooltip, rich-text)
└── features/   (dashboard, garages, loyers, locataires, locations, paiements, remarques, auth)
```

## Conventions
- Le front n'implémente aucune règle métier : il affiche les statuts et erreurs renvoyés par l'API. Il masque ou désactive les actions selon le rôle (RG-ROL), mais le back reste l'autorité.
- Listes : pagination, tri multi-colonnes, filtres et recherche envoyés au serveur (`page`, `size`, `sort=col,dir` répété, `statut`, `q`). Un composant `data-table` partagé porte tri cumulatif (aucun → ▲ → ▼ → retiré), rang du tri, « Annuler les tris (n) », compteur « x–y sur n ».
- Formulaires réactifs typés. À l'envoi, tous les champs obligatoires vides se surlignent en rouge ensemble (bordure `#D40505`) ; le rouge disparaît à la saisie. Les erreurs `fieldErrors` et `message` du back s'affichent dans la fenêtre sans la fermer.
- Alerte doublon locataire : sur 409 `LOCT_DOUBLON`, afficher l'alerte et le bouton « Enregistrer quand même » ; second clic = renvoi avec `?force=true`.
- Dates : saisie et affichage `jj/mm/aaaa` (masque automatique + calendrier avec « Aujourd'hui »), envoi `yyyy-MM-dd`. Une date inexistante vide le champ.
- Montants : pipe `currency:'EUR':'symbol':'1.2-2':'fr'`.
- Rôle Lecture seule : fenêtres en consultation (champs désactivés, intitulé « Visualiser … », pas de bouton Enregistrer).
- Mémoriser côté navigateur : dernière page visitée, langue, état replié du menu (localStorage).
- Accessibilité : cibles cliquables ≥ 32px, focus visible (`0 0 0 3px rgba(226,147,211,.5)`), info-bulles sur les icônes d'action.

## Tests
- Tests unitaires pour `data-table`, `date-input`, les services et les guards. Test de composant par écran sur les états : chargement, vide, erreur, lecture seule.
- Comparer visuellement chaque écran à la maquette avant de valider.

## Commandes
- `ng serve --proxy-config proxy.conf.json` (port 4200, `/api` redirigé vers `http://localhost:8080`)
- `ng test`, `ng build`

## Façon de travailler
- Un écran à la fois, dans l'ordre de `TASKS.md`, après que l'API du module correspondant existe. Un commit par écran.
- Construire d'abord les composants partagés (étape 4 de `TASKS.md`) puis les écrans.
- Poser la question plutôt que deviner quand le comportement n'est pas dans la maquette ou les règles.
