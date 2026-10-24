# Plan de travail

Faire valider chaque étape avant la suivante. Un commit par module. Les numéros `RG-xxx` renvoient à `docs/regles-de-gestion.md`.

## Étape 0 : socle (back et front)
- [ ] Back : `docker-compose.yml` PostgreSQL, `application.yml`, Flyway, `Clock`, CORS, `ApiError` et `@RestControllerAdvice`, Testcontainers.
- [ ] Front : `ng new garages-web --routing --style=scss --ssr=false`, proxy `/api`, tokens SCSS (voir README), Open Sans, Font Awesome, ngx-translate.
- [ ] Trancher les « Décisions ouvertes » du README.

## Étape 1 : base de données (back)
- [ ] `V1__init.sql` d'après `Modele de donnees.dc.html` : 8 tables, types, UNIQUE, CHECK, clés étrangères avec RESTRICT/CASCADE comme dans la section Relations.
- [ ] Entités JPA et repositories. Jeu de données de démonstration (profil `dev`).

## Étape 2 : sécurité et contrat d'API (back)
- [ ] Utilisateurs, JWT, rôles, changement de mot de passe, mot de passe oublié (RG-ROL, chapitre 4).
- [ ] Rédiger `docs/api-contract.md` : endpoints, DTO, codes d'erreur. Le copier dans le projet front.

## Étape 3 : modules back, dans l'ordre
Chaque module : services, contrôleurs, tests par règle.
1. [ ] Garages et loyers (chapitres 5 et 6) : numéro auto `G##`, premier loyer à la création, historique, blocages RG-LOY-08/09, suppression avec motifs.
2. [ ] Locataires (chapitre 7) : statut calculé, alerte doublon, suppression avec motifs.
3. [ ] Locations (chapitre 8) : statuts calculés, contrôles RG-LOC-13, date de fin dernier jour du mois, clôture, suppression.
4. [ ] Paiements (chapitre 9) : lignes du mois, échéances, versements, annulation Admin, retards.
5. [ ] Remarques (chapitre 10).
6. [ ] Tableau de bord (chapitre 11) : indicateurs, séries sur 12 mois, impayés à relancer.

## Étape 4 : composants partagés (front)
- [ ] `data-table` (tri multi-colonnes, pagination, compteur), filtre à boutons avec compteurs, `date-input` + calendrier, modal et confirmation, badges de statut, éditeur riche, layout (menu latéral repliable, en-tête, sélecteur de langue).
- [ ] Authentification : connexion, intercepteur JWT, guard de rôle, mot de passe oublié, changement de mot de passe.

## Étape 5 : écrans front, dans l'ordre
1. [ ] Garages + historique des loyers + historique des locations (+ remarques).
2. [ ] Locataires (+ remarques).
3. [ ] Locations.
4. [ ] Paiements.
5. [ ] Tableau de bord.
6. [ ] Traductions EN complètes d'après `maquette/i18n.js`.

## Étape 6 : finition
- [ ] Parcours de bout en bout par rôle (Admin, Gestionnaire, Lecture seule).
- [ ] Revue des écarts avec la maquette, accessibilité, build de production.
