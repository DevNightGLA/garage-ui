# Contrat d'API : Gestion de garages

Contrat entre `garages-api` (Spring Boot) et `garages-web` (Angular). À copier dans le projet front.

Toutes les parties sont **implémentées et testées** : le front peut s'y brancher. Les règles de gestion sont dans `docs/regles-de-gestion.md` (notées `RG-xxx`) ; les messages d'erreur sont ceux des règles, mot pour mot. Un message marqué *(proposé)* n'existe pas dans les règles : il a été ajouté par l'implémentation et reste à valider.

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

## 4. Garages et loyers (implémenté, étape 3.1, RG chapitres 5 et 6)

Les paramètres de recherche d'une liste (ici `statut` et `q`) sont reçus côté serveur dans un objet `GarageCriteria` : l'API HTTP reste de simples paramètres de requête. Un `statut` inconnu ou un tri non prévu renvoie 400 `REQUETE_INVALIDE`.

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
| `GET /api/garages/compteurs?q=` | `{ "LOUE": 4, "LIBRE": 6, "INDISPONIBLE": 1, "TOUS": 11 }`, qui tient compte de `q` mais couvre tous les statuts (RG-LST-03) | lecture |
| `GET /api/garages/{id}` | 404 `GAR_INTROUVABLE` si inconnu | lecture |
| `GET /api/garages/prochain-numero` | `{ "numero": "G13" }` : « G » + plus grand numéro de la forme `G<n>` + 1, sur 2 chiffres au moins (RG-GAR-11) | lecture |
| `POST /api/garages` | `GarageDTO` : `{ numero, adresse?, nbClesTotal, nbClesReserve, statutModifiable? (défaut LIBRE), loyerMontant, loyerDateDebut }` : crée le garage et son premier loyer (RG-GAR-13). Le numéro est mis en majuscules et nettoyé des espaces. Réponse 201 + `Location`. | écriture |
| `PUT /api/garages/{id}` | `GarageDTO` : `{ adresse?, nbClesTotal, nbClesReserve, statutModifiable? }` (numéro et loyer non modifiables, RG-GAR-20). `statutModifiable` est ignoré tant que le garage est `LOUE` (RG-GAR-03) et inchangé s'il est absent. | écriture |
| `DELETE /api/garages/{id}` | supprime aussi ses loyers et remarques (RG-GAR-31). Réponse 204. | admin |

L'historique des locations d'un garage (`GET /api/garages/{id}/locations`, RG-GAR-43) est décrit avec les locations (section 6).

Erreurs :

| HTTP | Code | Message | Règle |
| --- | --- | --- | --- |
| 409 | `GAR_NUM_EXISTE` | Ce numéro de garage existe déjà. | RG-GAR-11 |
| 409 | `GAR_RESERVE_INVALIDE` | La réserve doit être comprise entre 0 et le nombre de clés. | RG-GAR-12, 21 |
| 409 | `GAR_CLES_LOCATION` | La location active a n clé(s) remise(s) : clés moins réserve doit rester supérieur ou égal. (n : le plus grand nombre de clés remises parmi les locations **non terminées**, actives ou à venir, d'après RG-TRA-04) | RG-GAR-22 |
| 409 | `GAR_MAX_ATTEINT` | Le nombre maximum de 20 garages est atteint. *(proposé)* | décision ouverte 2 |
| 409 | `GAR_SUPPRESSION_REFUSEE` | Ce garage ne peut pas être supprimé. *(proposé)* ; `details` : « Le garage est actuellement loué (nom du locataire). » et/ou « Le garage a un historique de n location(s). » | RG-GAR-30 |
| 404 | `GAR_INTROUVABLE` | Garage introuvable. *(proposé)* | |
| 422 | `VALIDATION` | numéro, clés, réserve, loyer mensuel (> 0, 2 décimales au plus) et début du loyer obligatoires à la création ; clés et réserve à la modification ; nombre de clés positif ou nul | RG-GAR-10, 12 |

### Loyers d'un garage

`LoyerDTO` :
```json
{ "id": 7, "montant": 90.00, "dateDebut": "2026-01-01", "dateFin": null, "etat": "EN_VIGUEUR",
  "modifiable": false, "supprimable": false,
  "motifModification": "Une location a débuté depuis la date de début de ce loyer",
  "motifSuppression": "Seul le dernier loyer, s'il est à venir, peut être supprimé." }
```
`modifiable`, `supprimable` et leurs motifs (info-bulles, RG-VAL-06) sont calculés par l'API : le front n'applique pas RG-LOY-06 à 09. Un motif vaut `null` quand l'action est permise.

| Méthode et chemin | Détail | Droit |
| --- | --- | --- |
| `GET /api/garages/{id}/loyers` | du plus récent au plus ancien par défaut (tri possible sur `dateDebut`, `dateFin`, `montant`), pagination (l'écran demande `size=5`) | lecture |
| `POST /api/garages/{id}/loyers` | `LoyerDTO` : `{ montant, dateDebut }` ; clôture automatiquement le loyer précédent à la veille de `dateDebut` (RG-LOY-05) ; une date passée est acceptée. Réponse 201 + `Location`. | écriture |
| `PUT /api/loyers/{id}` | `LoyerDTO` : `{ montant, dateDebut }`, dernier loyer seulement ; la fin du précédent est recalculée (RG-LOY-06) | écriture |
| `DELETE /api/loyers/{id}` | dernier loyer et seulement s'il est `A_VENIR` ; le précédent redevient la période courante (RG-LOY-07). Réponse 204. | écriture |

| HTTP | Code | Message | Règle |
| --- | --- | --- | --- |
| 409 | `LOY_DEBUT_ANTERIEUR` | La date de début doit être postérieure au début du loyer précédent (jj/mm/aaaa) : pas de chevauchement. (la date est celle du loyer précédent, ex. 01/01/2026) | RG-LOY-04 |
| 409 | `LOY_PAIEMENT_ANTICIPE` | Modification et suppression impossibles : un paiement anticipé est déjà enregistré pour novembre 2026. Annulez d'abord ce paiement dans l'écran Paiements. (le mois est le premier mois payé, à partir du mois de début du loyer) | RG-LOY-08 |
| 409 | `LOY_LOCATION_DEMARREE` | Une location a débuté depuis la date de début de ce loyer | RG-LOY-09 |
| 409 | `LOY_NON_DERNIER` | Seul le dernier loyer peut être modifié ou supprimé. *(proposé)* | RG-LOY-06, 07 |
| 409 | `LOY_SUPPRESSION_REFUSEE` | Seul le dernier loyer, s'il est à venir, peut être supprimé. *(proposé)* | RG-LOY-07 |
| 409 | `LOY_UNIQUE` | Le premier loyer d'un garage ne peut pas être supprimé. *(proposé : un garage garde au moins un loyer, cardinalité 1..N du modèle)* | |
| 404 | `LOY_INTROUVABLE` | Loyer introuvable. *(proposé)* | |
| 422 | `VALIDATION` | `fieldErrors.montant` : Le montant est obligatoire. / Le montant doit être supérieur à 0. ; `fieldErrors.dateDebut` : La date de début est obligatoire. | RG-LOY-04 |

---

## 5. Locataires (implémenté, étape 3.2, RG chapitre 7)

Comme pour les garages, les paramètres de recherche (`statut` et `q`) sont reçus côté serveur dans un objet `LocataireCriteria` ; l'API HTTP reste de simples paramètres de requête. Un `statut` inconnu ou un tri non prévu renvoie 400 `REQUETE_INVALIDE`.

**Énumérations** :
- `statut` `ACTUEL | A_VENIR | ANCIEN | SANS_LOCATION`, calculé à la date du jour, dans cet ordre de priorité (RG-LOCT-10) : `ACTUEL` = au moins une location active ; `A_VENIR` = aucune location active, au moins une à venir (même après des locations terminées) ; `ANCIEN` = a eu des locations, aucune active ni à venir ; `SANS_LOCATION` = aucune location. Une location se termine à sa date de fin : un locataire dont la fin tombe aujourd'hui n'est plus `ACTUEL`.
- `solde` `A_JOUR | EN_RETARD`, **uniquement pour un locataire `ACTUEL`**, sinon `null`. `EN_RETARD` = au moins une échéance non soldée (versements inférieurs au montant dû, partiel compris) dont le mois est **avant le mois courant**, sur n'importe laquelle de ses locations, y compris terminées (RG-PAI-30 et 31). Le mois courant n'est jamais en retard.
- `civilite` `M | MME | null`.

`LocataireDTO` (en entrée, les champs calculés `id`, `statut`, `solde`, `garages` et `nbRemarques` sont ignorés) :
```json
{
  "id": 1, "civilite": "MME", "nom": "Dupont", "prenom": "Marie",
  "rue": "Rue de la Station", "numeroRue": "14", "codePostal": "1050", "localite": "Ixelles",
  "tel1": "0470 00 00 01", "tel2": null, "email": "marie.dupont@example.com",
  "statut": "ACTUEL", "solde": "EN_RETARD", "garages": ["G01", "G12"], "nbRemarques": 2
}
```
`garages` : numéros des garages **actuellement** loués, dans l'ordre naturel (`G2` avant `G10`) ; vide pour un locataire non actuel. Les mêmes champs sont obligatoires à la création et à la modification.

| Méthode et chemin | Détail | Droit |
| --- | --- | --- |
| `GET /api/locataires` | filtre `statut=ACTUEL|A_VENIR|ANCIEN|SANS_LOCATION` (**absent = tous** : le front envoie `ACTUEL` par défaut et n'envoie rien pour le bouton « Tous », comme pour les garages ; `TOUS` n'est pas une valeur de `statut`), `q` (nom et prénom dans les deux ordres, e-mail, adresse affichée `rue n°, code postal localité`, numéros des garages actuellement loués ; sans casse ni accents), tri sur `locataire` (nom puis prénom, **défaut**), `nbRemarques`, `garages` (plus petit numéro de garage loué, ordre naturel, les locataires sans garage actuel en dernier), `statut` (actuels à jour, actuels en retard, à venir, anciens, sans location). Sert aussi au choix du locataire d'une location (sans `statut`, `size=5`, RG-LOC-11). | lecture |
| `GET /api/locataires/compteurs?q=` | `{ "ACTUEL": 6, "A_VENIR": 1, "ANCIEN": 2, "SANS_LOCATION": 1, "TOUS": 10 }`, qui tient compte de `q` mais couvre tous les statuts (RG-LST-03) | lecture |
| `GET /api/locataires/{id}` | 404 `LOCT_INTROUVABLE` si inconnu | lecture |
| `POST /api/locataires[?force=true]` | `{ civilite?, nom, prenom, rue, numeroRue, codePostal, localite, tel1, tel2?, email? }`. Les espaces autour des valeurs sont retirés ; `tel2` et `email` vides sont enregistrés comme absents. Réponse 201 + `Location`. | écriture |
| `PUT /api/locataires/{id}[?force=true]` | mêmes champs ; le doublon exclut le locataire modifié | écriture |
| `DELETE /api/locataires/{id}` | supprime aussi ses remarques (RG-LOCT-21). Réponse 204. | admin |

Doublon (RG-LOCT-04) : même nom **et** même prénom qu'un autre locataire, sans tenir compte de la casse (les accents comptent). Le premier envoi renvoie 409 `LOCT_DOUBLON` sans rien enregistrer ; le front affiche l'alerte et le bouton « Enregistrer quand même », qui renvoie la **même requête avec `?force=true`**. Toute modification d'un champ réarme l'alerte côté front.

| HTTP | Code | Message | Règle |
| --- | --- | --- | --- |
| 409 | `LOCT_DOUBLON` | Un locataire avec le même nom et prénom existe déjà. Vous pouvez enregistrer quand même. | RG-LOCT-04 |
| 409 | `LOCT_SUPPRESSION_REFUSEE` | Ce locataire ne peut pas être supprimé. ; `details` : « Le locataire a été assigné à un garage (n location(s) : G2, G10). » (toutes ses locations, garages distincts) et/ou « Des paiements ont été effectués pour ce locataire (n versement(s)). » | RG-LOCT-20, RG-TRA-02 |
| 404 | `LOCT_INTROUVABLE` | Locataire introuvable. | |
| 422 | `VALIDATION` | `fieldErrors` (tous d'un coup) : `nom` Le nom est obligatoire. · `prenom` Le prénom est obligatoire. · `rue` La rue est obligatoire. · `numeroRue` Le numéro est obligatoire. · `codePostal` Le code postal est obligatoire. · `localite` La localité est obligatoire. · `tel1` Le téléphone 1 est obligatoire. · `email` Format d'e-mail invalide. (forme `xxx@yyy.zz` : un seul `@`, un domaine avec au moins un point et 2 lettres au moins après le dernier point) · longueurs maximales (nom, prénom, localité 100 ; rue 150 ; numéro et code postal 10 ; téléphones 30 ; e-mail 255) | RG-LOCT-02, 03 |
| 400 | `REQUETE_INVALIDE` | civilité autre que `M` ou `MME`, `statut` ou tri inconnu | |

Une suppression est refusée dès qu'un locataire a une location, même à venir : un locataire sans location est donc le seul supprimable. Le motif des paiements est ajouté quand des versements existent (il accompagne toujours celui des locations, car un versement dépend d'une location).

---

## 6. Locations (implémenté, étape 3.3, RG chapitre 8)

Comme pour les garages et les locataires, les paramètres de recherche (`statut`, `q`, `finDu`, `finAu`, `garageId`) sont reçus côté serveur dans un objet `LocationCriteria` ; l'API HTTP reste de simples paramètres de requête. Un `statut`, une date ou un tri invalide renvoie 400 `REQUETE_INVALIDE`.

**Énumération** : `statut` `A_VENIR | ACTIVE | TERMINEE`, calculé à la date du jour (RG-LOC-01 à 03) : `A_VENIR` = début après aujourd'hui ; `TERMINEE` = date de fin passée ou égale à aujourd'hui ; `ACTIVE` = le reste (sans fin, ou fin future).

`LocationDTO` (en entrée, `id`, `statut`, `locataire`, `garage` et `loyer` sont ignorés ; `locataireId` et `garageId` sont en écriture seule et jamais renvoyés) :
```json
{
  "id": 4, "statut": "ACTIVE",
  "locataire": { "id": 4, "nom": "Peeters", "prenom": "Jan" },
  "garage": { "id": 4, "numero": "G04" },
  "dateDebut": "2025-03-01", "dateFin": "2026-12-31", "loyer": 100.00, "nbClesRemises": 2
}
```
`loyer` est le loyer du garage **en vigueur à la date utile** : aujourd'hui pour une location active, la date de début pour une location à venir, la date de fin pour une location terminée (figé, RG-LOC-04). Il vaut `null` si aucun loyer n'est en vigueur à cette date.

| Méthode et chemin | Détail | Droit |
| --- | --- | --- |
| `GET /api/locations` | filtre `statut=A_VENIR|ACTIVE|TERMINEE` (**absent = toutes** : le front envoie `ACTIVE` par défaut), `q` (nom et prénom du locataire dans les deux ordres, numéro du garage ; sans casse ni accents), `garageId`, `finDu` et `finAu` (`yyyy-MM-dd`, bornes **incluses** sur la date de fin, facultatives, **appliquées seulement avec `statut=TERMINEE`** et ignorées sinon, RG-LOC-05 ; `finDu` après `finAu` donne une liste vide) ; tri sur `locataire` (nom puis prénom), `garage` (ordre naturel G2 avant G10), `dateDebut`, `dateFin`, `loyer`, `nbClesRemises` (les locations sans date de fin en dernier) ; **sans tri, dans l'ordre de création** (RG-LST-06). | lecture |
| `GET /api/locations/compteurs?q=` | `{ "A_VENIR": 1, "ACTIVE": 7, "TERMINEE": 2, "TOUS": 10 }`, qui tient compte de `q` (et de `garageId`) mais couvre tous les statuts et ignore les bornes de fin (RG-LST-03) | lecture |
| `GET /api/locations/{id}` | 404 `LOC_INTROUVABLE` si inconnue | lecture |
| `GET /api/garages/{id}/locations` | historique du garage (RG-GAR-43) : mêmes filtres et mêmes tris, le garage étant imposé par l'URL ; **sans tri, du plus récent au plus ancien** (`dateDebut` décroissant) ; l'écran demande `size=5`. Une location à venir y est `A_VENIR`. 404 `GAR_INTROUVABLE`. | lecture |
| `GET /api/garages/{id}/conditions-location?dateDebut=` | aide du formulaire (RG-LOC-14) : `{ nbClesDisponibles, nbClesReserve, loyer }` ; `loyer` à la date de début, `null` s'il n'y en a pas ou si `dateDebut` est absente. Les garages à proposer : `GET /api/garages?statut=LIBRE` (RG-LOC-12) ; le locataire : `GET /api/locataires` (RG-LOC-11). | lecture |
| `POST /api/locations` | `{ locataireId, garageId, dateDebut, nbClesRemises }` ; sans date de fin (une `dateFin` envoyée est ignorée, RG-LOC-15) ; une date de début passée ou future est acceptée. Réponse 201 + `Location`. | écriture |
| `PUT /api/locations/{id}` | `{ dateDebut, nbClesRemises, dateFin? }` ; locataire et garage figés (ignorés). `dateFin` est réservée aux locations actives ; **un `PUT` sans `dateFin` l'efface** (RG-LOC-26). Le statut qui compte est celui d'avant la modification. | écriture |
| `DELETE /api/locations/{id}` | locations `ACTIVE` et `A_VENIR` seulement, et sans paiement ; supprime aussi leurs échéances sans versement. Réponse 204. | admin |

**Contrôles à l'enregistrement, dans cet ordre.** Création : locataire et garage existants (404), puis RG-LOC-13 (garage libre, loyer, clés négatives, clés maximum), puis le chevauchement. Modification : location terminée, fin interdite, puis loyer et clés (RG-LOC-21), fin (RG-LOC-23, toujours contrôlée par rapport au début envoyé), mois payés, chevauchement.

| HTTP | Code | Message | Règle |
| --- | --- | --- | --- |
| 409 | `LOC_GARAGE_NON_LIBRE` | Ce garage n'est pas libre. (loué ou indisponible ; un garage qui a une location à venir reste libre) | RG-LOC-13 |
| 409 | `LOC_LOYER_ABSENT` | Aucun loyer n'est défini pour ce garage à cette date. | RG-LOC-13, 21 |
| 409 | `LOC_CLES_NEGATIVES` | Le nombre de clés remises ne peut pas être négatif. *(proposé)* | RG-LOC-13, 21 |
| 409 | `LOC_CLES_MAX` | Maximum n clés remises (hors réserve). (n = clés moins réserve du garage) | RG-LOC-13, 21 |
| 409 | `LOC_CHEVAUCHEMENT` | Cette location chevauche une autre location du garage (du 01/01/2025 au 31/12/2025). ou (à partir du 01/11/2026). *(proposé)* | RG-LOC-17 |
| 409 | `LOC_FIN_PAS_DERNIER_JOUR` | La date de fin doit être le dernier jour d'un mois. | RG-LOC-23 |
| 409 | `LOC_FIN_AVANT_DEBUT` | La date de fin doit être postérieure ou égale au début. | RG-LOC-23 |
| 409 | `LOC_FIN_INTERDITE` | La date de fin n'est possible que pour une location active. *(proposé)* | RG-LOC-22 |
| 409 | `LOC_FIN_AVANT_PAIEMENT` | La date de fin ne peut pas précéder septembre 2026 : un paiement est déjà enregistré pour ce mois. Annulez d'abord ce paiement dans l'écran Paiements. *(proposé)* | RG-LOC-28 |
| 409 | `LOC_DEBUT_APRES_PAIEMENT` | La date de début ne peut pas suivre juin 2026 : un paiement est déjà enregistré pour ce mois. Annulez d'abord ce paiement dans l'écran Paiements. *(proposé)* | RG-LOC-28 |
| 409 | `LOC_TERMINEE_NON_MODIFIABLE` | Une location terminée ne peut plus être modifiée. *(proposé)* | RG-LOC-27 |
| 409 | `LOC_SUPPRESSION_REFUSEE` | n paiement(s) ont déjà été effectué(s) pour cette location. (n versements ; location active **ou à venir**) | RG-LOC-32 |
| 409 | `LOC_TERMINEE_NON_SUPPRIMABLE` | Une location terminée fait partie de l'historique du garage et ne peut pas être supprimée. *(proposé)* | RG-LOC-33 |
| 404 | `LOC_INTROUVABLE`, `LOCT_INTROUVABLE`, `GAR_INTROUVABLE` | Location introuvable. · Locataire introuvable. · Garage introuvable. | |
| 422 | `VALIDATION` | `fieldErrors` (tous d'un coup) : `locataireId` Le locataire est obligatoire. · `garageId` Le garage est obligatoire. (création) · `dateDebut` La date de début est obligatoire. · `nbClesRemises` Le nombre de clés remises est obligatoire. | RG-LOC-10, 21 |

Règles apportées par ce module (décidées avec l'utilisateur le 25/10/2026) :
- **Chevauchement** (RG-LOC-17) : deux locations d'un même garage ne se chevauchent pas, à la création comme à la modification (début, fin, fin effacée). Une location sans fin couvre tout l'avenir. La date de fin est exclue de la période, comme dans le calcul des statuts : une location peut commencer le jour où la précédente se termine. Conséquence : un garage libre qui a une location à venir ne peut pas recevoir une location qui commence avant elle.
- **Mois payés** (RG-LOC-28) : le début d'une location ne peut pas suivre son premier mois ayant un versement, et sa fin ne peut pas précéder son dernier mois ayant un versement. Une échéance sans versement ne compte pas.
- **Suppression** : même une location à venir est refusée dès qu'un versement existe (la clé étrangère interdit de supprimer une location qui porte des échéances). Il faut d'abord annuler les versements (Admin, RG-PAI-25).

Une date de fin passée ou du jour termine la location et libère le garage (RG-LOC-25) : aucun appel supplémentaire. La création ou la modification d'une location crée aussi son échéance du mois courant, s'il en manque une (section 7).

---

## 7. Paiements (implémenté, étape 3.4, RG chapitre 9)

Comme pour les autres listes, les paramètres de recherche (`mois`, `statut`, `q`) sont reçus côté serveur dans un objet `PaiementCriteria` ; l'API HTTP reste de simples paramètres de requête. Un `statut`, un `mois` (format `yyyy-MM`) ou un tri invalide renvoie 400 `REQUETE_INVALIDE`.

**Énumérations** : `statut` `A_PAYER | PARTIEL | PAYE` (calculé, RG-PAI-11) ; `modePaiement` `VIREMENT | ESPECES` ; `type` d'un paiement saisi `TOTAL | PARTIEL`.

**Les lignes d'un mois.** Il y a une ligne par **location dont la période touche le mois** : une location qui commence en cours de mois a sa ligne (loyer entier, sans prorata), une location terminée garde les lignes de ses mois passés, une location à venir a des lignes pour ses mois futurs (paiements anticipés). Le montant dû est le loyer en vigueur au 1er du mois (ou à la date de début si elle est plus tardive), **figé** dans l'échéance dès qu'elle existe.

**Les échéances** (décision du 25/10/2026) : l'API crée l'échéance du mois courant de chaque location qui le couvre, **chaque jour** (tâche planifiée, `app.echeances.cron`, 1 h par défaut) et **à la création ou à la modification d'une location** ; elle crée aussi l'échéance d'un autre mois **au premier versement** (mois futur, ou mois passé non suivi). Les mois passés ne sont jamais rattrapés : une ligne de mois passé sans échéance enregistrée est « à payer » mais **jamais en retard**.

`PaiementDTO` (une ligne ; en entrée, tout sauf `locationId`, `mois`, `type`, `montant`, `modePaiement` et `datePaiement` est ignoré, et ces cinq derniers champs sont en écriture seule ou ne servent qu'à la saisie) :
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
`echeanceId` vaut `null` tant qu'aucune échéance n'est enregistrée pour ce mois. `enRetard` (RG-PAI-12 et 31) : échéance **enregistrée**, non soldée, dont le mois est **strictement avant le mois courant** ; le mois courant et les mois futurs ne sont jamais en retard. Les montants ont toujours 2 décimales. Le dernier versement est celui dont la date de paiement est la plus récente (à date égale, le dernier enregistré).

| Méthode et chemin | Détail | Droit |
| --- | --- | --- |
| `GET /api/paiements` | `mois=2026-10` (défaut : mois courant), filtre `statut=A_PAYER|PARTIEL|PAYE` (absent = tous), `q` (locataire dans les deux ordres, numéro du garage, libellé français du statut : « à payer », « partiel », « payé » ; sans casse ni accents), tri sur `locataire`, `garage` (ordre naturel), `montantDu`, `dernierVersement` (les lignes sans versement en dernier), `modePaiement`, `statut` (à payer, partiel, payé) ; **défaut : locataire puis garage** | lecture |
| `GET /api/paiements/synthese?mois=2026-10&q=` | `{ "compteurs": { "A_PAYER": 2, "PARTIEL": 1, "PAYE": 4, "TOUS": 7 }, "attendu": 600.00, "encaisse": { "total": 370.00, "virement": 285.00, "especes": 85.00 }, "enRetard": 0.00 }` ; les compteurs tiennent compte de `q` mais pas du statut (RG-LST-03) ; l'attendu, l'encaissé (versements des échéances du mois) et le retard (somme des restes dus des échéances en retard) portent sur tout le mois (RG-PAI-40) | lecture |
| `GET /api/paiements/versements?locationId=3&mois=2026-10` | détail (RG-PAI-24) : `{ montantDu, montantRecu, resteDu, versements: [{ id, montant, modePaiement, datePaiement }] }`, du plus ancien au plus récent ; liste vide sans échéance | lecture |
| `POST /api/paiements` | `{ locationId, mois, type, montant?, modePaiement, datePaiement }` : crée un versement (et l'échéance si besoin). `TOTAL` verse le reste dû et ignore `montant`. Réponse 201 + `Location` (le détail) et le `PaiementDTO` de la ligne mise à jour. | écriture |
| `DELETE /api/paiements/versements/{id}` | annule un versement ; le reste dû et le statut se recalculent (RG-PAI-25). L'échéance d'un mois futur qui n'a plus de versement est supprimée ; celle d'un mois courant ou passé reste (à payer). Réponse 204. | admin |

| HTTP | Code | Message | Règle |
| --- | --- | --- | --- |
| 409 | `PAI_MONTANT_PARTIEL` | Le montant doit être inférieur au reste dû (1 500,25 €). Utilisez « Payer en totalité ». (montant au moins égal au reste dû ; reste dû au format français) | RG-PAI-22 |
| 409 | `PAI_DEJA_SOLDE` | Cette échéance est déjà soldée. *(proposé)* | RG-PAI-20 |
| 409 | `PAI_LOCATION_NON_COUVERTE` | Aucune location ne couvre ce mois. *(proposé ; aussi pour le détail des versements)* | RG-PAI-01 |
| 409 | `PAI_LOYER_ABSENT` | Aucun loyer n'est défini pour ce garage à cette date. *(proposé ; cas rare, un loyer existe toujours à la date de début d'une location)* | RG-PAI-03 |
| 404 | `LOC_INTROUVABLE` · `PAI_VERSEMENT_INTROUVABLE` | Location introuvable. · Versement introuvable. *(proposé)* | |
| 422 | `VALIDATION` | `fieldErrors` (tous d'un coup) : `locationId` La location est obligatoire. · `mois` Le mois est obligatoire. · `type` Le type de paiement est obligatoire. · `modePaiement` Le mode de paiement est obligatoire. · `datePaiement` La date de paiement est obligatoire. · `montant` (paiement partiel seulement) Le montant est obligatoire pour un paiement partiel. / Le montant doit être supérieur à 0. / Le montant doit avoir au plus 2 décimales. | RG-PAI-21, 22 |

Un mode, un type ou un mois inconnu, ou une date illisible, renvoie 400 `REQUETE_INVALIDE`. Tout mois couvert par la location peut être payé, même passé, même pour une location terminée (arriérés) ; la date de paiement est libre. Deux versements simultanés ne peuvent pas dépasser le montant dû (la location est verrouillée pendant le paiement).

Le solde d'un locataire (section 5) et, plus tard, les impayés du tableau de bord se lisent sur ces échéances enregistrées.

---

## 8. Remarques (implémenté, étape 3.5, RG chapitre 10)

**Énumération** : `type` `INFORMATION | PROBLEME | AUTRE`.

`RemarqueDTO` (en entrée, seuls `type` et `texte` comptent ; `id`, `dateCreation`, `resolu` et `dateResolution` sont ignorés) :
```json
{ "id": 5, "type": "PROBLEME", "texte": "<p>Porte <b>difficile à ouvrir</b>.</p>",
  "dateCreation": "2026-10-02T09:00:00", "resolu": false, "dateResolution": null }
```
- `dateCreation` : date et heure du serveur (heure de Bruxelles), non modifiable (RG-REM-03).
- `resolu` et `dateResolution` valent `null` pour les types autres que `PROBLEME` (RG-REM-04). Un problème est créé avec `resolu: false`.
- `texte` est du HTML limité. **Le back le nettoie à l'enregistrement** (bibliothèque jsoup, liste blanche) : il garde `p`, `br`, `b`, `strong`, `i`, `em`, `u`, `ul`, `ol`, `li` et `a` ; seul l'attribut `href` d'un lien est conservé, et seulement en `http`, `https` ou `mailto` (`rel="noopener noreferrer"` est ajouté) ; tout le reste (scripts, styles, images, autres balises et attributs, adresses `javascript:`) est retiré, et le texte renvoyé est le texte nettoyé. Le front n'a donc pas à se fier à son propre éditeur. Un texte sans caractère visible une fois nettoyé (`<p><br></p>`, espaces, `&nbsp;`) est refusé comme un texte absent.

| Méthode et chemin | Détail | Droit |
| --- | --- | --- |
| `GET /api/garages/{id}/remarques` · `GET /api/locataires/{id}/remarques` | liste **non paginée**, de la plus récente à la plus ancienne (« Aucune remarque. » si vide, géré par le front) ; 404 `GAR_INTROUVABLE` / `LOCT_INTROUVABLE` | lecture |
| `GET /api/remarques/{id}` | 404 `REM_INTROUVABLE` | lecture |
| `POST /api/garages/{id}/remarques` · `POST /api/locataires/{id}/remarques` | `{ type, texte }` ; la remarque est rattachée au garage ou au locataire, jamais aux deux (RG-REM-01). Réponse 201 + `Location`. | écriture |
| `PUT /api/remarques/{id}` | `{ type, texte }` ; passer à `PROBLEME` l'initialise non résolu, modifier un problème garde son état, **quitter `PROBLEME` efface l'état résolu et sa date** ; le rattachement et la date de création ne changent pas | écriture |
| `POST /api/remarques/{id}/resolution` | `{ dateResolution }` (proposée à la date du jour par le front) : marque résolu (RG-REM-05). Sur un problème déjà résolu, la date est remplacée. Réponse 200 : la remarque. | écriture |
| `DELETE /api/remarques/{id}/resolution` | rouvre : efface l'état résolu et sa date (RG-REM-06) ; sans effet sur un problème déjà ouvert. Réponse 200 : la remarque. | écriture |
| `DELETE /api/remarques/{id}` | réponse 204 | admin |

| HTTP | Code | Message | Règle |
| --- | --- | --- | --- |
| 409 | `REM_RESOLUTION_IMPOSSIBLE` | Seul un problème peut être marqué comme résolu. / Seul un problème peut être rouvert. *(proposé)* | RG-REM-04 |
| 409 | `REM_RESOLUTION_FUTURE` | La date de résolution ne peut pas être dans le futur. *(proposé)* | RG-REM-05 |
| 409 | `REM_RESOLUTION_AVANT_CREATION` | La date de résolution ne peut pas précéder la création de la remarque (jj/mm/aaaa). *(proposé ; la date est celle de la création)* | RG-REM-05 |
| 404 | `REM_INTROUVABLE` | Remarque introuvable. *(proposé)* | |
| 422 | `VALIDATION` | `fieldErrors` (tous d'un coup) : `type` Le type est obligatoire. · `texte` Le texte est obligatoire. · `dateResolution` La date de résolution est obligatoire. (résolution) | RG-REM-02, 05 |

Un type inconnu ou une date de résolution illisible renvoie 400 `REQUETE_INVALIDE`. Supprimer un garage ou un locataire supprime ses remarques. Le nombre de remarques de chaque garage et de chaque locataire (`nbRemarques`) est déjà dans leurs listes.

---

## 9. Tableau de bord (implémenté, étape 3.6, RG chapitre 11)

Tous les rôles peuvent le consulter. Tout est calculé à la date du jour du serveur.

### `GET /api/tableau-de-bord` — lecture
```json
{
  "tauxOccupation": { "pourcentage": 58, "garagesLoues": 7, "garagesTotal": 12 },
  "loyersMensuels": 600.00,
  "impayes": { "montant": 120.00, "nbTotaux": 1, "nbPartiels": 1 },
  "garagesLibres": { "nombre": 4, "nombreIndisponibles": 1 },
  "loyersEncaisses12Mois": [ { "mois": "2025-11", "montant": 0.00 }, "..." ],
  "tauxOccupation12Mois": [ { "mois": "2025-11", "pourcentage": 58 }, "..." ]
}
```
- **Taux d'occupation** (RG-DAS-01) : garages loués sur le total, `pourcentage` arrondi à l'entier le plus proche (12,5 donne 13), 0 s'il n'y a aucun garage. Un garage est loué selon RG-GAR-02 : un garage indisponible qui a une location active est loué.
- **Loyers mensuels** (RG-DAS-02) : somme des loyers en vigueur aujourd'hui des garages actuellement loués.
- **Impayés** (RG-DAS-03) : somme des restes dus de **toutes les échéances enregistrées en retard**, c'est-à-dire non soldées et d'un mois strictement avant le mois courant (le mois courant n'est jamais en retard). `nbTotaux` = échéances sans aucun versement, `nbPartiels` = échéances avec des versements et un reste dû. Même définition que le solde d'un locataire (section 5) et que l'écran Paiements (section 7).
- **Garages libres** (RG-DAS-04) : garages au statut affiché `LIBRE` et `INDISPONIBLE` (un garage indisponible mais loué est compté loué).
- **Séries** (RG-DAS-05) : 12 points, du plus ancien (mois courant moins 11) au mois courant, `mois` au format `yyyy-MM`.
  - `loyersEncaisses12Mois` : somme des versements des échéances de chaque **mois de loyer** (comme l'« encaissé » de l'écran Paiements), pas de la date de paiement : un paiement tardif de septembre augmente septembre. 0.00 pour un mois sans versement.
  - `tauxOccupation12Mois` : pourcentage de garages loués **au dernier jour de chaque mois** (une location qui se termine le dernier jour libère le garage ce jour-là, RG-GAR-02), et **à la date du jour pour le mois courant** : le dernier point est donc exactement `tauxOccupation.pourcentage`. Le total est le nombre **actuel** de garages (un garage n'a pas de date de création).

### `GET /api/tableau-de-bord/impayes` — lecture
Liste « Impayés à relancer » (RG-DAS-06), paginée, **3 par page par défaut**. Une ligne par échéance en retard, de la plus ancienne à la plus récente (période, puis locataire et garage). **L'ordre n'est pas modifiable** : un paramètre `sort` est ignoré. Élément :
```json
{ "locataire": { "id": 6, "nom": "Dubois", "prenom": "Pierre" }, "garage": { "id": 6, "numero": "G06" },
  "periode": "2026-09-01", "resteDu": 40.00, "type": "PARTIEL", "montantRecu": 40.00, "montantDu": 80.00 }
```
`type` : `TOTAL` (aucun versement, badge rouge) ou `PARTIEL` (badge orange, « Reçu `montantRecu` sur `montantDu` » en info-bulle). Les montants ont toujours 2 décimales.

---

## 10. Hors périmètre

- Pas de verrouillage de compte après des échecs de connexion, ni de limitation de débit.
- Pas de renouvellement de jeton (refresh token).
- Pas d'écran de gestion des comptes (l'API existe).
- Les traductions anglaises sont côté front : l'API renvoie des messages français et des `code` stables.
