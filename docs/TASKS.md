# Plan de travail

Faire valider chaque étape avant la suivante. Un commit par module. Les numéros `RG-xxx` renvoient à `docs/regles-de-gestion.md`.

## Étape 0 : socle (back et front)
- [x] Back : `docker-compose.yml` PostgreSQL, `application.yaml`, Liquibase (XML, dossier `data/` pour le profil dev), `Clock`, CORS, `ApiError` et `@RestControllerAdvice`, Testcontainers.
- [ ] Front : `ng new garages-web --routing --style=scss --ssr=false`, proxy `/api`, tokens SCSS (voir README), Open Sans, Font Awesome, ngx-translate.
- [x] Trancher les « Décisions ouvertes » du README (voir `docs/README-handoff.md` et le chapitre 13 des règles).

## Étape 1 : base de données (back)
- [x] `master.xml` et un changelog Liquibase XML par entité (`liquibase/changes/garage.xml`...) d'après `Modele de donnees.dc.html`, avec plusieurs changesets par table : 8 tables, types, UNIQUE, CHECK, clés étrangères avec RESTRICT/CASCADE comme dans la section Relations.
- [x] Entités JPA (`model`) et repositories. Jeu de données de démonstration en XML dans `liquibase/data/` (profil `dev` uniquement).

## Étape 2 : sécurité et contrat d'API (back)
- [x] Utilisateurs, JWT, rôles, changement de mot de passe, mot de passe oublié (RG-ROL, chapitre 4).
- [x] Rédiger `docs/api-contract.md` : endpoints, DTO, codes d'erreur. Tous les modules de l'étape 3 y sont désormais implémentés ; il reste à le copier dans le projet front.

## Étape 3 : modules back, dans l'ordre
Chaque module : services, contrôleurs, tests par règle.
1. [x] Garages et loyers (chapitres 5 et 6) : numéro auto `G##`, premier loyer à la création, historique, blocages RG-LOY-08/09, suppression avec motifs.
2. [x] Locataires (chapitre 7) : statut calculé (actuel, à venir, ancien, sans location) et solde, alerte doublon, suppression avec motifs.
3. [x] Locations (chapitre 8) : statuts calculés, contrôles RG-LOC-13, non-chevauchement, date de fin dernier jour du mois, mois payés, clôture, suppression, historique du garage.
4. [x] Paiements (chapitre 9) : lignes du mois, échéances créées chaque jour pour le mois courant, versements, annulation Admin, retards.
5. [x] Remarques (chapitre 10) : texte enrichi nettoyé (liste blanche), problème résolu ou rouvert, suppression Admin.
6. [x] Tableau de bord (chapitre 11) : indicateurs, séries sur 12 mois, impayés à relancer.

**Le back est terminé (étapes 0 à 3)** : 514 tests, contrat d'API entièrement implémenté, jeu de démonstration au 9 octobre 2026. Les étapes 4 à 6 concernent le front (`garage-web`).

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
