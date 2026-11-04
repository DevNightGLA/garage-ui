# garages-web : front-end « Gestion de garages »

Copier ce fichier à la racine du projet Angular (`garages-web/CLAUDE.md`). Copier aussi dans `docs/` du projet : tout le dossier `docs/` du handoff (règles, compléments, prérequis des composants) et tout le dossier `maquette/` dans `docs/maquette/`.

## Stack
Angular (dernière version stable), composants standalone, signals, SCSS, `@ngx-translate/core` (FR/EN), Font Awesome, Quill (`ngx-quill`), `ng2-charts` (Chart.js). Pas de bibliothèque UI : l'apparence est celle de la maquette (design system « Soft UI »), recréée en SCSS. Détail et contrat des composants : `docs/prerequis-composants.md`.

## Sources de vérité (ordre de priorité)
1. `docs/complements-maquette.md` : profils, droits, utilisateurs, authentification, journal d'audit, maintenance, chronologie, statistiques, message libre, appareils.
2. `docs/regles-de-gestion.md` : comportements, messages, droits. Messages d'erreur du back affichés tels quels.
3. `docs/maquette/Gestion Garages.dc.html` : apparence et interactions (ouvrir dans un navigateur, lire le HTML pour les valeurs exactes). Écrans de configuration : `Gestion des utilisateurs.dc.html` (utilisateurs, droits d'accès, maintenance), `Journal audit.dc.html`, `Site en maintenance.dc.html`. Garder le dossier tel quel : `dc-runtime.js`, `i18n.js`, `droits.js` et `ds/` sont chargés en relatif.
4. `docs/maquette/ds/.../tokens/*.css` : couleurs, espacements, rayons, ombres, à transposer dans `src/styles/_tokens.scss` (valeurs corrigées dans `prerequis-composants.md` section 2).
5. `docs/maquette/i18n.js` : dictionnaire FR → EN, à convertir en `src/assets/i18n/fr.json` et `en.json` (clés explicites, pas de texte français comme clé).
6. Contrat d'API : `docs/api-contract.md` (généré par le back à l'étape 2 de `TASKS.md`).

## Structure
```
src/app
├── core/       (auth, intercepteurs JWT et erreurs, RightsService, DeviceService, SettingsService, I18n, guards)
├── shared/     (data-table, pagination, filter-pills, date-input, modal, confirm, tooltip, toast, rich-text,
│                status-badge, form-field, stepper, recipient-table, rights-grid, timeline, diff-table…)
├── layout/     (app-shell, sidebar-menu, page-header)
└── features/   (auth, dashboard, statistiques, garages, loyers, locataires, chronologie, locations, paiements,
                 remarques, messages (avis, relances, libre), parametres, modeles, utilisateurs, droits,
                 audit, maintenance)
```

## Conventions
- Le front n'implémente aucune règle métier : il affiche les statuts et erreurs renvoyés par l'API. Il masque ou désactive les actions selon les droits (`RightsService.can(ecran, action)`), mais le back reste l'autorité.
- **Droits** : quatre profils (Admin, Gestionnaire, Locataire, Consultant). Les droits viennent de l'API, pas du profil codé en dur. Un écran sans droit `v` n'apparaît pas au menu et sa route redirige. Sans droit `m`, les fenêtres s'ouvrent en consultation (« Visualiser … »). Le profil Locataire ne voit que ses données : c'est le back qui filtre.
- **Appareils** : ordinateur > 1024 px, tablette 641 à 1024 px, smartphone ≤ 640 px. Les écrans retirés pour un appareil disparaissent du menu (réglage de l'Admin). Les sélecteurs de rôle et de mode d'affichage de la maquette ne sont pas à reprendre.
- Listes : pagination, tri multi-colonnes, filtres et recherche envoyés au serveur (`page`, `size`, `sort=col,dir` répété, `statut`, `q`). Le `data-table` partagé porte tri cumulatif, rang, « Annuler les tris (n) », compteur « x–y sur n ». Nombre de lignes par page = paramètres `lignes_liste` (listes) et `lignes_hist` (historiques, cartes, choix du locataire).
- Formulaires réactifs typés. À l'envoi, tous les champs obligatoires vides se surlignent en rouge ensemble (bordure `#D40505`), le rouge disparaît à la saisie. `fieldErrors` et `message` du back s'affichent dans la fenêtre sans la fermer.
- Alerte doublon locataire : sur 409 `LOCT_DOUBLON`, afficher l'alerte et « Enregistrer quand même » ; second clic = renvoi avec `?force=true`.
- Dates : saisie et affichage `jj/mm/aaaa` (masque + calendrier avec « Aujourd'hui »), envoi `yyyy-MM-dd`. Une date inexistante vide le champ.
- Montants : pipe `currency:'EUR':'symbol':'1.2-2':'fr'`.
- Mot de passe temporaire : après connexion, écran obligatoire de choix d'un nouveau mot de passe. Le mot de passe temporaire d'un compte créé ou réinitialisé ne s'affiche qu'une fois.
- Maintenance : sur 503 `MAINTENANCE`, rediriger vers « Site en maintenance » ; bouton « Réessayer » et contrôle périodique espacé.
- Éditeur riche (remarques, modèles, message libre, signature) : HTML conservé tel quel dans l'envoi et dans la remarque créée ; variables insérées au clic.
- Mémoriser côté navigateur : dernière page visitée, langue, menu replié.
- Accessibilité : cibles cliquables ≥ 30 px, focus visible (`0 0 0 3px rgba(226,147,211,.5)`), info-bulles sur les icônes d'action, y compris la raison d'un blocage.

## Tests
- Unitaires : `data-table`, `date-input`, `rights-grid`, services, guards, intercepteurs.
- Composant par écran : chargement, vide, erreur, consultation seule, profil Locataire, appareil restreint, maintenance.
- Comparer visuellement chaque écran à la maquette avant de valider.

## Commandes
- `ng serve --proxy-config proxy.conf.json` (port 4200, `/api` redirigé vers `http://localhost:8080`)
- `ng test`, `ng build`

## Façon de travailler
- Un écran à la fois, dans l'ordre de `TASKS.md`, après que l'API du module correspondant existe. Un commit par écran.
- Construire d'abord les composants partagés (étape 4) puis les écrans.
- Poser la question plutôt que deviner quand le comportement n'est ni dans la maquette ni dans les règles, ou qu'il est marqué « (à confirmer) ».

## Décisions du projet (04/11/2026)
- **Contrat et décisions du back** : `docs/api-contract.md` est la copie de `garage-api/docs/api-contract.md` (v2) et prime pour tout ce qui touche à l'API ; les choix du back sont dans `garage-api/docs/decisions-v2.md` (4 statuts de locataire, suppression d'un compte possible, retard selon `jour_limite`, loyers encaissés par mois de paiement…). `docs/regles-de-gestion.md` est la version consolidée v2 (chapitres 1 à 24, compléments inclus).
- **Suppression d'un compte** : bouton « Supprimer » dans les actions de la ligne Utilisateurs, avec confirmation, si le droit `USR` d est accordé.
- **Page « Site en maintenance »** : l'intervalle de vérification est le paramètre `maintenance_verif_sec` (catégorie Sécurité, 5 à 300 s, 15 par défaut), lu dans `GET /api/maintenance/etat` (`intervalleVerifSec`).
- **Historiques** : « Historique des loyers » et « Historique des locations » sont des pages du menu avec choix du garage, et restent ouvrables depuis la ligne d'un garage. Statistiques : quatre sous-pages du menu.
- **Cibles cliquables** : 32 px (couvre les 30 px minimum).
- **Branche** : tout le travail v2 sur `feature/v2-gestion-garages`, un commit par écran ; Gregory fusionne dans `develop`.
