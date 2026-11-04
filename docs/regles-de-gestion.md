# Règles de gestion fonctionnelles – Application « Gestion de garages » (v2)

Source : maquettes `Gestion Garages.dc.html`, `Gestion des utilisateurs.dc.html`, `Journal audit.dc.html`, `Site en maintenance.dc.html` (comportements réellement codés), rapprochées du document `Regles metiers - Gestion location de garages.md`.
Date de référence de la maquette : 8–9 octobre 2026 (date du jour simulée).

Ce document réunit en un seul fichier les règles de `regles-de-gestion.md` et de `complements-maquette.md`. Les règles remplacées (rôles figés, suppressions réservées à l'Admin, sélecteur de rôle) y sont déjà corrigées. Le modèle de données associé est `Modele de donnees v2.dc.html`.

Convention : chaque règle porte un identifiant `RG-<domaine>-<n°>` pour la traçabilité (tests, backlog). Les points marqués « (à confirmer) » sont déduits du code de la maquette et à valider avec le métier.

---

## Sommaire

1. Périmètre et navigation
2. Règles communes aux listes
3. Saisie, dates et validation
4. Profils et droits
5. Garages
6. Loyers d'un garage (historique)
7. Locataires
8. Locations
9. Paiements
10. Remarques
11. Tableau de bord
12. Règles transversales
13. Envoi de messages : avis de loyer et relances d'impayés
14. Message libre
15. Paramètres
16. Authentification
17. Utilisateurs
18. Droits d'accès
19. Journal d'audit
20. Maintenance
21. Chronologie
22. Statistiques
23. Appareils
24. Écarts, décisions ouvertes et points à confirmer

---

## 1. Périmètre et navigation

- **RG-NAV-01** – Le menu latéral regroupe les écrans en six sections : Pilotage, Garages, Locataires, Locations et paiements, Envoi de messages et Configuration (tableau du § 1.1). Les entrées visibles dépendent des droits du profil (chapitre 18) et de l'appareil (chapitre 23).
- **RG-NAV-02** – Le menu latéral est repliable (icônes seules). La dernière page visitée est mémorisée côté navigateur.
- **RG-NAV-03** – Langues FR / EN, choix mémorisé côté navigateur.
- **RG-NAV-04** – Le changement de page réinitialise la recherche et ferme les fiches de remarques ou d'historique ouvertes.
- **RG-NAV-05** – L'utilisateur s'authentifie (chapitre 16). Son nom et son profil s'affichent en bas du menu. Le sélecteur de rôle de la maquette est une simulation et n'existe pas dans l'application.

### 1.1 Menu et écrans

Menu latéral repliable. Les entrées visibles dépendent des droits du profil (chapitre 18) et de l'appareil (chapitre 23). Un lien vers un écran non autorisé redirige vers le premier écran autorisé.

| Section | Écrans (id de droit) |
| --- | --- |
| Pilotage | Tableau de bord (`dash`) · Statistiques : Loyers encaissés, Taux d'occupation, Répartition par statut, Remarques par type (`sta`) |
| Garages | Liste des garages (`gar`) · Historique des loyers (`loy`) · Historique des locations (`hloc`) |
| Locataires | Liste des locataires (`ten`) · Chronologie (`chr`) |
| Locations et paiements | Locations (`loc`) · Paiements (`pai`) |
| Envoi de messages | Avis de loyer (`avi`) · Relances d'impayés (`rel`) · Message libre (`lib`) |
| Configuration | Paramètres (`par`) · Modèles de messages (`tpl`) · Utilisateurs (`usr`) · Droits d'accès (`dro`) · Journal d'audit (`aud`) · Maintenance (`mnt`) |

Les remarques (`rem`) n'ont pas d'entrée de menu : elles s'ouvrent depuis les fiches garage et locataire.

Dans la maquette, Utilisateurs, Droits d'accès, Journal d'audit et Maintenance sont des pages HTML séparées ; dans l'application, ce sont des écrans du même menu et du même en-tête.

---

## 2. Règles communes aux listes

- **RG-LST-01** – Pagination à 10 lignes par page par défaut (paramètres « lignes par page », RG-PAR-09) (garages, locataires, locations, paiements) ; 5 lignes pour les historiques (loyers, locations d'un garage) et pour la liste de choix du locataire ; 5 lignes par page pour les cartes du tableau de bord (impayés à relancer, remarques à traiter, avis de loyer à communiquer), toutes de même hauteur. Le compteur affiche « x–y sur n ».
- **RG-LST-02** – Une page demandée au-delà du dernier numéro est ramenée à la dernière page. Tout changement de filtre, de recherche ou de tri revient à la page 1.
- **RG-LST-03** – Filtres par statut sous forme de boutons avec compteur. Les compteurs tiennent compte de la recherche en cours.
- **RG-LST-04** – Recherche textuelle insensible à la casse, sur les colonnes suivantes :
  - Garages : numéro, locataire et adresse. L'adresse existe dans les données de démonstration mais n'est ni affichée ni saisissable dans la maquette (voir chapitre 13).
  - Locataires : nom, e-mail, adresse, garages.
  - Locations : locataire, garage.
  - Paiements : locataire, garage, statut.
- **RG-LST-05** – Tri multi-colonnes cumulatif. Un clic sur un en-tête fait passer la colonne de « non triée » à ▲ croissant, puis ▼ décroissant, puis la retire du tri. Le rang du tri s'affiche quand plusieurs colonnes sont triées. Le bouton « Annuler les tris (n) » les efface tous.
- **RG-LST-06** – Tri de base quand aucun tri n'est choisi :
  - Garages : numéro (ordre naturel).
  - Locataires : nom puis prénom.
  - Locations : ordre d'origine.
  - Les tris de texte sont insensibles aux accents et à la casse.

---

## 3. Saisie, dates et validation

- **RG-VAL-01** – Les champs obligatoires sont marqués d'un astérisque rouge. À l'enregistrement, tous les champs obligatoires vides sont surlignés en rouge en une seule fois. Le surlignage disparaît dès que l'utilisateur saisit dans le champ.
- **RG-VAL-02** – Les autres erreurs (règle métier violée) s'affichent en rouge dans la fenêtre, sans fermeture, et l'enregistrement est refusé.
- **RG-VAL-03** – Toutes les dates se saisissent au format `jj/mm/aaaa` avec masque automatique ou via un calendrier. Une date n'est acceptée que si elle existe réellement (jour, mois, année valides). Sinon le champ reste vide.
- **RG-VAL-04** – Dans le calendrier, le jour du jour est mis en évidence et un bouton « Aujourd'hui » est disponible.
- **RG-VAL-05** – Sans le droit « modifier » sur un écran (profil Consultant, ou droit retiré au chapitre 18), toutes les fenêtres d'édition de cet écran s'ouvrent en consultation : champs désactivés, bouton Enregistrer masqué, intitulé « Visualiser … ».
- **RG-VAL-06** – Les info-bulles des icônes d'action indiquent l'action ou la raison d'un blocage.

---

## 4. Profils et droits

- **RG-ROL-01** – Quatre profils : Admin, Gestionnaire, Locataire, Consultant (§ 4.1). Les droits par écran et par action sont paramétrables (chapitre 18). Le tableau donne les droits par défaut sur les écrans métier. Le profil Locataire est décrit en RG-DRO-05.

| Action | Consultant | Gestionnaire | Admin |
| --- | --- | --- | --- |
| Consulter garages, locataires, locations, paiements, remarques, historiques | Oui | Oui | Oui |
| Créer / modifier un garage | Non | Oui | Oui |
| Créer / modifier / supprimer un loyer (dernier loyer, selon RG-LOY) | Non | Oui | Oui |
| Créer / modifier un locataire | Non | Oui | Oui |
| Créer / modifier / clôturer une location | Non | Oui | Oui |
| Enregistrer un paiement (total ou partiel) | Non | Oui | Oui |
| Créer / modifier une remarque, la marquer résolue ou la rouvrir | Non | Oui | Oui |
| Annuler un versement | Non | Oui * | Oui |
| Supprimer un garage, un locataire, une location, une remarque | Non | Oui * (sous conditions) | Oui (sous conditions) |

\* Défaut de la maquette. La règle initiale réservait ces actions à l'Admin (voir RG-DRO-20 et chapitre 24).

- **RG-ROL-02** – Sans droit d'ajout ou de modification (Consultant), les boutons « Nouveau … », les boutons de paiement et « Nouvelle remarque » sont masqués ; l'interrupteur « Résolu » du formulaire de remarque est désactivé ; les icônes « Modifier » deviennent « Visualiser ».
- **RG-ROL-03** – Les suppressions définitives sont des droits paramétrables (colonne « supprimer », chapitre 18). Les conditions métier de chaque suppression restent vérifiées quel que soit le profil (RG-GAR-30, RG-LOCT-20, RG-LOC-30 à 33, RG-REM-07, RG-PAI-25). Ce qui ne peut pas être supprimé se désactive (garage Indisponible), se clôture (date de fin) ou, pour un loyer à venir, se supprime par le dernier loyer (RG-LOY-07).
- **RG-ROL-04** – La gestion des comptes utilisateurs est décrite au chapitre 17.

### 4.1 Profils (Admin, Gestionnaire, Locataire, Consultant)

- **RG-DRO-01** – Quatre profils : **Admin**, **Gestionnaire**, **Locataire**, **Consultant**. Codes conseillés : `ADMIN`, `GESTIONNAIRE`, `LOCATAIRE`, `CONSULTANT` (`CONSULTANT` remplace `LECTURE_SEULE`). Le libellé « Consultant » est un réglage d'affichage (prop `consultantName` dans la maquette).
- **RG-DRO-02** – Admin : tous les droits, non modifiables. Journal d'audit et Maintenance sont réservés à l'Admin et ne peuvent être accordés à aucun autre profil.
- **RG-DRO-03** – Gestionnaire (défaut) : mêmes droits que l'Admin sur tous les écrans hors section Configuration. Aucun accès à Configuration par défaut.
- **RG-DRO-04** – Consultant (défaut) : consulte les mêmes écrans que le Gestionnaire, sans droit d'ajout, de modification ni de suppression.
- **RG-DRO-05** – Locataire (défaut) : consulte uniquement Liste des garages, Historique des loyers, Historique des locations, Locations et Paiements, **limité à ses propres données** (ses garages, ses locations, ses loyers, ses paiements). Aucune action.
- **RG-DRO-06** – La limitation du profil Locataire est appliquée **par le back** : un compte Locataire est relié à une fiche locataire (table UTILISATEUR, colonne locataire_id) et chaque requête est filtrée sur cette fiche. Le front n'est jamais l'autorité.

---

## 5. Garages

### 5.1 Données et statuts

- **RG-GAR-01** – Un garage possède : numéro (identifiant), nombre de clés, clés en réserve, statut.
- **RG-GAR-02** – Statuts possibles : **Libre**, **Loué**, **Indisponible**.
  - **Loué** est calculé : le garage a une location active dont la date de début est atteinte (≤ date du jour) et sans fin échue. Il ne peut jamais être choisi manuellement.
  - **Libre** et **Indisponible** se choisissent manuellement (Indisponible = travaux, désactivation).
  - Une location « À venir » ne rend pas encore le garage Loué.
  - Quand une location se termine ou est supprimée, le garage repasse Libre.
- **RG-GAR-03** – Tant que le garage est Loué, son statut est verrouillé dans le formulaire (interrupteur désactivé, mention « Verrouillé : le garage est loué. »). Hors Loué, le statut se règle par l'interrupteur « Disponible à la location » : activé = Libre, désactivé = Indisponible.
- **RG-GAR-04** – Clés disponibles à remettre à un locataire = clés − réserve.
- **RG-GAR-05** – Le loyer affiché dans la liste est le loyer en vigueur à la date du jour (vide si aucun loyer en vigueur).

### 5.2 Création

- **RG-GAR-10** – Champs obligatoires : numéro, clés, réserve, loyer mensuel (€), début du loyer. Le statut initial est Libre ou Indisponible.
- **RG-GAR-11** – Le numéro est proposé automatiquement (préfixe + plus grand numéro existant + 1 ; par défaut `G` sur 2 chiffres, paramètres RG-PAR-07). Il est mis en majuscules, nettoyé des espaces, et doit être **unique** : « Ce numéro de garage existe déjà. »
- **RG-GAR-12** – Clés ≥ 0. Réserve comprise entre 0 et le nombre de clés : « La réserve doit être comprise entre 0 et le nombre de clés. »
- **RG-GAR-13** – Le loyer saisi (> 0) et sa date de début créent le **premier enregistrement de l'historique des loyers** du garage.

### 5.3 Modification

- **RG-GAR-20** – Le numéro n'est pas modifiable. Le loyer ne se modifie pas ici : il se gère dans l'historique des loyers.
- **RG-GAR-21** – Mêmes contrôles sur clés et réserve qu'à la création.
- **RG-GAR-22** – Si une location active existe, clés − réserve doit rester ≥ au nombre de clés remises à cette location : « La location active a n clé(s) remise(s) : clés moins réserve doit rester supérieur ou égal. »

### 5.4 Suppression (droit « supprimer » de l'écran Garages)

- **RG-GAR-30** – Suppression refusée avec la liste des motifs si :
  - le garage est actuellement loué (nom du locataire indiqué) ;
  - le garage a un historique de locations (nombre indiqué) : les locations passées sont conservées.
- **RG-GAR-31** – Sinon, confirmation « Ce garage n’est rattaché à aucune location. Cette action est définitive. » puis suppression du garage et de ses loyers.
- **RG-GAR-32** – Un garage qui ne peut pas être supprimé se désactive en passant au statut Indisponible.

### 5.5 Consultation

- **RG-GAR-40** – Filtres : Loué, Libre, Indisponible, Tous.
- **RG-GAR-41** – Colonnes : numéro, clés, réserve, loyer, remarques (avec compteur), locataire (avec initiales), statut, menu historique, actions. Colonnes triables : numéro, clés, réserve, loyer, remarques (par nombre), locataire, statut.
- **RG-GAR-42** – Le menu (…) propose « Historique des loyers » et « Historique des locations ». Un clic sur la ligne ouvre l'historique des loyers.
- **RG-GAR-43** – Historique des locations d'un garage : locataire, début, fin, clés, loyer, statut (Active ou Terminée). Tri du plus récent au plus ancien, 5 par page. Message « Ce garage n'a jamais été loué. » si vide.

---

## 6. Loyers d'un garage (historique)

- **RG-LOY-01** – Chaque garage a une suite de périodes de loyer (montant, début, fin). Une période sans date de fin est la période courante.
- **RG-LOY-02** – États affichés :
  - **À venir** : date de début à partir du 1er du mois suivant la date du jour.
  - **En vigueur** : pas de fin, ou fin ≥ date du jour.
  - **Clôturé** : fin dépassée.
- **RG-LOY-03** – Liste affichée du plus récent au plus ancien, 5 par page.
- **RG-LOY-04** – **Nouveau loyer** : montant > 0 et date de début obligatoires. La date de début doit être **strictement postérieure** au début du loyer précédent : « La date de début doit être postérieure au début du loyer précédent (jj/mm/aaaa) : pas de chevauchement. »
- **RG-LOY-05** – L'ajout d'un nouveau loyer **clôture automatiquement** le précédent : fin = veille de la nouvelle date de début. Aucune saisie manuelle de la date de fin.
- **RG-LOY-06** – **Modification** : seul le **dernier** loyer est modifiable (montant et début). La date de début modifiée doit rester postérieure au début du loyer précédent, dont la fin est recalculée (veille du nouveau début).
- **RG-LOY-07** – **Suppression** : seul le **dernier** loyer peut être supprimé, et seulement s'il est **À venir**. Le loyer précédent redevient la période courante (sans fin).
- **RG-LOY-08** – **Blocage par paiement anticipé** : si un paiement est déjà enregistré pour un mois égal ou postérieur au mois de début du dernier loyer, modification et suppression sont bloquées. Message : « Modification et suppression impossibles : un paiement anticipé est déjà enregistré pour … Annulez d'abord ce paiement dans l'écran Paiements. »
- **RG-LOY-09** – **Blocage par location démarrée** : le dernier loyer, s'il est déjà en vigueur (pas « À venir »), ne se modifie plus dès qu'une location de ce garage a démarré (début ≤ date du jour) et n'était pas terminée avant la date de début du loyer. Le bouton de modification est grisé, avec une info-bulle selon le cas : « Un paiement anticipé existe déjà » (RG-LOY-08) ; « Modification impossible : une location est en cours depuis la date de début de ce loyer » ; « Modification impossible : une location a eu lieu depuis la date de début de ce loyer ». Un loyer « À venir » reste modifiable.
  - Cas d'un garage **Libre** : le montant du dernier loyer en vigueur ne peut être adapté que si, depuis sa date de début, aucune location n'a eu lieu (aucune location active, ni terminée à la date de début du loyer ou après). Dans ce cas, la date de début ne peut pas être reculée avant la fin d'une location existante : « La date de début doit être postérieure à la fin de la dernière location (jj/mm/aaaa). »
- **RG-LOY-10** – Un loyer doit exister à la date de début d'une location pour pouvoir créer ou modifier celle-ci (RG-LOC-10).
- **RG-LOY-11** – Sans le droit de modification sur les loyers (Consultant), le formulaire s'ouvre en consultation et aucun bouton « Nouveau loyer » n'est proposé.

---

## 7. Locataires

### 7.1 Données

- **RG-LOCT-01** – Champs : civilité (M. / Mme, facultatif), nom, prénom, rue, n°, code postal, localité, téléphone 1, téléphone 2 (facultatif), e-mail (facultatif).
- **RG-LOCT-02** – Obligatoires : nom, prénom, rue, n°, code postal, localité, téléphone 1.
- **RG-LOCT-03** – E-mail, s'il est renseigné, doit respecter le format `xxx@yyy.zz` : « Format d'e-mail invalide. »
- **RG-LOCT-04** – **Détection de doublon** sur nom + prénom (insensible à la casse, hors le locataire en cours d'édition). Alerte non bloquante « Un locataire avec le même nom et prénom existe déjà. Vous pouvez enregistrer quand même. » Le bouton devient « Enregistrer quand même » ; le second clic enregistre. Toute modification d'un champ réarme l'alerte.

### 7.2 Statut du locataire (calculé)

- **RG-LOCT-10** – Un locataire est :
  - **Actuel** : il a au moins un garage loué actuellement. Badge **À jour** ou **En retard** selon ses paiements (RG-PAI-30) ;
  - **Ancien** : il a eu des locations mais n'en a plus d'active. Badge « Ancien », ligne atténuée ;
  - **Sans location** : jamais loué. Badge « Sans location ».
- **RG-LOCT-11** – Filtres : Actuels (par défaut), Anciens, Sans location, Tous. La colonne Garage liste les garages actuellement loués.
- **RG-LOCT-12** – Colonnes : locataire, remarques, garage, statut, actions. Toutes triables sauf les actions. L'adresse et le téléphone sont affichés sous le nom.

### 7.3 Suppression (droit « supprimer » de l'écran Locataires)

- **RG-LOCT-20** – Suppression refusée avec motifs si :
  - le locataire a été assigné à un garage (nombre de locations et garages concernés) ;
  - des paiements ont été effectués pour ce locataire.
- **RG-LOCT-21** – Sinon, confirmation « Cette action est définitive : le locataire et ses remarques seront supprimés. »

---

## 8. Locations

### 8.1 Statuts (calculés, jamais saisis)

- **RG-LOC-01** – **Active** : démarrée, sans date de fin ou avec une date de fin future.
- **RG-LOC-02** – **À venir** : date de début postérieure à la date du jour.
- **RG-LOC-03** – **Terminée** : date de fin passée ou égale à la date du jour.
- **RG-LOC-04** – Filtres : Actives (par défaut), À venir, Terminées. Colonnes : locataire, garage, début, fin, loyer, clés, actions. Toutes triables sauf les actions. Le loyer affiché est celui du garage ; pour une location terminée il est figé à sa valeur de fin.
- **RG-LOC-05** – **Filtre par période de fin** (filtre Terminées uniquement) : « Comprises entre le … et le … ». Les deux bornes sont facultatives, inclusives et se saisissent au format `jj/mm/aaaa` ou via le calendrier. Elles portent sur la **date de fin** de la location. Un lien efface les deux bornes. Tout changement de borne revient à la page 1. Les bornes ne s'appliquent pas aux filtres Actives et À venir.

### 8.2 Création

- **RG-LOC-10** – Champs obligatoires : locataire, garage, date de début, clés remises.
- **RG-LOC-11** – Choix du locataire par recherche (nom, prénom, insensible aux accents) dans la liste triée par nom, 5 par page. Chaque ligne indique « Actuel » (a une location active) ou « Ancien ». Tout locataire, actuel ou ancien, peut être choisi : un locataire peut avoir plusieurs locations, sur des garages différents.
- **RG-LOC-12** – Seuls les garages au statut **Libre** sont proposés ; sinon « Aucun garage libre pour le moment. » (Un garage Indisponible ou Loué n'est jamais proposé.)
- **RG-LOC-13** – Contrôles à l'enregistrement, dans cet ordre :
  1. le garage doit être Libre : « Ce garage n'est pas libre. » ;
  2. un loyer doit exister pour ce garage à la date de début : « Aucun loyer n'est défini pour ce garage à cette date. » ;
  3. clés remises ≥ 0 ;
  4. clés remises ≤ clés − réserve du garage : « Maximum n clés remises (hors réserve). »
- **RG-LOC-14** – Les clés remises sont proposées par défaut à la valeur maximale (clés − réserve) et recalculées au changement de garage. Le formulaire affiche les clés disponibles, la réserve et le loyer à la date de début.
- **RG-LOC-15** – La location est créée sans date de fin. Elle est « Active » si le début est ≤ date du jour, sinon « À venir ». La liste bascule automatiquement sur le filtre correspondant.
- **RG-LOC-16** – Une date de début passée ou future est acceptée.

### 8.3 Modification et clôture

- **RG-LOC-20** – Modifiables : date de début, clés remises et (location active seulement) date de fin. Locataire et garage sont figés.
- **RG-LOC-21** – Mêmes contrôles qu'en création sur : début obligatoire, loyer existant à la date de début, clés (0 à clés − réserve).
- **RG-LOC-22** – La date de fin est facultative et réservée aux locations actives (champ masqué pour une location à venir).
- **RG-LOC-23** – Quand elle est renseignée, la date de fin doit être **le dernier jour d'un mois** : « La date de fin doit être le dernier jour d'un mois. » et doit être ≥ date de début : « La date de fin doit être postérieure ou égale au début. »
- **RG-LOC-24** – **Date de fin future** : enregistrée, la location reste active jusque-là et la date s'affiche dans la liste.
- **RG-LOC-25** – **Date de fin passée ou du jour** : la location passe à « Terminée », le garage redevient Libre, le loyer et les clés sont conservés dans l'historique. Pour une location à venir, la modification du début déplace la location et ajuste le filtre affiché (À venir ou Actives).
- **RG-LOC-26** – Effacer la date de fin d'une location active la rend de nouveau sans échéance.
- **RG-LOC-27** – Une location terminée n'a plus d'action de modification dans la liste (consultation via les historiques).

### 8.4 Suppression (droit « supprimer » de l'écran Locations)

- **RG-LOC-30** – Seules les locations **Active** et **À venir** exposent l'action de suppression.
- **RG-LOC-31** – **À venir** : supprimable, avec confirmation « Oui / Non », sans autre condition.
- **RG-LOC-32** – **Active** : refusée si au moins un paiement a déjà été effectué sur le garage : « n paiement(s) ont déjà été effectué(s) pour cette location. » Sinon la location est supprimée et le garage repasse Libre.
- **RG-LOC-33** – **Terminée** : jamais supprimable, car elle fait partie de l'historique du garage.
- **RG-LOC-34** – Dans tous les autres cas, la clôture se fait par la date de fin (RG-LOC-23 à 25).

---

## 9. Paiements

### 9.1 Principe

- **RG-PAI-01** – L'écran est organisé par **mois** (sélecteur mois / année, mois courant par défaut). Pour le mois choisi, une ligne de paiement existe pour chaque garage loué : locataire, garage, montant, date de paiement, mode, statut.
- **RG-PAI-02** – Tout mois peut être consulté et alimenté : passé, courant ou futur (paiement anticipé).
- **RG-PAI-03** – Montant dû = loyer du garage. Un garage qui n'est pas loué n'a pas de ligne de paiement.

### 9.2 Statuts

- **RG-PAI-10** – Reçu = somme des versements enregistrés ; Reste dû = montant dû − reçu (jamais négatif).
- **RG-PAI-11** – **Payé** : reste dû = 0 et reçu > 0. **Partiel** : reçu > 0 et reste dû > 0. **À payer** : aucun versement.
- **RG-PAI-12** – **En retard** : ligne non soldée dont le mois est passé (ou impayé signalé du mois courant). Le badge « À payer » passe en rouge quand la ligne est en retard, en orange sinon. Partiel est toujours orange.
- **RG-PAI-13** – Filtres : Tous, À payer, Partiel, Payé, avec compteurs. Colonnes triables : locataire, garage, montant, payé le, mode, statut. Le reste dû d'un partiel s'affiche sous le montant (rouge si en retard).

### 9.3 Enregistrer un paiement

- **RG-PAI-20** – Les boutons de paiement n'apparaissent que si la ligne n'est pas soldée et que le profil a le droit d'enregistrer un paiement (droit `pai`, ajout).
- **RG-PAI-21** – **Payer en totalité** : verse le reste dû en un geste. Champs obligatoires : mode de paiement (Virement ou Espèces) et date de paiement (par défaut la date du jour).
- **RG-PAI-22** – **Paiement partiel** : montant reçu obligatoire, > 0 et **strictement inférieur** au reste dû. Sinon : « Le montant doit être inférieur au reste dû (x €). Utilisez « Payer en totalité ». » Mode et date obligatoires.
- **RG-PAI-23** – Chaque paiement crée un **versement** (montant, mode, date). Plusieurs versements successifs peuvent solder une échéance. La date et le mode affichés dans la liste sont ceux du dernier versement.
- **RG-PAI-24** – Le détail des versements (accessible dès qu'un versement existe) affiche montant dû, reçu, reste dû, et la liste des versements avec date, mode (icône) et montant.
- **RG-PAI-25** – **Annulation** : un versement peut être annulé individuellement par un profil ayant le droit `pai` en suppression (Admin par défaut). Le reste dû et le statut sont recalculés.

### 9.4 Retards

- **RG-PAI-30** – Un locataire est « En retard » s'il a au moins une échéance non soldée en retard (RG-PAI-12).
- **RG-PAI-31** – Une échéance partielle reste en retard pour son reste dû.

### 9.5 Indicateurs de l'écran

- **RG-PAI-40** – Attendu = somme des montants dus du mois. Encaissé = somme des versements, ventilée virement / espèces. En retard = somme des restes dus des lignes en retard.

---

## 10. Remarques

- **RG-REM-01** – Une remarque est rattachée soit à un **garage** (écran Garages, icône commentaire), soit à un **locataire** (écran Locataires). Elle n'est jamais rattachée à une location.
- **RG-REM-02** – Champs obligatoires : type (Information, Problème, Autre) et texte. Le texte est un éditeur riche : gras, italique, souligné, listes numérotées et à puces, liens. Un texte vide est refusé.
- **RG-REM-03** – La date et l'heure de création sont ajoutées automatiquement à la création, non modifiables (mention affichée dans le formulaire de création uniquement).
- **RG-REM-04** – La notion de **résolu** n'existe que pour le type **Problème**.
  - Nouvelle remarque Problème : non résolue.
  - Type autre que Problème : aucune notion de résolution (valeur vide).
  - Passer une remarque d'un autre type à Problème l'initialise non résolue ; modifier une remarque Problème conserve son état.
- **RG-REM-05** – **Résolu** se règle uniquement dans le formulaire de modification d'une remarque (interrupteur « Résolu », Problème uniquement, pour les profils pouvant modifier une remarque). L'activer affiche, sur la même ligne que l'interrupteur, une **date de résolution** obligatoire, proposée à la date du jour. Affichage dans la liste : « Résolu le jj/mm/aaaa ». Le formulaire de création n'a pas cet interrupteur.
- **RG-REM-06** – Désactiver l'interrupteur (rouvrir) efface l'état résolu et sa date à l'enregistrement. Il n'y a plus de bouton résolu / rouvrir dans la liste.
- **RG-REM-07** – Suppression d'une remarque : réservée aux profils ayant le droit `rem` en suppression (Admin par défaut).
- **RG-REM-08** – Tri du plus récent au plus ancien. Message « Aucune remarque. » si vide. Le nombre de remarques s'affiche en pastille sur l'icône de chaque garage et chaque locataire.
- **RG-REM-09** – Les profils ayant les droits `rem` correspondants (Gestionnaire et Admin par défaut) peuvent ajouter, modifier et résoudre. Le Consultant consulte uniquement.

---

## 11. Tableau de bord

- **RG-DAS-01** – **Taux d'occupation** = garages loués / total des garages (arrondi, en %), avec « n garages loués sur N ».
- **RG-DAS-02** – **Loyers mensuels** = somme des loyers des garages actuellement loués.
- **RG-DAS-03** – **Impayés** = somme des restes dus des échéances en retard (mois précédent et mois courant dans la maquette). La note distingue les impayés totaux (aucun versement) et partiels.
- **RG-DAS-04** – **Garages libres** = nombre de garages au statut Libre, avec le nombre d'indisponibles.
- **RG-DAS-05** – Deux graphiques sur 12 mois (paramètre `graph_mois`, RG-PAR-09), avec navigation entre eux : loyers encaissés (euros) et taux d'occupation (%). Le dernier point correspond aux valeurs courantes.
- **RG-DAS-06** – Liste « Impayés à relancer (n) » : impayés non encore relancés (RG-REL-01), paginée par 5. Colonnes : locataire, garage, période, reste dû, badge **Total** (rouge) ou **Partiel** (orange, avec « Reçu x sur y » en info-bulle). Deux actions par ligne (profils ayant le droit `rel` en ajout) : e-mail de relance (si le locataire a un e-mail, ouvre l'écran Relances d'impayés) et « Marquer comme relancé » (téléphone, courrier postal, oralement). Une ligne relancée disparaît de la liste.
- **RG-DAS-07** – Carte « Avis de loyer à communiquer (n) » : tâches du gestionnaire (RG-AVI-01), 4 lignes maximum (locataire, garage, date d'effet, téléphone si pas d'e-mail, ancien → nouveau loyer, badge **À envoyer** ou **À contacter**), mention « n autres avis » au-delà. Un clic ouvre l'écran Envoi de messages. Les avis envoyés disparaissent de la carte.

---

## 12. Règles transversales

- **RG-TRA-01** – Jamais de statut de location stocké : il est toujours déduit des dates (RG-LOC-01 à 03). Le statut « Loué » d'un garage est de même déduit des locations.
- **RG-TRA-02** – Intégrité historique : un garage ayant eu des locations, un locataire ayant eu des locations ou des paiements, et une location terminée ne sont jamais supprimés.
- **RG-TRA-03** – Montants en euros, format français (séparateur de milliers, symbole € après le montant).
- **RG-TRA-04** – Les clés remises à une location sont toujours bornées par clés − réserve du garage, à la création, à la modification de la location et à la modification du garage.
- **RG-TRA-05** – Les périodes de loyer d'un même garage ne se chevauchent pas : la fin de l'ancienne = veille du début de la nouvelle.

---

## 13. Envoi de messages

### 13.1 Avis de changement de loyer

- **RG-AVI-01** – Un avis est à envoyer pour chaque couple (garage loué, période de loyer **À venir**) dont le montant diffère de la période précédente. Le destinataire est le locataire actuel du garage. Pas d'avis si la location se termine avant la date d'effet.
- **RG-AVI-02** – Liste : case à cocher, locataire (e-mail dessous), garage, ancien → nouveau loyer avec écart, date d'effet, actions. Filtres **À envoyer** (par défaut) et **Envoyés**, avec compteurs. Recherche locataire / garage, tri multi-colonnes (locataire, garage, loyer, date d'effet), pagination à 10.
- **RG-AVI-03** – Un avis est une **tâche de communication** pour le gestionnaire, pas seulement un e-mail. L'écran Envoi de messages ne liste que les locataires **avec e-mail** (statuts **À envoyer** / **Envoyé**, filtres du même nom). Les locataires **sans e-mail** n'apparaissent que sur le tableau de bord, avec le badge **À contacter** et leur téléphone : le gestionnaire les informe par téléphone, par courrier postal ou oralement, puis utilise l'action « Marquer comme informé » (moyen de contact et date obligatoires). Une remarque « Information » « Locataire averti par téléphone / par courrier postal / oralement le jj/mm/aaaa » est alors ajoutée à la fiche et la tâche disparaît de la carte.
- **RG-AVI-04** – Toutes les lignes avec e-mail sont cochées par défaut ; l'utilisateur décoche celles à ne pas envoyer. La case d'en-tête coche / décoche tout le résultat filtré (état indéterminé si partiel).
- **RG-AVI-05** – Le bouton « Envoyer (n) » (n = lignes cochées, désactivé à 0) ouvre une confirmation avec la liste des destinataires. À la confirmation : un e-mail est envoyé à chaque locataire coché ; une **remarque de type Information** est créée sur sa fiche, indiquant qu'il a été averti par e-mail (date, adresse, ancien et nouveau loyer, date d'effet) et reprenant l'**objet et le texte exacts du message**. Les lignes envoyées quittent la liste « À envoyer » et passent dans « Envoyés ».
- **RG-AVI-06** – Aperçu de l'e-mail par ligne (œil) ; pour un avis envoyé, l'aperçu affiche le message tel qu'il a été expédié.
- **RG-AVI-07** – « Modèle du message » : objet et texte modifiables avec les variables {civilite}, {nom}, {prenom}, {garage}, {ancien_loyer}, {nouveau_loyer}, {date_effet}, {expediteur} (nom de l’expéditeur défini dans les paramètres, RG-PAR-02). Objet et texte sont obligatoires. Le texte est saisi dans un éditeur riche Quill (gras, italique, souligné, listes, liens), intégré par le framework du frontend définitif ; le message envoyé et la remarque créée conservent cette mise en forme (HTML).
- **RG-AVI-08** – Un avis est identifié par garage + période de loyer + montant + date de début : si le loyer à venir est modifié après l'envoi, un nouvel avis est à envoyer.
- **RG-AVI-09** – Droits : l'envoi, les cases à cocher et « Marquer comme informé » exigent le droit `avi` en ajout ; le modèle exige le droit `tpl` en modification. Le Consultant consulte les listes et les aperçus.
- **RG-AVI-10** – Chaque avis communiqué (e-mail, téléphone, courrier postal, oralement) est enregistré avec le moyen, la date, l'ancien et le nouveau loyer figés et, pour un e-mail, l'objet et le texte expédiés (table AVIS_LOYER). Les avis à envoyer restent calculés.

### 13.2 Relances d'impayés

- **RG-REL-01** – Une relance est à faire pour chaque échéance en retard (RG-PAI-12) non encore relancée. Elle est identifiée par garage + mois + reste dû : si un versement modifie le reste dû après une relance, une nouvelle relance est à faire. Le destinataire est le locataire du garage.
- **RG-REL-02** – Deux cas, **Impayé total** (aucun versement) et **Paiement partiel** (versement(s) inférieur(s) au montant dû). Le message est choisi automatiquement selon le cas, avec un modèle modifiable par cas (objet et texte obligatoires, éditeur riche). Variables : {civilite}, {nom}, {prenom}, {garage}, {periode}, {montant_du}, {montant_recu}, {reste_du}, {expediteur}.
- **RG-REL-03** – Trois moyens de relance : **e-mail** (si le locataire a un e-mail), **téléphone**, **courrier postal**, **oralement**. L'écran liste toutes les échéances à relancer, avec e-mail ou non. Filtres **À relancer** (par défaut) et **Relancés** (avec le moyen et la date), recherche, tri (locataire, garage, reste dû, période), pagination à 10.
- **RG-REL-04** – E-mail : cases à cocher (cochées par défaut pour les lignes avec e-mail), bouton « Envoyer (n) » avec confirmation, aperçu par ligne. Un e-mail est envoyé par locataire coché, avec le modèle correspondant à son cas.
- **RG-REL-05** – Téléphone, courrier postal, oralement : action « Marquer comme relancé », avec moyen de contact et date obligatoires (date du jour par défaut). Disponible même si le locataire a un e-mail.
- **RG-REL-06** – Toute relance crée une **remarque de type Information** sur la fiche du locataire : « Locataire relancé par e-mail / par téléphone / par courrier postal / oralement le jj/mm/aaaa » avec le cas (impayé total ou paiement partiel), le montant, le garage et la période. Pour un e-mail, l'objet et le texte exacts du message sont repris.
- **RG-REL-07** – Droits : l'envoi et la relance manuelle exigent le droit `rel` en ajout ; les modèles exigent le droit `tpl` en modification. Le Consultant consulte.
- **RG-REL-08** – Chaque relance est enregistrée avec le moyen, la date, le cas (total ou partiel), le reste dû figé et, pour un e-mail, l'objet et le texte expédiés (table RELANCE). Les relances à faire restent calculées.

---

## 14. Message libre (Envoi de messages, droit `lib`)

- **RG-MLI-01** – Destinataires : **Un locataire** (liste « Choisir un locataire », les anciens sont marqués « (ancien) ») ou **Tous les locataires actuels (n)**.
- **RG-MLI-02** – Objet et message obligatoires, message en éditeur riche (Quill, mise en forme conservée en HTML). Variables disponibles, insérées au clic à l'endroit du curseur : `{civilite}`, `{nom}`, `{prenom}`, `{garage}`, `{expediteur}` (plus `{entreprise}`, `{coordonnees}`, `{iban}` fournies par les paramètres, RG-PAR-06).
- **RG-MLI-03** – Les locataires sans e-mail ne reçoivent pas le message ; un avertissement indique leur nombre : « n locataire(s) sans e-mail ne recevra(ont) pas le message. »
- **RG-MLI-04** – Aperçu (De, Cci, À, Objet), puis envoi avec confirmation. La signature (RG-PAR-12) est ajoutée automatiquement. Un e-mail par locataire ; une remarque « Information » reprenant l'objet et le texte exacts est ajoutée sur chaque fiche (comme RG-AVI-05).

---

## 15. Paramètres

- **RG-PAR-01** – L’écran « Paramètres » (menu latéral) distingue deux **natures** de paramètres : **Paramètres métier** (règles de gestion et données de l’activité : Organisation ; Garages, loyers et locations ; Paiements et impayés) et **Paramètres de l’application** (Expéditeur, Affichage, Sécurité). Chaque nature regroupe ses paramètres **par catégorie**, choisie par onglets. Catégories : **Expéditeur**, **Organisation**, **Garages, loyers et locations**, **Paiements et impayés**, **Affichage**, **Sécurité** et **Modèles de messages**. Dans la maquette, les valeurs sont conservées dans le navigateur ; dans l’application, les paramètres sont stockés dans la table `PARAMETRE` (nature, catégorie, clé unique, libellé, type, valeur, obligatoire, ordre ; natures `metier`, `application` et `systeme`). Une nouvelle catégorie apparaît dès qu’un paramètre y est rattaché.
- **RG-PAR-02** – Catégorie **Expéditeur** : nom de l’expéditeur (obligatoire, valeur de la variable {expediteur} dans tous les messages), adresse e-mail d’envoi (obligatoire, affichée dans le champ « De » des aperçus) adresse de réponse (facultative ; à défaut, l’adresse d’envoi) et copie cachée Cci (facultative, affichée dans l’aperçu). Les adresses doivent respecter le format `xxx@yyy.zz` : « Format d’e-mail invalide : … ».
- **RG-PAR-03** – Catégorie **Modèles de messages** : objet et texte des e-mails « Avis de loyer », « Relance · Impayé total » et « Relance · Paiement partiel » (RG-AVI-07, RG-REL-02). Ces modèles ne se modifient que depuis cet écran.
- **RG-PAR-04** – Un seul bouton « Enregistrer » par catégorie. Les champs obligatoires vides sont surlignés (RG-VAL-01). Le changement de catégorie abandonne les modifications non enregistrées.
- **RG-PAR-05** – Droits : modification réservée aux profils ayant le droit `par` en modification (Gestionnaire et Admin par défaut) ; le Consultant consulte (champs désactivés, bouton masqué). Les lignes de paramètres ne se créent ni ne se suppriment depuis l’écran.
- **RG-PAR-06** – Catégorie **Organisation** (facultatifs) : nom de l’entreprise ou du bailleur, adresse postale, téléphone (deux champs distincts), IBAN. Ils alimentent les variables {entreprise}, {coordonnees} (adresse postale et téléphone, séparés par « · » ; un champ vide est omis) et {iban}, disponibles dans les modèles et le message libre.
- **RG-PAR-07** – Catégorie **Garages, loyers et locations** : préfixe du numéro de garage (défaut G) et nombre de chiffres (défaut 2) pour le numéro proposé (RG-GAR-11) ; durée minimale d’une location en mois calendaires (défaut 1), contrôlée à la saisie de la date de fin : « La durée minimale d’une location est de n mois. »
- **RG-PAR-08** – Catégorie **Paiements et impayés** : jour limite de paiement dans le mois (1 à 31, défaut 31). Une échéance non soldée du mois en cours passe « En retard » dès que le jour du jour dépasse cette limite ; à 31, le retard ne commence qu’au mois suivant (RG-PAI-12).
- **RG-PAR-09** – Catégorie **Affichage** : lignes par page des listes (défaut 10) et des historiques et cartes (défaut 5) ; nombre de mois des graphiques (défaut 12) ; langue par défaut, appliquée tant que l’utilisateur n’a pas choisi la sienne (RG-NAV-03) ; menu latéral replié par défaut (RG-NAV-02).
- **RG-PAR-10** – Catégorie **Sécurité** : déconnexion après n minutes d’inactivité (0 = désactivée, défaut) ; longueur minimale du mot de passe (défaut 8), contrôlée au changement et à la réinitialisation.
- **RG-PAR-11** – Les paramètres numériques sont des entiers compris dans des bornes propres à chaque paramètre : « … : entier compris entre min et max. »
- **RG-PAR-12** – **Formule de politesse et signature** : paramètre unique de type texte riche (catégorie Messages, nature métier), modifiable depuis la page « Modèles de messages ». Il peut contenir les variables {expediteur}, {entreprise}, {coordonnees} et {iban}. Il est ajouté automatiquement en bas de tout e-mail envoyé (avis de loyer, relances, message libre), dans l’aperçu, dans le message expédié et dans la remarque créée sur la fiche du locataire. Les modèles ne la reprennent donc pas. Valeur par défaut : « Cordialement, {expediteur} » ; elle peut être vide.

### 15.1 Valeurs de départ

Lignes de `PARAMETRE` livrées avec l'application. Les bornes des entiers sont entre parenthèses.

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
| Système | `maintenance_active` | entier (0 ou 1) | 0 | oui |

Modèles de messages : trois modèles (avis de loyer, relance impayé total, relance paiement partiel), objet et texte obligatoires, textes par défaut repris de la maquette. Messages d'erreur de bornes : RG-PAR-11.

---

## 16. Authentification

Écrans présents dans la maquette (à recréer) :

- **RG-AUT-01** – **Connexion** : identifiant (le login), mot de passe, lien « Mot de passe oublié ? », bouton « Se connecter » (état « Connexion… »). Messages d'information : « Votre session a été fermée. » et « Mot de passe modifié. Vous pouvez vous connecter. ». Un compte désactivé ne peut pas se connecter.
- **RG-AUT-02** – **Mot de passe oublié** : saisie de l'identifiant, bouton « Envoyer le lien ». Réponse identique que le compte existe ou non : « Si un compte correspond à cet identifiant, un lien de réinitialisation vient d'être envoyé. » Lien « Retour à la connexion ».
- **RG-AUT-03** – **Nouveau mot de passe** (depuis le lien reçu) : nouveau mot de passe + confirmation, mention « Minimum n caractères » (paramètre `mdp_min`, RG-PAR-10). Le lien est à usage unique et expire (durée à fixer, **à confirmer**).
- **RG-AUT-04** – **Modifier mon mot de passe** (menu utilisateur, bas du menu latéral) : mot de passe actuel, nouveau, confirmation. Champs obligatoires et surlignage selon RG-VAL-01. Visibilité du mot de passe par icône œil.
- **RG-AUT-05** – **Mot de passe temporaire** : après création d'un compte ou réinitialisation par un Admin, le compte est marqué « temporaire » ; à la connexion suivante l'utilisateur doit choisir un nouveau mot de passe avant tout autre écran.
- **RG-AUT-06** – **Inactivité** : déconnexion après `inactivite_min` minutes (0 = désactivée), puis écran de connexion avec « Votre session a été fermée. ».
- **RG-AUT-07** – Pied du menu : nom et profil de l'utilisateur, « Modifier le mot de passe », « Se déconnecter ».
- Jeton : JWT. Les mots de passe sont hachés (BCrypt). La longueur minimale vient du paramètre `mdp_min` (borne 6 à 32).

---

## 17. Utilisateurs (Configuration > Utilisateurs, droit `usr`)

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
- **RG-USR-11** – Toutes ces opérations sont écrites au journal d'audit (chapitre 19). Le hash du mot de passe n'y apparaît jamais en clair (valeur masquée).

---

## 18. Droits d'accès (Configuration > Droits d'accès, droit `dro`)

- **RG-DRO-10** – Les droits sont stockés par couple (profil, écran) : `voir` (v), `ajouter` (a), `modifier` (m), `supprimer` (d). Les cases a/m/d n'existent que si l'écran propose l'action (tableau ci-dessous). Un droit a/m/d suppose `voir`.
- **RG-DRO-11** – L'écran propose deux onglets pour tous, un troisième pour l'Admin :
  - **Accès aux écrans** : une grille profils × écrans, regroupée par section repliable (boutons « Tout déplier » / « Tout replier »), colonne Admin verrouillée ;
  - **Actions autorisées** : un profil à la fois (sélecteur de profil), une ligne par écran avec les quatre cases (Consulter, Ajouter, Modifier, Supprimer) et le libellé de l'action ; une case a/m/d est désactivée si l'accès à l'écran est retiré ;
  - **Accès selon l'appareil** (Admin seulement) : chapitre 23.
- **RG-DRO-12** – Les changements restent en **brouillon** : une pastille orange marque chaque case modifiée, un compteur « n modifications non enregistrées » s'affiche, boutons « Enregistrer » / « Annuler ». Message de succès : « Droits d'accès enregistrés avec succès ». Rien n'est appliqué avant l'enregistrement.
- **RG-DRO-13** – Chaque requête est vérifiée par le back sur le droit (profil, écran, action) lu dans la table des droits, et non sur un rôle figé.
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

- **RG-DRO-20** – **Suppressions** : la règle initiale (RG-ROL-02) réservait toute suppression définitive à l'Admin. Dans la maquette, le Gestionnaire reçoit par défaut les mêmes droits que l'Admin, suppressions comprises. Les conditions métier de suppression (RG-GAR-30, RG-LOCT-20, RG-LOC-30 à 33, RG-REM-07, RG-PAI-25) restent vérifiées par le back quel que soit le profil. **(à confirmer)** : garder ce défaut ou mettre `d = 0` pour le Gestionnaire.

---

## 19. Journal d'audit (Configuration > Journal d'audit, Admin seulement)

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

---

## 20. Maintenance (Configuration > Maintenance, Admin seulement)

- **RG-MNT-01** – Un interrupteur global met le site en maintenance. Confirmation « Mettre le site en maintenance ? » : « Les profils Gestionnaire, Locataire et Consultant seront déconnectés immédiatement et verront la page de maintenance. Les comptes et les données restent inchangés. Vous restez connecté en tant qu'Admin. »
- **RG-MNT-02** – En maintenance : seul l'Admin peut se connecter et utiliser l'application. Les autres profils reçoivent du back un refus dédié (HTTP 503, code `MAINTENANCE`) à la connexion et sur toute requête ; le front les redirige vers la page « Site en maintenance » (texte : « L'application est temporairement indisponible pendant une opération de maintenance. Vos données sont conservées et l'accès sera rétabli dès que possible. »). Les comptes ne sont pas désactivés ; leur statut ne change pas.
- **RG-MNT-03** – La page de maintenance propose « Réessayer » et vérifie périodiquement l'état du site (toutes les 2 s dans la maquette, à espacer en production, par exemple 15 à 30 s). Dès la réactivation, l'utilisateur retrouve l'accès.
- **RG-MNT-04** – L'écran affiche par profil le nombre de comptes actifs et l'état « Accès maintenu » (Admin) ou « Connexion bloquée » (autres). Bouton « Prévisualiser » : ouvre la page de maintenance sans activer le mode. Bouton « Réactiver le site ». Messages : « Site en maintenance : les profils Gestionnaire, Locataire et Consultant sont déconnectés » et « Site réactivé : les utilisateurs peuvent à nouveau se connecter ».
- **RG-MNT-05** – L'état de maintenance est persistant (table PARAMETRE, clé `maintenance_active`), partagé par toutes les sessions, et journalisé.

---

## 21. Chronologie (Locataires > Chronologie, droit `chr`)

- **RG-CHR-01** – Écran en deux zones. À gauche, la liste des locataires : recherche, bascule **Actifs** / **Tous** (avec compteurs), tri locataires actuels d'abord puis nom, ligne = initiales, nom, « Garage … · solde » (À jour / En retard / Ancien). À droite, la chronologie du locataire sélectionné.
- **RG-CHR-02** – En-tête du locataire : civilité, nom, badge de solde, garages loués, adresse. Trois indicateurs : **Locations** (nombre), **Total versé** (somme de ses versements), **Remarques ouvertes** (remarques « Problème » non résolues).
- **RG-CHR-03** – Événements du locataire, du plus récent au plus ancien : locations (début, fin), paiements (versements), remarques (création, résolution). Filtres **Tous / Locations / Remarques / Paiements** avec compteurs. Chaque événement : icône, titre, pastille, montant éventuel, date et heure, description (5 lignes, « voir plus » si tronquée). « Afficher plus (n) » par lots de 10. Sans événement : « Aucun événement. » Les événements futurs sont regroupés sous « À venir ».
- Le back expose un endpoint de chronologie par locataire (événements agrégés, paginés), pas un assemblage côté front.

---

## 22. Statistiques (Pilotage > Statistiques, droit `sta`)

Quatre pages, chacune avec un sélecteur d'**année**. Données calculées par le back.

- **RG-STA-01** – **Loyers encaissés** : somme des versements par mois de l'année, en euros.
- **RG-STA-02** – **Taux d'occupation** : garages loués en fin de mois, en %, par mois. Année en cours : le dernier point est la valeur du jour.
- **RG-STA-03** – **Répartition par statut** : camembert Loué / Libre / Indisponible à une date (« au jj/mm/aaaa », fin d'année ou date du jour pour l'année en cours), avec nombre et pourcentage, « n garages au total ».
- **RG-STA-04** – **Remarques par type** : remarques créées dans l'année par type (Information, Problème, Autre) et **taux de résolution des problèmes**. Sans remarque : « Aucune remarque créée cette année-là. » Sans problème : « Aucun problème signalé ».
- Le nombre de mois des graphiques du tableau de bord vient du paramètre `graph_mois` (RG-PAR-09).

---

## 23. Appareils (responsive et accès selon l'appareil)

- **RG-APP-01** – Trois modes d'affichage selon la largeur : **Ordinateur** (plus de 1024 px), **Tablette** (641 à 1024 px), **Smartphone** (640 px et moins). Le front est responsive : tableaux, menu latéral (tiroir sous 1024 px), fenêtres et formulaires s'adaptent. La maquette expose un sélecteur de mode d'affichage pour la démonstration ; il n'existe pas dans l'application finale (la largeur de fenêtre décide).
- **RG-APP-02** – L'Admin choisit, dans Droits d'accès > « Accès selon l'appareil », quels écrans sont disponibles sur Tablette et sur Smartphone (grille écrans × appareils, brouillon puis enregistrement, comme RG-DRO-12). Ordinateur : tout est accessible. L'écran Droits d'accès reste toujours accessible, pour ne pas se bloquer.
- **RG-APP-03** – Défaut : Tablette, tous les écrans ; Smartphone, tous les écrans sauf ceux de la section Configuration (hors Droits d'accès).
- **RG-APP-04** – Un écran non disponible sur l'appareil disparaît du menu. Un accès direct affiche : « Cet écran n'est pas disponible sur tablette (ou smartphone). Ce réglage se trouve dans « Droits d'accès », section « Accès selon l'appareil ». » Cette restriction relève de la présentation (le back ne détecte pas l'appareil) : le front l'applique à partir du réglage lu en base.
- L'information « droit insuffisant » reste distincte : « Le profil … n'a pas accès à cet écran. Ce droit se règle dans « Droits d'accès ». »

---

## 24. Écarts, décisions ouvertes et points à confirmer

### 24.1 Écarts avec le document de règles métier initial

À trancher avant l'implémentation technique.

| Sujet | Document initial | Maquette |
| --- | --- | --- |
| Paiement | Non partiel, un seul geste, statut à payer → payé | Paiement partiel et versements multiples ; statuts À payer / Partiel / Payé |
| Annulation de paiement | Annuler un paiement validé (retour à « à payer ») réservé à l'admin | Annulation par versement, droit paramétrable (Admin par défaut) |
| Génération des échéances | Manuelle : choix d'un mois, sélection des garages, une échéance par (location, mois) | Pas d'écran de génération : une ligne par garage loué pour le mois affiché |
| Rattachement des remarques | Toujours à un locataire, jamais à une location | À un garage ou à un locataire |
| Statut du garage | Champ `actif` (désactivation) | Statuts Libre / Loué / Indisponible ; Indisponible joue le rôle de désactivation |
| Maximum 20 garages | Contrôle applicatif | Non contrôlé |
| Clés totales | > 0 | ≥ 0 accepté |
| Durée minimale d'une location | 1 mois calendrier | Non contrôlée (seulement fin ≥ début et fin = dernier jour du mois) |
| Une seule location active par garage | Contrôle applicatif | Garantie à la création pour les garages Libres uniquement ; un garage ayant une location « À venir » reste Libre et peut recevoir une autre location |
| Gestion des utilisateurs | Comptes, login et e-mail uniques, dernier admin protégé | Présente dans la maquette récente : chapitre 17 |
| Suppression d'un garage | Seulement sans location ni échéance liée | Refusée si loué ou si historique de locations (les échéances dépendant des locations) |
| Suppression d'un loyer | Non précisée | Dernier loyer à venir uniquement, ouvert aux gestionnaires |
| Adresse du garage | Non prévue | Présente dans les données de démonstration et utilisée par la recherche, mais jamais affichée ni saisie ; les garages créés n'en ont pas |
| Historique des locations d'un garage | Statuts Active / Terminée | Une location « À venir » y apparaît comme « Terminée » (anomalie d'affichage de la maquette ; le statut attendu est « À venir ») |
| Date de début d'un nouveau loyer | Non précisée | Doit seulement être postérieure au début du précédent (peut être dans le passé) |
| Montant dû d'une échéance | Loyer en vigueur à la période, figé à la génération | Loyer courant du garage, non figé par période |
| Défaut de paiement | Échéance « à payer » dont la période est passée | Idem pour les mois passés ; pour le mois courant, certains impayés sont fixés dans les données de démonstration |

Les données (garages, locataires, paiements) de la maquette sont des données de démonstration : les règles ci-dessus décrivent le comportement attendu, pas les valeurs.

### 24.2 Décisions ouvertes

Défaut proposé entre parenthèses.

1. **Création des échéances** : le modèle indique une création manuelle par mois ; RG-PAI-01 et la maquette affichent une ligne par garage loué pour le mois choisi. (Défaut : l'écran Paiements calcule les lignes, l'échéance est créée au premier versement, `montant_du` = loyer en vigueur à la période, figé.)
2. **Maximum 20 garages** : non contrôlé dans la maquette. (Défaut : contrôler.)
3. **Adresse du garage** : colonne présente, jamais saisie. (Défaut : facultative, pas d'écran.)
4. **Historique des locations d'un garage** : une location « À venir » doit s'afficher « À venir » (la maquette affiche « Terminée »).
5. **Clés totales** : ≥ 0 (maquette) ou > 0 (règles initiales). (Défaut : ≥ 0.)
6. **Suppressions par le Gestionnaire** : la maquette lui donne par défaut les mêmes droits que l'Admin, suppressions comprises ; la règle initiale les réservait à l'Admin. (Défaut : suivre la maquette, droit réglable.)
7. **Tables ajoutées au modèle de données v2** (droits, journal d'audit, jeton de mot de passe, avis de loyer, relance, colonnes d'UTILISATEUR) : à valider. (Défaut : les retenir.)
8. **Durée de validité du lien « mot de passe oublié »** : non définie. (Défaut : 1 heure, usage unique.)
9. **État de maintenance** : ligne `PARAMETRE` de nature `systeme` ou singleton. (Défaut : ligne `PARAMETRE`.)
10. **Suppressions en cascade des nouvelles relations** : fiche locataire rattachée à un compte (refusée), avis de loyer (supprimés avec la location ou le loyer annoncé). (Défaut : comme indiqué, à confirmer.)

### 24.3 Points de vigilance

- RG-DAS-03 : « mois précédent et mois courant » est le comportement de la maquette ; le paramètre `jour_limite` (RG-PAR-08) change le moment où le mois courant passe en retard.
- Dates de référence de la maquette : 8 octobre 2026 pour les utilisateurs et le journal d'audit, 9 octobre 2026 pour le reste.
- Les règles marquées « (à confirmer) » sont déduites du code de la maquette et n'ont pas été validées par le métier.
- Les données (garages, locataires, paiements, utilisateurs, journal d'audit) de la maquette sont des données de démonstration : les règles décrivent le comportement attendu, pas les valeurs.
