# Compléments aux règles de gestion

Ce document décrit ce que la maquette fait et que `regles-de-gestion.md` ne couvre pas, ou ne couvre plus. Les identifiants `RG-USR`, `RG-AUT`, `RG-DRO`, `RG-AUD`, `RG-MNT`, `RG-CHR`, `RG-STA`, `RG-MLI`, `RG-APP` prolongent la numérotation de `regles-de-gestion.md`.

Source : `maquette/Gestion Garages.dc.html`, `Gestion des utilisateurs.dc.html`, `Journal audit.dc.html`, `Site en maintenance.dc.html`, `droits.js`. Les points marqués **(à confirmer)** sont déduits du code de la maquette et n'ont pas été validés par le métier.

## 0. Priorité entre les documents

1. Ce document, pour les points listés ci-dessous.
2. `regles-de-gestion.md`, pour tout le reste.
3. `Modele de donnees.dc.html`, complété par la section 11 ci-dessous.
4. La maquette (comportement visuel).

Règles de `regles-de-gestion.md` **remplacées** par ce document :

| Règle | Ancienne formulation | Remplacée par |
| --- | --- | --- |
| RG-NAV-01 | « Six écrans » | Menu complet de la section 1 |
| RG-NAV-05 | Rôle choisi par un sélecteur d'en-tête | Authentification réelle (section 4). Le sélecteur de la maquette est une simulation, ne pas le reproduire |
| Chapitre 4 (tableau des rôles), RG-ROL-01 à 03, RG-PAR-05, RG-AVI-09, RG-REL-07 | 3 rôles figés, suppressions réservées à l'Admin, Lecture seule | 4 profils et droits paramétrables (sections 2 et 3). « Lecture seule » devient **Consultant** |
| Chapitre 13, ligne « Gestion des utilisateurs » | Absente de la maquette | Section 5 |
| RG-VAL-05 | Fenêtres en consultation pour « Lecture seule » | S'applique à tout profil dont le droit « modifier » est retiré sur l'écran concerné |

## 1. Menu et écrans

Menu latéral repliable. Les entrées visibles dépendent des droits du profil (section 3) et de l'appareil (section 12). Un lien vers un écran non autorisé redirige vers le premier écran autorisé.

| Section | Écrans (id de droit) |
| --- | --- |
| Pilotage | Tableau de bord (`dash`) · Statistiques : Loyers encaissés, Taux d'occupation, Répartition par statut, Remarques par type (`sta`) |
| Garages | Liste des garages (`gar`) · Historique des loyers (`loy`) · Historique des locations (`hloc`) |
| Locataires | Liste des locataires (`ten`) · Chronologie (`chr`) |
| Locations et paiements | Locations (`loc`) · Paiements (`pai`) |
| Envoi de messages | Avis de loyer (`avi`) · Relances d'impayés (`rel`) · Message libre (`lib`) |
| Configuration | Paramètres (`par`) · Modèles de messages (`tpl`) · Utilisateurs (`usr`) · Droits d'accès (`dro`) · Journal d'audit (`aud`) · Maintenance (`mnt`) |

Les remarques (`rem`) n'ont pas d'entrée de menu : elles s'ouvrent depuis les fiches garage et locataire.

Dans la maquette, Utilisateurs, Droits d'accès, Journal d'audit et Maintenance sont des pages HTML séparées. Dans Angular, ce sont des routes du même shell (même menu, même en-tête).

## 2. Profils

- **RG-DRO-01** – Quatre profils : **Admin**, **Gestionnaire**, **Locataire**, **Consultant**. Codes conseillés : `ADMIN`, `GESTIONNAIRE`, `LOCATAIRE`, `CONSULTANT` (`CONSULTANT` remplace `LECTURE_SEULE`). Le libellé « Consultant » est un réglage d'affichage (prop `consultantName` dans la maquette).
- **RG-DRO-02** – Admin : tous les droits, non modifiables. Journal d'audit et Maintenance sont réservés à l'Admin et ne peuvent être accordés à aucun autre profil.
- **RG-DRO-03** – Gestionnaire (défaut) : mêmes droits que l'Admin sur tous les écrans hors section Configuration. Aucun accès à Configuration par défaut.
- **RG-DRO-04** – Consultant (défaut) : consulte les mêmes écrans que le Gestionnaire, sans droit d'ajout, de modification ni de suppression.
- **RG-DRO-05** – Locataire (défaut) : consulte uniquement Liste des garages, Historique des loyers, Historique des locations, Locations et Paiements, **limité à ses propres données** (ses garages, ses locations, ses loyers, ses paiements). Aucune action.
- **RG-DRO-06** – La limitation du profil Locataire est appliquée **par le back** : un compte Locataire est relié à une fiche locataire (section 11) et chaque requête est filtrée sur cette fiche. Le front n'est jamais l'autorité.

## 3. Droits d'accès (écran Configuration > Droits d'accès)

- **RG-DRO-10** – Les droits sont stockés par couple (profil, écran) : `voir` (v), `ajouter` (a), `modifier` (m), `supprimer` (d). Les cases a/m/d n'existent que si l'écran propose l'action (tableau ci-dessous). Un droit a/m/d suppose `voir`.
- **RG-DRO-11** – L'écran propose deux onglets pour tous, un troisième pour l'Admin :
  - **Accès aux écrans** : une grille profils × écrans, regroupée par section repliable (boutons « Tout déplier » / « Tout replier »), colonne Admin verrouillée ;
  - **Actions autorisées** : un profil à la fois (sélecteur de profil), une ligne par écran avec les quatre cases (Consulter, Ajouter, Modifier, Supprimer) et le libellé de l'action ; une case a/m/d est désactivée si l'accès à l'écran est retiré ;
  - **Accès selon l'appareil** (Admin seulement) : section 12.
- **RG-DRO-12** – Les changements restent en **brouillon** : une pastille orange marque chaque case modifiée, un compteur « n modifications non enregistrées » s'affiche, boutons « Enregistrer » / « Annuler ». Message de succès : « Droits d'accès enregistrés avec succès ». Rien n'est appliqué avant l'enregistrement.
- **RG-DRO-13** – Chaque endpoint du back vérifie le droit (profil, écran, action). Les annotations `@PreAuthorize` par rôle fixe de la v1 sont remplacées par un contrôle sur la table des droits (voir `api/CLAUDE.md`).
- **RG-DRO-14** – Un droit modifié s'applique à la prochaine requête de l'utilisateur concerné (pas de droit figé dans le JWT).

Droits par défaut (fichier `maquette/droits.js`, à reprendre comme données de départ) :

| Écran | Actions (a / m / d) |
| --- | --- |
| `dash` Tableau de bord, `sta` Statistiques, `hloc` Historique des locations, `chr` Chronologie | consultation seule |
| `gar` Liste des garages | Créer / Modifier / Supprimer un garage |
| `loy` Historique des loyers | Créer un loyer / Modifier le dernier loyer / Supprimer un loyer à venir |
| `ten` Liste des locataires | Créer / Modifier / Supprimer un locataire |
| `loc` Locations | Créer / Modifier ou clôturer / Supprimer une location |
| `pai` Paiements | Enregistrer un paiement (a) / — / Annuler un versement (d) |
| `rem` Fiches garage et locataire | Créer / Modifier, résoudre ou rouvrir / Supprimer une remarque |
| `avi` Avis de loyer | Envoyer ou marquer comme informé (a) |
| `rel` Relances d'impayés | Envoyer ou marquer comme relancé (a) |
| `lib` Message libre | Envoyer un message (a) |
| `par` Paramètres | Modifier les paramètres (m) |
| `tpl` Modèles de messages | Modifier les modèles et la signature (m) |
| `usr` Utilisateurs | Créer un utilisateur (a) / Modifier, réinitialiser, désactiver (m) |
| `dro` Droits d'accès | Modifier les droits (m) |
| `aud` Journal d'audit, `mnt` Maintenance | Admin seulement |

**Conséquence sur les suppressions** : la règle initiale (RG-ROL-02) réservait toute suppression définitive à l'Admin. Dans la maquette, le Gestionnaire reçoit par défaut les mêmes droits que l'Admin, suppressions comprises. Les conditions métier de suppression (RG-GAR-30, RG-LOCT-20, RG-LOC-30 à 33, RG-REM-07, RG-PAI-25) restent vérifiées par le back quel que soit le profil. **(à confirmer)** : garder ce défaut ou mettre `d = 0` pour le Gestionnaire.

## 4. Authentification

Écrans présents dans la maquette (à recréer) :

- **RG-AUT-01** – **Connexion** : identifiant (le login), mot de passe, lien « Mot de passe oublié ? », bouton « Se connecter » (état « Connexion… »). Messages d'information : « Votre session a été fermée. » et « Mot de passe modifié. Vous pouvez vous connecter. ». Un compte désactivé ne peut pas se connecter.
- **RG-AUT-02** – **Mot de passe oublié** : saisie de l'identifiant, bouton « Envoyer le lien ». Réponse identique que le compte existe ou non : « Si un compte correspond à cet identifiant, un lien de réinitialisation vient d'être envoyé. » Lien « Retour à la connexion ».
- **RG-AUT-03** – **Nouveau mot de passe** (depuis le lien reçu) : nouveau mot de passe + confirmation, mention « Minimum n caractères » (paramètre `mdp_min`, RG-PAR-10). Le lien est à usage unique et expire (durée à fixer, **à confirmer**).
- **RG-AUT-04** – **Modifier mon mot de passe** (menu utilisateur, bas du menu latéral) : mot de passe actuel, nouveau, confirmation. Champs obligatoires et surlignage selon RG-VAL-01. Visibilité du mot de passe par icône œil.
- **RG-AUT-05** – **Mot de passe temporaire** : après création d'un compte ou réinitialisation par un Admin, le compte est marqué « temporaire » ; à la connexion suivante l'utilisateur doit choisir un nouveau mot de passe avant tout autre écran.
- **RG-AUT-06** – **Inactivité** : déconnexion après `inactivite_min` minutes (0 = désactivée), puis écran de connexion avec « Votre session a été fermée. ».
- **RG-AUT-07** – Pied du menu : nom et profil de l'utilisateur, « Modifier le mot de passe », « Se déconnecter ».
- Jeton : JWT. Les mots de passe sont hachés (BCrypt). La longueur minimale vient du paramètre `mdp_min` (borne 6 à 32).

## 5. Utilisateurs (Configuration > Utilisateurs, droit `usr`)

- **RG-USR-01** – Liste paginée (10 par défaut). Colonnes : Utilisateur (nom prénom, e-mail dessous, initiales), Login, Dernière connexion, Profil, Statut, Actions. Tri sur les cinq premières. Tri par défaut : nom. La dernière connexion s'affiche en relatif (« Aujourd'hui », « Hier », « il y a n jours », « il y a n mois ») ou « Jamais connecté ».
- **RG-USR-02** – Filtres par statut : **Actifs** (défaut), **Désactivés**, **Tous**, avec compteurs. Quatre cartes de profil (compteur de comptes) filtrent la liste par profil par clic. Recherche insensible à la casse et aux accents sur nom, prénom, login, e-mail. Retour page 1 à tout changement.
- **RG-USR-03** – Le compte connecté porte la mention « Vous ».
- **RG-USR-04** – **Création** en deux étapes (Précédent / Suivant) : (1) nom, prénom ; (2) e-mail, login, profil. Tous obligatoires. Aucun mot de passe saisi : un mot de passe temporaire est généré à l'enregistrement. Bouton « Créer l'utilisateur » (état « Enregistrement… »).
- **RG-USR-05** – Validations, dans cet ordre, messages à reprendre tels quels :
  1. e-mail au format `xxx@yyy.zz` : « Format d'e-mail invalide. » ;
  2. login (création) de 3 à 30 caractères parmi lettres minuscules, chiffres, point, tiret, tiret bas : « Le login doit compter 3 à 30 caractères : lettres, chiffres, point, tiret ou tiret bas. » ;
  3. « Ce login existe déjà. » ;
  4. « Cette adresse e-mail est déjà utilisée. » (comparaisons insensibles à la casse ; login et e-mail enregistrés en minuscules) ;
  5. « Au moins un administrateur actif est requis. » (changer le profil du dernier admin actif).
- **RG-USR-06** – **Modification** : nom, prénom, e-mail, profil. Le login n'est pas modifiable (« Le login n'est pas modifiable. »). On ne peut pas modifier son propre profil (« Vous ne pouvez pas modifier votre propre profil. »).
- **RG-USR-07** – **Mot de passe temporaire** : généré par le back, 12 caractères tirés de `ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789` (sans caractères ambigus). Affiché **une seule fois** dans une fenêtre (« Mot de passe temporaire de … : », bouton de copie, mention « Il ne sera plus affiché après la fermeture de cette fenêtre. L'utilisateur devra le remplacer à sa prochaine connexion. »). Jamais stocké en clair, jamais renvoyé par une autre requête.
- **RG-USR-08** – **Réinitialisation** par un droit `usr` m : confirmation « Réinitialiser le mot de passe ? » (« L'ancien mot de passe ne fonctionnera plus et l'utilisateur devra en choisir un nouveau à sa prochaine connexion. »), puis fenêtre du mot de passe temporaire. Impossible pour son propre compte (« Pour votre compte, utilisez « Modifier le mot de passe » dans le menu. ») et pour un compte désactivé (« Compte désactivé : réinitialisation impossible. »).
- **RG-USR-09** – **Désactivation** : confirmation « Désactiver le compte ? » (« … ne pourra plus se connecter à l'application. Le compte et ses données sont conservés, et il peut être réactivé à tout moment. »). Refusée pour son propre compte (« Vous ne pouvez pas désactiver votre propre compte. ») et pour le dernier administrateur actif (« Dernier administrateur actif : désactivation impossible. »). La réactivation est libre. Aucune suppression de compte dans la maquette.
- **RG-USR-10** – Messages de succès : « Utilisateur enregistré avec succès ». Compte désactivé : avatar et ligne atténués.
- **RG-USR-11** – Toutes ces opérations sont écrites au journal d'audit (section 6). Le hash du mot de passe n'y apparaît jamais en clair (valeur masquée).

## 6. Journal d'audit (Configuration > Journal d'audit, Admin seulement)

- **RG-AUD-01** – Toute création (C), modification (M) et suppression (S) sur les 9 tables suivantes est journalisée automatiquement par le back (service ou listener, jamais par le front) : `GARAGE` (Garage), `LOYER_GARAGE` (Loyer), `LOCATAIRE`, `LOCATION`, `ECHEANCE` (Échéance), `VERSEMENT`, `REMARQUE`, `UTILISATEUR`, `PARAMETRE`. Les champs journalisés et leurs libellés figurent dans la méthode `TB()` du script de `Journal audit.dc.html`.
- **RG-AUD-02** – Une entrée contient : date et heure, utilisateur, action (C/M/S), concept (table), identifiant et libellé de l'enregistrement, valeurs complètes de l'enregistrement, valeurs modifiées (« As is » avant, « To be » après) et un **contexte** facultatif. Exemples de contextes à reproduire : « Premier loyer créé avec le garage. », « Clôture automatique de la période précédente : fin = veille du nouveau loyer. », « Suppression en cascade : le garage G15 a été supprimé. », « Paiement partiel : reste dû 30,00 €. », « Remarque créée automatiquement par la relance d'impayé. », « Annulation d'un versement (réservée à l'Admin). », « Réinitialisation du mot de passe : un mot de passe temporaire a été généré. », « Désactivation du compte : l'utilisateur ne peut plus se connecter. ».
- **RG-AUD-03** – Les opérations générées par le système (clôture automatique d'un loyer, suppression en cascade, remarque automatique) sont journalisées comme des lignes distinctes, au nom de l'utilisateur qui a déclenché l'opération.
- **RG-AUD-04** – `UTILISATEUR.mot_de_passe_hash` est journalisé comme **modifié** sans valeur : affichage « modifié, valeur masquée » et « •••••••• (masqué) ». Aucune valeur de mot de passe ou de hash n'est stockée dans le journal.
- **RG-AUD-05** – Le journal est en **lecture seule** : aucune modification ni suppression, y compris par un Admin.
- **RG-AUD-06** – **Assistant de critères** en 4 étapes : Période (du / au, jj/mm/aaaa, bornes facultatives, raccourcis de période, calendrier) · Par qui (multi-sélection d'utilisateurs ; aucune sélection = tous) · Sur quoi (multi-sélection de concepts ; aucune sélection = tous) · Validation (récapitulatif, bouton de génération). Messages : « Saisissez des dates valides (jj/mm/aaaa). » et « La date de début doit précéder la date de fin. ». Le résultat annonce « n opérations correspondent à ces critères ».
- **RG-AUD-07** – **Résultat** : opérations groupées par jour, tri chronologique inversé par défaut (inversable), « Afficher plus » par lots, filtre par action (Toutes, Créations, Modifications, Suppressions), recherche insensible aux accents sur libellé, concept, identifiant, utilisateur et valeurs. Aucune opération : « Aucune opération ne correspond à ces critères. »
- **RG-AUD-08** – **Détail d'une entrée** : tableau Champ / As is · avant / To be · après. Création : tout est ajouté ; suppression : tout est retiré ; modification : seuls les champs modifiés (les champs inchangés apparaissent si l'option `showUnchanged` est active). Pour un texte long, mise en évidence des mots ajoutés et supprimés.
- **RG-AUD-09** – **Historique d'un enregistrement** (« fil conducteur ») : toutes les opérations d'un même enregistrement (concept + identifiant), du plus ancien au plus récent, accessible depuis une entrée.
- **RG-AUD-10** – Si les critères sont modifiés après génération, un bandeau prévient « Les critères ont changé… » et demande « Régénérer l'historique ». Boutons « Modifier les critères », « Réinitialiser », « Retour au journal ».
- Pagination serveur : le back filtre par période, utilisateurs, concepts, action, recherche, et renvoie une page.

## 7. Maintenance (Configuration > Maintenance, Admin seulement)

- **RG-MNT-01** – Un interrupteur global met le site en maintenance. Confirmation « Mettre le site en maintenance ? » : « Les profils Gestionnaire, Locataire et Consultant seront déconnectés immédiatement et verront la page de maintenance. Les comptes et les données restent inchangés. Vous restez connecté en tant qu'Admin. »
- **RG-MNT-02** – En maintenance : seul l'Admin peut se connecter et utiliser l'application. Les autres profils reçoivent du back un refus dédié (HTTP 503, code `MAINTENANCE`) à la connexion et sur toute requête ; le front les redirige vers la page « Site en maintenance » (texte : « L'application est temporairement indisponible pendant une opération de maintenance. Vos données sont conservées et l'accès sera rétabli dès que possible. »). Les comptes ne sont pas désactivés ; leur statut ne change pas.
- **RG-MNT-03** – La page de maintenance propose « Réessayer » et vérifie périodiquement l'état du site (toutes les 2 s dans la maquette, à espacer en production, par exemple 15 à 30 s). Dès la réactivation, l'utilisateur retrouve l'accès.
- **RG-MNT-04** – L'écran affiche par profil le nombre de comptes actifs et l'état « Accès maintenu » (Admin) ou « Connexion bloquée » (autres). Bouton « Prévisualiser » : ouvre la page de maintenance sans activer le mode. Bouton « Réactiver le site ». Messages : « Site en maintenance : les profils Gestionnaire, Locataire et Consultant sont déconnectés » et « Site réactivé : les utilisateurs peuvent à nouveau se connecter ».
- **RG-MNT-05** – L'état de maintenance est persistant (section 11), partagé par toutes les sessions, et journalisé.

## 8. Chronologie (Locataires > Chronologie, droit `chr`)

- **RG-CHR-01** – Écran en deux zones. À gauche, la liste des locataires : recherche, bascule **Actifs** / **Tous** (avec compteurs), tri locataires actuels d'abord puis nom, ligne = initiales, nom, « Garage … · solde » (À jour / En retard / Ancien). À droite, la chronologie du locataire sélectionné.
- **RG-CHR-02** – En-tête du locataire : civilité, nom, badge de solde, garages loués, adresse. Trois indicateurs : **Locations** (nombre), **Total versé** (somme de ses versements), **Remarques ouvertes** (remarques « Problème » non résolues).
- **RG-CHR-03** – Événements du locataire, du plus récent au plus ancien : locations (début, fin), paiements (versements), remarques (création, résolution). Filtres **Tous / Locations / Remarques / Paiements** avec compteurs. Chaque événement : icône, titre, pastille, montant éventuel, date et heure, description (5 lignes, « voir plus » si tronquée). « Afficher plus (n) » par lots de 10. Sans événement : « Aucun événement. » Les événements futurs sont regroupés sous « À venir ».
- Le back expose un endpoint de chronologie par locataire (événements agrégés, paginés), pas un assemblage côté front.

## 9. Statistiques (Pilotage > Statistiques, droit `sta`)

Quatre pages, chacune avec un sélecteur d'**année**. Données calculées par le back.

- **RG-STA-01** – **Loyers encaissés** : somme des versements par mois de l'année, en euros.
- **RG-STA-02** – **Taux d'occupation** : garages loués en fin de mois, en %, par mois. Année en cours : le dernier point est la valeur du jour.
- **RG-STA-03** – **Répartition par statut** : camembert Loué / Libre / Indisponible à une date (« au jj/mm/aaaa », fin d'année ou date du jour pour l'année en cours), avec nombre et pourcentage, « n garages au total ».
- **RG-STA-04** – **Remarques par type** : remarques créées dans l'année par type (Information, Problème, Autre) et **taux de résolution des problèmes**. Sans remarque : « Aucune remarque créée cette année-là. » Sans problème : « Aucun problème signalé ».
- Le nombre de mois des graphiques du tableau de bord vient du paramètre `graph_mois` (RG-PAR-09).

## 10. Message libre (Envoi de messages > Message libre, droit `lib`)

- **RG-MLI-01** – Destinataires : **Un locataire** (liste « Choisir un locataire », les anciens sont marqués « (ancien) ») ou **Tous les locataires actuels (n)**.
- **RG-MLI-02** – Objet et message obligatoires, message en éditeur riche (Quill, mise en forme conservée en HTML). Variables disponibles, insérées au clic à l'endroit du curseur : `{civilite}`, `{nom}`, `{prenom}`, `{garage}`, `{expediteur}` (plus `{entreprise}`, `{coordonnees}`, `{iban}` fournies par les paramètres, RG-PAR-06).
- **RG-MLI-03** – Les locataires sans e-mail ne reçoivent pas le message ; un avertissement indique leur nombre : « n locataire(s) sans e-mail ne recevra(ont) pas le message. »
- **RG-MLI-04** – Aperçu (De, Cci, À, Objet), puis envoi avec confirmation. La signature (RG-PAR-12) est ajoutée automatiquement. Un e-mail par locataire ; une remarque « Information » reprenant l'objet et le texte exacts est ajoutée sur chaque fiche (comme RG-AVI-05).

## 11. Écarts du modèle de données et tables à ajouter

`maquette/Modele de donnees.dc.html` décrit 9 tables. La maquette récente en suppose davantage. Propositions (types indicatifs, à valider) :

### 11.1 Modifications de tables existantes

- **UTILISATEUR** : ajouter `nom VARCHAR(100)`, `prenom VARCHAR(100)`, `derniere_connexion TIMESTAMP NULL`, `mot_de_passe_temporaire BOOLEAN DEFAULT false`, `locataire_id INTEGER NULL FK → LOCATAIRE` (obligatoire si `role = locataire`, unique), `date_creation TIMESTAMP`. Valeurs de `role` : `admin`, `gestionnaire`, `locataire`, `consultant` (le modèle actuel indique `lecture_seule`).
- **PARAMETRE** : prévoir la nature `systeme` pour les lignes non affichées dans l'écran Paramètres (état de maintenance, voir 11.2). Les autres colonnes restent.
- **ECHEANCE** : le modèle indique « création manuelle par mois » alors que `RG-PAI-01` et le README demandent une ligne par garage loué calculée à l'affichage. Voir les décisions ouvertes du README.

### 11.2 Nouvelles tables

```
DROIT_PROFIL        id PK, profil VARCHAR(20) NOT NULL, ecran VARCHAR(10) NOT NULL,
                    peut_voir BOOLEAN, peut_ajouter BOOLEAN, peut_modifier BOOLEAN, peut_supprimer BOOLEAN
                    UNIQUE (profil, ecran). Lignes de départ : section 3 (droits.js).

DROIT_APPAREIL      id PK, appareil VARCHAR(10) NOT NULL ('tablette' | 'smartphone'), ecran VARCHAR(10) NOT NULL,
                    autorise BOOLEAN NOT NULL. UNIQUE (appareil, ecran). Ordinateur : toujours autorisé.

JOURNAL_AUDIT       id PK, date_heure TIMESTAMP NOT NULL, utilisateur_id FK → UTILISATEUR NOT NULL,
                    action CHAR(1) CHECK IN ('C','M','S'), concept VARCHAR(20) NOT NULL,
                    enregistrement_id INTEGER NOT NULL, libelle VARCHAR(200) NOT NULL,
                    valeurs JSONB NOT NULL (enregistrement complet), modifications JSONB NULL (avant/après),
                    contexte VARCHAR(300) NULL. Insertion seule : pas d'UPDATE ni de DELETE (RG-AUD-05).
                    Index (date_heure), (utilisateur_id), (concept, enregistrement_id).

AVIS_LOYER          id PK, location_id FK, loyer_garage_id FK (loyer à venir), ancien_montant DECIMAL(8,2),
                    nouveau_montant DECIMAL(8,2), date_effet DATE, moyen VARCHAR(12) ('email'|'telephone'|'courrier'|'oral'),
                    date_envoi DATE, objet VARCHAR(255) NULL, texte TEXT NULL, utilisateur_id FK.
                    Identifie l'avis (RG-AVI-08) : garage + loyer + montant + date de début.

RELANCE             id PK, echeance_id FK, reste_du DECIMAL(8,2) (au moment de la relance), cas VARCHAR(8) ('total'|'partiel'),
                    moyen VARCHAR(12), date_relance DATE, objet VARCHAR(255) NULL, texte TEXT NULL, utilisateur_id FK.
                    Identifie la relance (RG-REL-01) : échéance + reste dû.

JETON_MOT_DE_PASSE  id PK, utilisateur_id FK, jeton_hash VARCHAR(255), expire_le TIMESTAMP, utilise BOOLEAN
                    (mot de passe oublié, RG-AUT-02 et 03).
```

L'état de maintenance est une ligne `PARAMETRE` (`nature = systeme`, `cle = maintenance_active`, `valeur = 0|1`) ou un singleton en base ; le choix revient au back.

### 11.3 Données de départ de PARAMETRE

Clés lues par la maquette (`defParams()` dans `Gestion Garages.dc.html`). Bornes entières entre parenthèses.

| Catégorie | Clé | Type | Défaut | Obligatoire |
| --- | --- | --- | --- | --- |
| Expéditeur | `expediteur_nom` | texte | « Sophie Delmotte » | oui |
| Expéditeur | `expediteur_email` | email | `gestion@delmotte-garages.be` | oui |
| Expéditeur | `reponse_email` | email | vide | non |
| Expéditeur | `cci_email` | email | vide | non |
| Organisation | `org_nom`, `org_adresse`, `org_tel`, `org_iban` | texte | vide | non |
| Garages, loyers et locations | `garage_prefixe` | texte | `G` | oui |
| Garages, loyers et locations | `garage_chiffres` | entier (1 à 5) | 2 | oui |
| Garages, loyers et locations | `location_duree_min` | entier (1 à 60) | 1 | oui |
| Paiements et impayés | `jour_limite` | entier (1 à 31) | 31 | oui |
| Affichage | `lignes_liste` | entier (5 à 50) | 10 | oui |
| Affichage | `lignes_hist` | entier (3 à 20) | 5 | oui |
| Affichage | `graph_mois` | entier (6 à 24) | 12 | oui |
| Affichage | `langue_defaut` | liste (fr, en) | fr | oui |
| Affichage | `menu_replie` | liste (non, oui) | non | oui |
| Messages (nature métier) | `signature` | texte riche | `<p>Cordialement,<br>{expediteur}</p>` | non |
| Sécurité | `inactivite_min` | entier (0 à 240) | 0 | oui |
| Sécurité | `mdp_min` | entier (6 à 32) | 8 | oui |

Modèles de messages (catégorie « Modèles de messages », type texte et texte riche, objet et texte obligatoires) : avis de loyer, relance impayé total, relance paiement partiel. Les textes par défaut sont dans la maquette (`rmail`, et le modèle d'avis dans `Gestion Garages.dc.html`, rechercher `modele_avis`). Messages d'erreur de bornes : RG-PAR-11.

## 12. Appareils (responsive et accès selon l'appareil)

- **RG-APP-01** – Trois modes d'affichage selon la largeur : **Ordinateur** (plus de 1024 px), **Tablette** (641 à 1024 px), **Smartphone** (640 px et moins). Le front est responsive : tableaux, menu latéral (tiroir sous 1024 px), fenêtres et formulaires s'adaptent. La maquette expose un sélecteur de mode d'affichage pour la démonstration ; il n'existe pas dans l'application finale (la largeur de fenêtre décide).
- **RG-APP-02** – L'Admin choisit, dans Droits d'accès > « Accès selon l'appareil », quels écrans sont disponibles sur Tablette et sur Smartphone (grille écrans × appareils, brouillon puis enregistrement, comme RG-DRO-12). Ordinateur : tout est accessible. L'écran Droits d'accès reste toujours accessible, pour ne pas se bloquer.
- **RG-APP-03** – Défaut : Tablette, tous les écrans ; Smartphone, tous les écrans sauf ceux de la section Configuration (hors Droits d'accès).
- **RG-APP-04** – Un écran non disponible sur l'appareil disparaît du menu. Un accès direct affiche : « Cet écran n'est pas disponible sur tablette (ou smartphone). Ce réglage se trouve dans « Droits d'accès », section « Accès selon l'appareil ». » Cette restriction relève de la présentation (le back ne détecte pas l'appareil) : le front l'applique à partir du réglage lu en base.
- L'information « droit insuffisant » reste distincte : « Le profil … n'a pas accès à cet écran. Ce droit se règle dans « Droits d'accès ». »

## 13. Ce que la maquette simule et qui ne doit pas être repris

La maquette garde ces états dans le navigateur (`localStorage`). En production, ils viennent du back ou sont des préférences locales.

| Clé `localStorage` | Contenu dans la maquette | En production |
| --- | --- | --- |
| `gg_role` | Profil simulé | JWT du compte connecté |
| `gg_droits_profils_v3` | Droits par profil et écran | Table `DROIT_PROFIL` |
| `gg_droits_appareils_v1` | Droits par appareil | Table `DROIT_APPAREIL` |
| `gg_maintenance` | État de maintenance | Persistant côté back |
| `gg-params` | Valeurs des paramètres | Table `PARAMETRE` |
| `gg-lang`, `gg-page`, `gg-view` | Langue, dernière page, mode d'affichage | Préférences navigateur (langue, dernière page) ; `gg-view` supprimé |
| `gg_view`, `gg_rtab`, `gg_maint_preview` | Navigation entre pages de la maquette | Routes Angular |

Les données (garages, locataires, paiements, utilisateurs, journal d'audit) sont des données de démonstration. La date du jour de la maquette est le **8 octobre 2026** pour les utilisateurs et le journal, le **9 octobre 2026** pour le reste.

## 14. Points de vigilance dans `regles-de-gestion.md`

- La numérotation n'est pas dans l'ordre : le chapitre 13 est placé après les chapitres 14 et 15, `RG-DAS-07` précède `RG-DAS-06`, `RG-PAR-12` précède `RG-PAR-11`. Les identifiants restent valides.
- RG-DAS-03 : « mois précédent et mois courant » est le comportement de la maquette ; le paramètre `jour_limite` (RG-PAR-08) change le moment où le mois courant passe en retard.
- Les avis de loyer et relances mentionnent « Gestionnaire et Admin » : lire « profils ayant le droit `avi`, `rel` ou `lib` en ajout » (section 3).
- Le chapitre 13 contient des lignes devenues partiellement obsolètes (gestion des utilisateurs, rôles) : ce document fait foi.
