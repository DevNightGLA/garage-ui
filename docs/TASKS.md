# Plan de travail du front v2

Branche `feature/v2-gestion-garages`. Un commit par écran. Les numéros `RG-xxx` renvoient à `docs/regles-de-gestion.md`. Le back v2 est terminé (`garage-api`, même branche) : toutes les API existent.

La v1 (étapes 0 à 6 du premier plan) est livrée : socle, composants partagés, authentification, Garages, Locataires, Locations, Paiements, Tableau de bord, traductions EN, finition.

## Étape 1 : documents et structure
- [x] `CLAUDE.md` v2, documents v2 et maquette complète dans `docs/`, contrat d'API du back.
- [x] Structure v2 : `src/app/layout/` (shell, menu, en-tête) sorti de `core/`.

## Étape 2 : socle v2 (point de validation avec Gregory à la fin)
- [x] Profils v2 (`CONSULTANT`, `LOCATAIRE`), `UtilisateurDTO` v2.
- [x] `SettingsService` (`GET /api/contexte`) : date du jour, lignes par page, mois des graphiques, langue et menu par défaut, inactivité, longueur du mot de passe.
- [x] `RightsService` (`GET /api/droits/moi`) et `rightsGuard` ; `DeviceService` (ordinateur, tablette, smartphone) et écrans par appareil.
- [x] Intercepteur d'erreurs : 503 `MAINTENANCE`, 403 `MOT_DE_PASSE_TEMPORAIRE`, 403 `ACCES_REFUSE`.
- [x] Mot de passe temporaire : écran obligatoire après connexion. Longueur minimale `mdpMin`.
- [x] `IdleService` : déconnexion après `inactiviteMin`.
- [x] Page « Site en maintenance » (Réessayer, vérification toutes les `intervalleVerifSec`).
- [x] Menu en six sections filtré par droits et appareil, pages « non disponible sur cet appareil » et « droit insuffisant ».
- [x] Écrans existants branchés sur `RightsService` au lieu du rôle figé.

## Étape 3 : écrans v2
1. [x] Garages : réalignement v2, pages Historique des loyers et Historique des locations.
2. [ ] Locataires : réalignement v2, Chronologie.
3. [ ] Locations (durée minimale, nouveaux codes) et Paiements.
4. [ ] Tableau de bord v2 (cartes Avis de loyer et Remarques à traiter, `graphMois`) et Statistiques (4 pages).
5. [ ] Envoi de messages : avis de loyer, relances d'impayés, message libre.
6. [ ] Paramètres et modèles de messages.
7. [ ] Utilisateurs (création en deux étapes, mot de passe temporaire, désactivation, suppression).
8. [ ] Droits d'accès (écrans, actions, appareils).
9. [ ] Journal d'audit (assistant, détail avant / après, fil conducteur).
10. [ ] Maintenance (interrupteur, prévisualisation).
11. [ ] Traductions EN des nouveaux écrans et messages.

## Étape 4 : finition
- [ ] Parcours de bout en bout par profil (Admin, Gestionnaire, Locataire, Consultant) et par appareil.
- [ ] Revue des écarts avec la maquette, accessibilité, build de production.
