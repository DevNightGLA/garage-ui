# Contrat d'API : Gestion de garages

Contrat entre `garages-api` (Spring Boot) et `garages-web` (Angular). À copier dans le projet front.

Statut de chaque partie :
- **Implémenté** : testé, le front peut s'y brancher (conventions, authentification, comptes).
- **Proposé** : tiré des règles de gestion (`docs/regles-de-gestion.md`, notées `RG-xxx`), à valider avant l'implémentation du module correspondant (étape 3). Les messages d'erreur sont ceux des règles, mot pour mot. Un message marqué *(proposé)* n'existe pas dans les règles : il est à valider.

---

## 1. Conventions générales (implémenté)

| Sujet | Règle |
| --- | --- |
| Base | Tous les endpoints sont sous `/api`. JSON UTF-8. |
| Dates | `yyyy-MM-dd` (`2026-10-09`). Date et heure : `yyyy-MM-dd'T'HH:mm:ss`. Mois : `yyyy-MM`. |
| Montants | Nombres décimaux en euros, 2 décimales (`90.00`). Le formatage `1 234,50 €` est fait par le front. |
| Énumérations | Valeurs en majuscules (`ADMIN`, `A_VENIR`, `LECTURE_SEULE`). |
| Statuts calculés | Fournis par l'API, jamais recalculés par le front. Ils dépendent de la date du jour du serveur. |
| Authentification | En-tête `Authorization: Bearer <accessToken>` sur tous les endpoints, sauf ceux marqués **public**. |
| CORS | `http://localhost:4200` autorisé. |

### Un DTO par ressource

Chaque ressource a un seul objet JSON, nommé `XxxDTO`, utilisé en requête **et** en réponse : créer un utilisateur envoie un `UtilisateurDTO` et reçoit un `UtilisateurDTO`.
- En entrée, les champs calculés ou en lecture seule (`id`, statuts calculés...) sont ignorés.
- Certains champs sont en écriture seule : ils ne sont jamais renvoyés (par exemple `motDePasse`).
- Ce qui est obligatoire peut différer entre la création (`POST`) et la modification (`PUT`) : le tableau de chaque ressource le précise. Un champ manquant ou invalide renvoie 422 avec tous les `fieldErrors` d'un coup.
- Seules les opérations qui ne sont pas une lecture ou une écriture de la ressource ont leur propre objet (par exemple le changement de mot de passe).

### Pagination, tri, recherche

Les listes acceptent `?page=0&size=10&sort=numero,asc&sort=cles,desc&q=texte`.
- `page` commence à 0. `size` vaut 10 par défaut (5 pour les historiques, 3 pour les impayés du tableau de bord, à demander par le front), 100 au maximum.
- `sort=propriété,asc|desc`, répétable : le tri est cumulatif dans l'ordre des paramètres. Un tri sur une propriété non prévue renvoie 400 `REQUETE_INVALIDE`.
- `q` : recherche insensible à la casse et aux accents (RG-LST-04).
- Réponse :

```json
{ "content": [ ... ], "page": 0, "size": 10, "totalElements": 42, "totalPages": 5 }
```

Une page au-delà de la dernière renvoie une liste vide : le front revient à la dernière page (RG-LST-02).

### Format des erreurs

Toute erreur, y compris 401 et 403, a ce corps :

```json
{
  "code": "GAR_NUM_EXISTE",
  "message": "Ce numéro de garage existe déjà.",
  "fieldErrors": { "numero": "..." },
  "details": [ "..." ]
}
```

- `code` : identifiant stable, à utiliser par le front pour l'internationalisation.
- `message` : texte français de la règle, affiché tel quel.
- `fieldErrors` : présent seulement pour les erreurs de validation (422), il contient **tous** les champs fautifs d'un coup (RG-VAL-01) : `{ nomDuChamp: message }`.
- `details` : toujours présent (liste vide par défaut). Il porte les motifs détaillés, par exemple d'un refus de suppression.

| HTTP | Sens | Codes génériques |
| --- | --- | --- |
| 400 | Requête inexploitable (JSON illisible, tri inconnu, valeur d'énumération inconnue) | `REQUETE_INVALIDE` |
| 401 | Pas de jeton valide, ou identifiants incorrects | `NON_AUTHENTIFIE`, `AUTH_*` |
| 403 | Droits insuffisants pour cette action | `ACCES_REFUSE` : « Droits insuffisants pour cette action. » |
| 404 | Ressource inexistante | `RESSOURCE_INTROUVABLE`, `XXX_INTROUVABLE` |
| 405 | Méthode non autorisée | `METHODE_NON_AUTORISEE` |
| 409 | Règle de gestion violée (message de la règle) | un code par règle |
| 422 | Champs obligatoires manquants ou invalides | `VALIDATION` : « Des champs obligatoires sont manquants ou invalides. » |
| 500 | Erreur inattendue (aucun détail technique exposé) | `ERREUR_INTERNE` |

Alerte non bloquante (RG-LOCT-04) : 409 `LOCT_DOUBLON`. La même requête avec `?force=true` enregistre.

### Rôles et droits (RG chapitre 4)

| Action | `LECTURE_SEULE` | `GESTIONNAIRE` | `ADMIN` |
| --- | --- | --- | --- |
| Consulter (garages, locataires, locations, paiements, remarques, historiques, tableau de bord) | oui | oui | oui |
| Créer, modifier, clôturer, payer, gérer les remarques et les loyers | non | oui | oui |
| Annuler un versement, supprimer garage, locataire, location, remarque | non | non | oui (sous conditions) |
| Gérer les comptes utilisateurs | non | non | oui |

Le back refuse toute action non autorisée (403) : le front masque les boutons mais ne se fie qu'à l'API.

---

## 2. Authentification (implémenté)

Jeton JWT signé HS256, valable **8 heures**, sans renouvellement : à l'expiration (401), l'utilisateur se reconnecte. Les droits sont relus en base à chaque requête : désactiver un compte ou changer son rôle prend effet immédiatement, sans attendre l'expiration.

Mot de passe : 8 à 72 caractères. Le login n'est pas sensible à la casse.

### `POST /api/auth/connexion` — public

Un même `ConnexionDTO` : `login` et `motDePasse` en entrée (jamais renvoyés), `accessToken`, `tokenType`, `expiresIn` et `utilisateur` en sortie.

Requête :
```json
{ "login": "admin", "motDePasse": "Garages2026!" }
```
Réponse 200 :
```json
{
  "accessToken": "eyJ...",
  "tokenType": "Bearer",
  "expiresIn": 28800,
  "utilisateur": { "id": 1, "login": "admin", "email": "admin@example.com", "role": "ADMIN", "actif": true }
}
```
Erreurs :

| HTTP | Code | Message |
| --- | --- | --- |
| 401 | `AUTH_IDENTIFIANTS_INVALIDES` | Login ou mot de passe incorrect. (même réponse pour un login inconnu) |
| 401 | `AUTH_COMPTE_DESACTIVE` | Ce compte est désactivé. |
| 422 | `VALIDATION` | `fieldErrors.login` : Le login est obligatoire. `fieldErrors.motDePasse` : Le mot de passe est obligatoire. |

### `GET /api/auth/moi`
Réponse 200 : l'objet `utilisateur` ci-dessus. Sert à restaurer la session au rechargement de la page.

### `PUT /api/auth/mot-de-passe` — changement de mot de passe
Requête : `{ "motDePasseActuel": "...", "nouveauMotDePasse": "..." }`. Réponse 204.

| HTTP | Code | Message |
| --- | --- | --- |
| 409 | `AUTH_MOT_DE_PASSE_ACTUEL_INCORRECT` | Le mot de passe actuel est incorrect. |
| 422 | `VALIDATION` | `fieldErrors.nouveauMotDePasse` : Le mot de passe doit contenir entre 8 et 72 caractères. |

### `POST /api/auth/mot-de-passe-oublie` — public
Requête : `{ "email": "marie@example.com" }`. Réponse **202 dans tous les cas**, que l'adresse corresponde à un compte actif ou non (pas d'énumération des comptes). Si elle correspond, un e-mail contient le lien `<APP_RESET_LINK_BASE_URL>?jeton=<jeton>`, par défaut `http://localhost:4200/reinitialisation?jeton=...`, valable **60 minutes** et utilisable **une seule fois**.
Erreur : 422 `fieldErrors.email` : Format d'e-mail invalide.

### `POST /api/auth/reinitialisation` — public
Requête : `{ "jeton": "<jeton du lien>", "nouveauMotDePasse": "..." }`. Réponse 204.

| HTTP | Code | Message |
| --- | --- | --- |
| 409 | `AUTH_JETON_INVALIDE` | Le lien de réinitialisation est invalide ou a expiré. (jeton falsifié, expiré, déjà utilisé, ou compte désactivé) |
| 422 | `VALIDATION` | `fieldErrors.nouveauMotDePasse` : Le mot de passe doit contenir entre 8 et 72 caractères. |

Écran front « réinitialisation » : lit `jeton` dans l'URL, demande le nouveau mot de passe, appelle cet endpoint puis renvoie vers la connexion.

---

## 3. Comptes utilisateurs (implémenté, `ADMIN` seulement, sans écran prévu pour l'instant)

`UtilisateurDTO` : `{ "id": 2, "login": "paul", "email": "paul@example.com", "role": "GESTIONNAIRE", "actif": true }`. Le mot de passe n'est jamais renvoyé.
- Création (`POST`) : `login`, `email`, `motDePasse` et `role` obligatoires ; `id` et `actif` ignorés (le compte est créé actif).
- Modification (`PUT`) : `email`, `role` et `actif` obligatoires ; `id`, `login` et `motDePasse` ignorés.

| Méthode et chemin | Requête | Réponse |
| --- | --- | --- |
| `GET /api/utilisateurs` | pagination ; tri sur `id`, `login`, `email`, `role`, `actif` (défaut `login`) | 200 page d'`UtilisateurDTO` |
| `GET /api/utilisateurs/{id}` | | 200 |
| `POST /api/utilisateurs` | `UtilisateurDTO` de création | 201 `UtilisateurDTO` + en-tête `Location` |
| `PUT /api/utilisateurs/{id}` | `UtilisateurDTO` de modification (le login ne change pas) | 200 `UtilisateurDTO` |
| `DELETE /api/utilisateurs/{id}` | | 204 |

| HTTP | Code | Message |
| --- | --- | --- |
| 404 | `UTIL_INTROUVABLE` | Utilisateur introuvable. |
| 409 | `UTIL_LOGIN_EXISTE` | Ce login existe déjà. |
| 409 | `UTIL_EMAIL_EXISTE` | Cet e-mail existe déjà. |
| 409 | `UTIL_DERNIER_ADMIN` | Il doit toujours rester au moins un administrateur actif. (désactivation, rétrogradation ou suppression du dernier admin actif) |
| 422 | `VALIDATION` | login obligatoire (50 caractères au plus), e-mail obligatoire et valide, mot de passe de 8 à 72 caractères, rôle obligatoire |

Premier administrateur (hors profil `dev`) : au démarrage, si aucun compte n'existe, l'API crée un `ADMIN` actif à partir des variables d'environnement `ADMIN_LOGIN`, `ADMIN_EMAIL` et `ADMIN_PASSWORD` (définies toutes les trois, mot de passe de 8 à 72 caractères). Les comptes suivants se créent ensuite par `POST /api/utilisateurs`.

Comptes de démonstration (profil `dev` uniquement), mot de passe `Garages2026!` : `admin`, `gestionnaire`, `lecture`.

---

## 4. Garages et loyers (proposé, étape 3.1, RG chapitres 5 et 6)

**Énumérations** : statut affiché `LIBRE | LOUE | INDISPONIBLE` (`LOUE` est calculé, RG-GAR-02) ; statut modifiable `LIBRE | INDISPONIBLE` ; état d'un loyer `A_VENIR | EN_VIGUEUR | CLOTURE`.

`GarageDTO` (en entrée, les champs calculés `statut`, `nbClesDisponibles`, `loyerCourant`, `locataire`, `nbRemarques` sont ignorés ; à la création, `loyerMontant` et `loyerDateDebut` sont en écriture seule et jamais renvoyés) :
```json
{
  "id": 1, "numero": "G01", "adresse": "Rue des Tilleuls 12, 1000 Bruxelles",
  "nbClesTotal": 3, "nbClesReserve": 1, "nbClesDisponibles": 2,
  "statut": "LOUE", "statutModifiable": "LIBRE",
  "loyerCourant": 90.00,
  "locataire": { "id": 1, "nom": "Dupont", "prenom": "Marie" },
  "nbRemarques": 1
}
```
`loyerCourant` et `locataire` valent `null` si aucun loyer n'est en vigueur ou si le garage n'est pas loué. `statut` est le statut affiché ; `statutModifiable` est la valeur stockée, proposée dans le formulaire (verrouillée tant que le garage est `LOUE`, RG-GAR-03).

| Méthode et chemin | Détail | Droit |
| --- | --- | --- |
| `GET /api/garages` | filtre `statut=LOUE|LIBRE|INDISPONIBLE` (absent = tous), `q` (numéro, locataire, adresse), tri sur `numero`, `nbClesTotal`, `nbClesReserve`, `loyerCourant`, `nbRemarques`, `locataire`, `statut` (défaut `numero`, ordre naturel) | lecture |
| `GET /api/garages/compteurs?q=` | `{ "LOUE": 4, "LIBRE": 6, "INDISPONIBLE": 1, "TOUS": 11 }`, qui tient compte de `q` (RG-LST-03) | lecture |
| `GET /api/garages/{id}` | | lecture |
| `GET /api/garages/prochain-numero` | `{ "numero": "G13" }` (RG-GAR-11) | lecture |
| `POST /api/garages` | `GarageDTO` : `{ numero, adresse?, nbClesTotal, nbClesReserve, statut (défaut LIBRE), loyerMontant, loyerDateDebut }` : crée le garage et son premier loyer (RG-GAR-13). Le numéro est mis en majuscules et nettoyé des espaces. | écriture |
| `PUT /api/garages/{id}` | `GarageDTO` : `{ adresse?, nbClesTotal, nbClesReserve, statut }` (numéro et loyer non modifiables, RG-GAR-20). Le `statut` est ignoré tant que le garage est `LOUE`. | écriture |
| `DELETE /api/garages/{id}` | supprime aussi ses loyers et remarques (RG-GAR-31) | admin |
| `GET /api/garages/{id}/locations` | historique des locations, plus récentes d'abord, 5 par page : `{ id, locataire{id,nom,prenom}, dateDebut, dateFin, nbClesRemises, loyer, statut: A_VENIR|ACTIVE|TERMINEE }` (RG-GAR-43, décision ouverte 5 : une location à venir porte `A_VENIR`) | lecture |

Erreurs :

| HTTP | Code | Message | Règle |
| --- | --- | --- | --- |
| 409 | `GAR_NUM_EXISTE` | Ce numéro de garage existe déjà. | RG-GAR-11 |
| 409 | `GAR_RESERVE_INVALIDE` | La réserve doit être comprise entre 0 et le nombre de clés. | RG-GAR-12, 21 |
| 409 | `GAR_CLES_LOCATION` | La location active a n clé(s) remise(s) : clés moins réserve doit rester supérieur ou égal. | RG-GAR-22 |
| 409 | `GAR_MAX_ATTEINT` | Le nombre maximum de 20 garages est atteint. *(proposé)* | décision ouverte 2 |
| 409 | `GAR_SUPPRESSION_REFUSEE` | Ce garage ne peut pas être supprimé. *(proposé)* ; `details` : « Le garage est actuellement loué (nom du locataire). » et/ou « Le garage a un historique de n location(s). » | RG-GAR-30 |
| 404 | `GAR_INTROUVABLE` | Garage introuvable. *(proposé)* | |

### Loyers d'un garage

`LoyerDTO` :
```json
{ "id": 7, "montant": 90.00, "dateDebut": "2026-01-01", "dateFin": null, "etat": "EN_VIGUEUR",
  "modifiable": false, "supprimable": false,
  "motifBlocage": "Une location a débuté depuis la date de début de ce loyer" }
```
`modifiable`, `supprimable` et `motifBlocage` (info-bulle, RG-VAL-06) sont calculés par l'API : le front n'applique pas RG-LOY-07 à 09.

| Méthode et chemin | Détail | Droit |
| --- | --- | --- |
| `GET /api/garages/{id}/loyers` | du plus récent au plus ancien, pagination (5 par page) | lecture |
| `POST /api/garages/{id}/loyers` | `{ montant, dateDebut }` : clôture automatiquement le loyer précédent à la veille de `dateDebut` (RG-LOY-05) | écriture |
| `PUT /api/loyers/{id}` | `{ montant, dateDebut }`, dernier loyer seulement ; la fin du précédent est recalculée (RG-LOY-06) | écriture |
| `DELETE /api/loyers/{id}` | dernier loyer et seulement s'il est `A_VENIR` (RG-LOY-07) | écriture |

| HTTP | Code | Message | Règle |
| --- | --- | --- | --- |
| 409 | `LOY_DEBUT_ANTERIEUR` | La date de début doit être postérieure au début du loyer précédent (jj/mm/aaaa) : pas de chevauchement. | RG-LOY-04 |
| 409 | `LOY_PAIEMENT_ANTICIPE` | Modification et suppression impossibles : un paiement anticipé est déjà enregistré pour … Annulez d'abord ce paiement dans l'écran Paiements. | RG-LOY-08 |
| 409 | `LOY_LOCATION_DEMARREE` | Une location a débuté depuis la date de début de ce loyer | RG-LOY-09 |
| 409 | `LOY_NON_DERNIER` | Seul le dernier loyer peut être modifié ou supprimé. *(proposé)* | RG-LOY-06, 07 |
| 409 | `LOY_SUPPRESSION_REFUSEE` | Seul le dernier loyer, s'il est à venir, peut être supprimé. *(proposé)* | RG-LOY-07 |
| 422 | `VALIDATION` | montant > 0 et date de début obligatoires | RG-LOY-04 |

---

## 5. Locataires (proposé, étape 3.2, RG chapitre 7)

**Énumérations** : `statut` `ACTUEL | ANCIEN | SANS_LOCATION` ; `solde` `A_JOUR | EN_RETARD` (uniquement pour un locataire `ACTUEL`, sinon `null`) ; `civilite` `M | MME | null`.

`LocataireDTO` :
```json
{
  "id": 1, "civilite": "MME", "nom": "Dupont", "prenom": "Marie",
  "rue": "Rue de la Station", "numeroRue": "14", "codePostal": "1050", "localite": "Ixelles",
  "tel1": "0470 00 00 01", "tel2": null, "email": "marie.dupont@example.com",
  "statut": "ACTUEL", "solde": "EN_RETARD", "garages": ["G01", "G12"], "nbRemarques": 2
}
```

| Méthode et chemin | Détail | Droit |
| --- | --- | --- |
| `GET /api/locataires` | `statut=ACTUEL|ANCIEN|SANS_LOCATION|TOUS` (le front envoie `ACTUEL` par défaut), `q` (nom, e-mail, adresse, garages), tri sur toutes les colonnes sauf les actions, défaut nom puis prénom. Sert aussi au choix du locataire d'une location (`statut=TOUS`, 5 par page, RG-LOC-11). | lecture |
| `GET /api/locataires/compteurs?q=` | `{ "ACTUEL": 8, "ANCIEN": 2, "SANS_LOCATION": 1, "TOUS": 11 }` | lecture |
| `GET /api/locataires/{id}` | | lecture |
| `POST /api/locataires[?force=true]` | `{ civilite?, nom, prenom, rue, numeroRue, codePostal, localite, tel1, tel2?, email? }` | écriture |
| `PUT /api/locataires/{id}[?force=true]` | mêmes champs ; le doublon exclut le locataire modifié | écriture |
| `DELETE /api/locataires/{id}` | supprime aussi ses remarques | admin |

| HTTP | Code | Message | Règle |
| --- | --- | --- | --- |
| 409 | `LOCT_DOUBLON` | Un locataire avec le même nom et prénom existe déjà. Vous pouvez enregistrer quand même. | RG-LOCT-04 |
| 409 | `LOCT_SUPPRESSION_REFUSEE` | Ce locataire ne peut pas être supprimé. *(proposé)* ; `details` : locations et garages concernés, paiements effectués | RG-LOCT-20 |
| 404 | `LOCT_INTROUVABLE` | Locataire introuvable. *(proposé)* | |
| 422 | `VALIDATION` | nom, prénom, rue, n°, code postal, localité, téléphone 1 obligatoires ; `fieldErrors.email` : Format d'e-mail invalide. | RG-LOCT-02, 03 |

---

## 6. Locations (proposé, étape 3.3, RG chapitre 8)

**Énumération** : `statut` `A_VENIR | ACTIVE | TERMINEE`.

`LocationDTO` :
```json
{
  "id": 4, "statut": "ACTIVE",
  "locataire": { "id": 4, "nom": "Peeters", "prenom": "Jan" },
  "garage": { "id": 4, "numero": "G04" },
  "dateDebut": "2025-03-01", "dateFin": "2026-12-31", "loyer": 100.00, "nbClesRemises": 2
}
```
`loyer` est celui du garage ; pour une location terminée, il est figé à sa valeur de fin (RG-LOC-04).

| Méthode et chemin | Détail | Droit |
| --- | --- | --- |
| `GET /api/locations` | `statut=ACTIVE|A_VENIR|TERMINEE` (le front envoie `ACTIVE` par défaut), `finDu` et `finAu` (inclusifs, facultatifs, **uniquement avec `TERMINEE`**, sur la date de fin), `q` (locataire, garage), tri sur toutes les colonnes sauf les actions | lecture |
| `GET /api/locations/compteurs?q=` | `{ "ACTIVE": 7, "A_VENIR": 1, "TERMINEE": 2 }` | lecture |
| `GET /api/garages/{id}/conditions-location?dateDebut=` | aide du formulaire (RG-LOC-14) : `{ nbClesDisponibles, nbClesReserve, loyer }` (`loyer` à la date de début, `null` s'il n'y en a pas). Les garages à proposer : `GET /api/garages?statut=LIBRE` (RG-LOC-12). | lecture |
| `POST /api/locations` | `{ locataireId, garageId, dateDebut, nbClesRemises }` ; sans date de fin (RG-LOC-15) | écriture |
| `PUT /api/locations/{id}` | `{ dateDebut, nbClesRemises, dateFin? }` ; `dateFin` réservée aux locations actives ; locataire et garage figés | écriture |
| `DELETE /api/locations/{id}` | locations `ACTIVE` et `A_VENIR` seulement | admin |

Contrôles à l'enregistrement, dans cet ordre (RG-LOC-13) :

| HTTP | Code | Message |
| --- | --- | --- |
| 409 | `LOC_GARAGE_NON_LIBRE` | Ce garage n'est pas libre. |
| 409 | `LOC_LOYER_ABSENT` | Aucun loyer n'est défini pour ce garage à cette date. |
| 409 | `LOC_CLES_NEGATIVES` | Le nombre de clés remises ne peut pas être négatif. *(proposé)* |
| 409 | `LOC_CLES_MAX` | Maximum n clés remises (hors réserve). |
| 409 | `LOC_FIN_PAS_DERNIER_JOUR` | La date de fin doit être le dernier jour d'un mois. |
| 409 | `LOC_FIN_AVANT_DEBUT` | La date de fin doit être postérieure ou égale au début. |
| 409 | `LOC_FIN_INTERDITE` | La date de fin n'est possible que pour une location active. *(proposé)* |
| 409 | `LOC_TERMINEE_NON_MODIFIABLE` | Une location terminée ne peut plus être modifiée. *(proposé)* |
| 409 | `LOC_SUPPRESSION_REFUSEE` | n paiement(s) ont déjà été effectué(s) pour cette location. (location active) |
| 409 | `LOC_TERMINEE_NON_SUPPRIMABLE` | Une location terminée fait partie de l'historique du garage et ne peut pas être supprimée. *(proposé)* |
| 422 | `VALIDATION` | locataire, garage, date de début et clés remises obligatoires |

Une date de fin passée ou du jour termine la location et libère le garage (RG-LOC-25) : aucun appel supplémentaire.

---

## 7. Paiements (proposé, étape 3.4, RG chapitre 9)

Selon les décisions ouvertes par défaut du README : une ligne par location couvrant le mois affiché ; l'échéance est créée au premier versement avec `montantDu` = loyer en vigueur à la période, figé.

**Énumérations** : `statut` `A_PAYER | PARTIEL | PAYE` ; `modePaiement` `VIREMENT | ESPECES`.

`PaiementDTO` (une ligne de l'écran) :
```json
{
  "locationId": 3, "echeanceId": 12, "periode": "2026-10-01",
  "locataire": { "id": 3, "nom": "Lambert", "prenom": "Sophie" },
  "garage": { "id": 3, "numero": "G03" },
  "montantDu": 80.00, "montantRecu": 30.00, "resteDu": 50.00,
  "statut": "PARTIEL", "enRetard": false,
  "dernierVersement": { "date": "2026-10-06", "modePaiement": "VIREMENT" }, "nbVersements": 1
}
```
`echeanceId` vaut `null` tant qu'aucun versement n'existe. `enRetard` (RG-PAI-12) : ligne non soldée dont le mois est passé.

| Méthode et chemin | Détail | Droit |
| --- | --- | --- |
| `GET /api/paiements?mois=2026-10` | `statut=A_PAYER|PARTIEL|PAYE` (absent = tous), `q` (locataire, garage, statut), tri sur `locataire`, `garage`, `montantDu`, `dernierVersement`, `modePaiement`, `statut` ; `mois` par défaut : mois courant | lecture |
| `GET /api/paiements/synthese?mois=2026-10` | compteurs par statut et indicateurs (RG-PAI-40) : `{ compteurs:{TOUS,A_PAYER,PARTIEL,PAYE}, attendu, encaisse:{total,virement,especes}, enRetard }` | lecture |
| `GET /api/paiements/versements?locationId=3&mois=2026-10` | détail (RG-PAI-24) : `{ montantDu, montantRecu, resteDu, versements:[{id, montant, modePaiement, datePaiement}] }` | lecture |
| `POST /api/paiements` | `{ locationId, mois, type: TOTAL|PARTIEL, montant? (PARTIEL), modePaiement, datePaiement }` : crée un versement (et l'échéance si besoin). `TOTAL` verse le reste dû. | écriture |
| `DELETE /api/paiements/versements/{id}` | annulation d'un versement ; reste dû et statut recalculés (RG-PAI-25) | admin |

| HTTP | Code | Message |
| --- | --- | --- |
| 409 | `PAI_MONTANT_PARTIEL` | Le montant doit être inférieur au reste dû (x €). Utilisez « Payer en totalité ». |
| 409 | `PAI_DEJA_SOLDE` | Cette échéance est déjà soldée. *(proposé)* |
| 409 | `PAI_LOCATION_NON_COUVERTE` | Aucune location ne couvre ce mois. *(proposé)* |
| 422 | `VALIDATION` | mode de paiement et date obligatoires ; montant obligatoire et > 0 pour un paiement partiel |

---

## 8. Remarques (proposé, étape 3.5, RG chapitre 10)

**Énumération** : `type` `INFORMATION | PROBLEME | AUTRE`.

`RemarqueDTO` :
```json
{ "id": 5, "type": "PROBLEME", "texte": "<p>Porte <b>difficile à ouvrir</b>.</p>",
  "dateCreation": "2026-10-02T09:00:00", "resolu": false, "dateResolution": null }
```
`resolu` et `dateResolution` valent `null` pour les types autres que `PROBLEME` (RG-REM-04). `texte` est du HTML limité (gras, italique, souligné, listes, liens) : **le back le nettoie à l'enregistrement** (liste blanche de balises) avant de le stocker.

| Méthode et chemin | Détail | Droit |
| --- | --- | --- |
| `GET /api/garages/{id}/remarques` · `GET /api/locataires/{id}/remarques` | liste non paginée, plus récentes d'abord (« Aucune remarque. » si vide, géré par le front) | lecture |
| `POST /api/garages/{id}/remarques` · `POST /api/locataires/{id}/remarques` | `{ type, texte }` ; la date de création est ajoutée par le serveur (RG-REM-03) | écriture |
| `PUT /api/remarques/{id}` | `{ type, texte }` ; passer à `PROBLEME` l'initialise non résolu, modifier un problème conserve son état | écriture |
| `POST /api/remarques/{id}/resolution` | `{ dateResolution }` (par défaut proposée à la date du jour par le front) : marque résolu (RG-REM-05) | écriture |
| `DELETE /api/remarques/{id}/resolution` | rouvre : efface l'état résolu et sa date (RG-REM-06) | écriture |
| `DELETE /api/remarques/{id}` | | admin |

| HTTP | Code | Message |
| --- | --- | --- |
| 409 | `REM_RESOLUTION_IMPOSSIBLE` | Seul un problème peut être marqué comme résolu. *(proposé)* |
| 404 | `REM_INTROUVABLE` | Remarque introuvable. *(proposé)* |
| 422 | `VALIDATION` | type et texte obligatoires (texte non vide) ; date de résolution obligatoire |

---

## 9. Tableau de bord (proposé, étape 3.6, RG chapitre 11)

### `GET /api/tableau-de-bord` — lecture
```json
{
  "tauxOccupation": { "pourcentage": 58, "garagesLoues": 7, "garagesTotal": 12 },
  "loyersMensuels": 620.00,
  "impayes": { "montant": 210.00, "nbTotaux": 2, "nbPartiels": 1 },
  "garagesLibres": { "nombre": 3, "nombreIndisponibles": 1 },
  "loyersEncaisses12Mois": [ { "mois": "2025-11", "montant": 540.00 }, "..." ],
  "tauxOccupation12Mois": [ { "mois": "2025-11", "pourcentage": 50 }, "..." ]
}
```
Les séries comptent 12 points, du plus ancien au mois courant (RG-DAS-05).

### `GET /api/tableau-de-bord/impayes` — lecture
Pagination (le front demande `size=3`). Élément (RG-DAS-06) :
```json
{ "locataire": { "id": 6, "nom": "Dubois", "prenom": "Pierre" }, "garage": { "id": 6, "numero": "G06" },
  "periode": "2026-09-01", "resteDu": 40.00, "type": "PARTIEL", "montantRecu": 40.00, "montantDu": 80.00 }
```
`type` : `TOTAL` (aucun versement) ou `PARTIEL`.

---

## 10. Hors périmètre

- Pas de verrouillage de compte après des échecs de connexion, ni de limitation de débit.
- Pas de renouvellement de jeton (refresh token).
- Pas d'écran de gestion des comptes (l'API existe).
- Les traductions anglaises sont côté front : l'API renvoie des messages français et des `code` stables.
