# Règles de gestion fonctionnelles – Application « Gestion de garages »

Source : maquette `Gestion Garages.dc.html` (comportements réellement codés) rapprochée du document `Regles metiers - Gestion location de garages.md`.
Date de référence de la maquette : 8–9 octobre 2026 (date du jour simulée). Les écarts avec le document de règles métier initial sont listés au chapitre 13.

Convention : chaque règle porte un identifiant `RG-<domaine>-<n°>` pour la traçabilité (tests, backlog).

---

## 1. Périmètre et navigation

- **RG-NAV-01** – Cinq écrans : Tableau de bord, Garages, Locataires, Locations, Paiements.
- **RG-NAV-02** – Le menu latéral est repliable (icônes seules). La dernière page visitée est mémorisée côté navigateur.
- **RG-NAV-03** – Langues FR / EN, choix mémorisé côté navigateur.
- **RG-NAV-04** – Le changement de page réinitialise la recherche et ferme les fiches de remarques ou d'historique ouvertes.
- **RG-NAV-05** – Le rôle courant (Admin, Gestionnaire, Lecture seule) se choisit via un sélecteur en en-tête (simulation d'authentification). Le nom de l'utilisateur et son rôle s'affichent en bas du menu.

## 2. Règles communes aux listes

- **RG-LST-01** – Pagination à 10 lignes par page (garages, locataires, locations, paiements) ; 5 lignes pour les historiques (loyers, locations d'un garage) et pour la liste de choix du locataire ; 3 lignes pour les impayés du tableau de bord. Le compteur affiche « x–y sur n ».
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

## 3. Saisie, dates et validation

- **RG-VAL-01** – Les champs obligatoires sont marqués d'un astérisque rouge. À l'enregistrement, tous les champs obligatoires vides sont surlignés en rouge en une seule fois. Le surlignage disparaît dès que l'utilisateur saisit dans le champ.
- **RG-VAL-02** – Les autres erreurs (règle métier violée) s'affichent en rouge dans la fenêtre, sans fermeture, et l'enregistrement est refusé.
- **RG-VAL-03** – Toutes les dates se saisissent au format `jj/mm/aaaa` avec masque automatique ou via un calendrier. Une date n'est acceptée que si elle existe réellement (jour, mois, année valides). Sinon le champ reste vide.
- **RG-VAL-04** – Dans le calendrier, le jour du jour est mis en évidence et un bouton « Aujourd'hui » est disponible.
- **RG-VAL-05** – En rôle Lecture seule, toutes les fenêtres d'édition s'ouvrent en consultation : champs désactivés, bouton Enregistrer masqué, intitulé « Visualiser … ».
- **RG-VAL-06** – Les info-bulles des icônes d'action indiquent l'action ou la raison d'un blocage.

## 4. Rôles et droits

| Action | Lecture seule | Gestionnaire | Admin |
| --- | --- | --- | --- |
| Consulter garages, locataires, locations, paiements, remarques, historiques | Oui | Oui | Oui |
| Créer / modifier un garage | Non | Oui | Oui |
| Créer / modifier / supprimer un loyer (dernier loyer, selon RG-LOY) | Non | Oui | Oui |
| Créer / modifier un locataire | Non | Oui | Oui |
| Créer / modifier / clôturer une location | Non | Oui | Oui |
| Enregistrer un paiement (total ou partiel) | Non | Oui | Oui |
| Créer / modifier une remarque, la marquer résolue ou la rouvrir | Non | Oui | Oui |
| Annuler un versement | Non | Non | Oui |
| Supprimer un garage, un locataire, une location, une remarque | Non | Non | Oui (sous conditions) |

- **RG-ROL-01** – Pour un utilisateur Lecture seule, les boutons « Nouveau … », les boutons de paiement, « Nouvelle remarque » et les boutons résolu / rouvrir sont masqués. Les icônes « Modifier » deviennent « Visualiser ».
- **RG-ROL-02** – Toute suppression définitive est réservée à l'Admin. Le Gestionnaire ne peut que désactiver (statut Indisponible), clôturer (date de fin) ou, pour un loyer à venir, supprimer le dernier loyer (RG-LOY-07).
- **RG-ROL-03** – La gestion des comptes utilisateurs (création, désactivation, dernier admin) n'est pas présente dans la maquette. Voir chapitre 13.
- **RG-ROL-04** – Un compte peut porter un prénom et un nom, tous deux facultatifs (100 caractères au plus, espaces retirés, un texte vide est enregistré comme absent). Le menu affiche « Prénom Nom » quand ils existent, sinon le login. Les comptes existants et le premier administrateur n'en ont pas.

---

## 5. Garages

### 5.1 Données et statuts

- **RG-GAR-01** – Un garage possède : numéro (identifiant), nombre de clés, clés en réserve, statut.
- **RG-GAR-02** – Statuts possibles : **Libre**, **Loué**, **Indisponible**.
  - **Loué** est calculé : le garage a une location active dont la date de début est atteinte (≤ date du jour) et sans fin échue. Il ne peut jamais être choisi manuellement.
  - **Libre** et **Indisponible** se choisissent manuellement (Indisponible = travaux, désactivation).
  - Une location « À venir » ne rend pas encore le garage Loué.
  - Quand une location se termine ou est supprimée, le garage repasse Libre.
- **RG-GAR-03** – Tant que le garage est Loué, son statut est verrouillé dans le formulaire (liste désactivée).
- **RG-GAR-04** – Clés disponibles à remettre à un locataire = clés − réserve.
- **RG-GAR-05** – Le loyer affiché dans la liste est le loyer en vigueur à la date du jour (vide si aucun loyer en vigueur).

### 5.2 Création

- **RG-GAR-10** – Champs obligatoires : numéro, clés, réserve, loyer mensuel (€), début du loyer. Le statut initial est Libre ou Indisponible.
- **RG-GAR-11** – Le numéro est proposé automatiquement (`G` + plus grand numéro existant + 1, sur 2 chiffres). Il est mis en majuscules, nettoyé des espaces, et doit être **unique** : « Ce numéro de garage existe déjà. »
- **RG-GAR-12** – Clés ≥ 0. Réserve comprise entre 0 et le nombre de clés : « La réserve doit être comprise entre 0 et le nombre de clés. »
- **RG-GAR-13** – Le loyer saisi (> 0) et sa date de début créent le **premier enregistrement de l'historique des loyers** du garage.

### 5.3 Modification

- **RG-GAR-20** – Le numéro n'est pas modifiable. Le loyer ne se modifie pas ici : il se gère dans l'historique des loyers.
- **RG-GAR-21** – Mêmes contrôles sur clés et réserve qu'à la création.
- **RG-GAR-22** – Si une location active existe, clés − réserve doit rester ≥ au nombre de clés remises à cette location : « La location active a n clé(s) remise(s) : clés moins réserve doit rester supérieur ou égal. »

### 5.4 Suppression (Admin uniquement)

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
- **RG-LOY-09** – **Blocage par location démarrée** : le dernier loyer, s'il est déjà en vigueur (pas « À venir »), ne se modifie plus dès qu'une location de ce garage a démarré (début ≤ date du jour) et n'était pas terminée avant la date de début du loyer. Le bouton de modification est grisé, avec l'info-bulle « Une location a débuté depuis la date de début de ce loyer ». Un loyer « À venir » reste modifiable.
- **RG-LOY-10** – Un loyer doit exister à la date de début d'une location pour pouvoir créer ou modifier celle-ci (RG-LOC-10).
- **RG-LOY-11** – En rôle Lecture seule, le formulaire s'ouvre en consultation et aucun bouton « Nouveau loyer » n'est proposé.

---

## 7. Locataires

### 7.1 Données

- **RG-LOCT-01** – Champs : civilité (M. / Mme, facultatif), nom, prénom, rue, n°, code postal, localité, téléphone 1, téléphone 2 (facultatif), e-mail (facultatif).
- **RG-LOCT-02** – Obligatoires : nom, prénom, rue, n°, code postal, localité, téléphone 1.
- **RG-LOCT-03** – E-mail, s'il est renseigné, doit respecter le format `xxx@yyy.zz` : « Format d'e-mail invalide. »
- **RG-LOCT-04** – **Détection de doublon** sur nom + prénom (insensible à la casse, hors le locataire en cours d'édition). Alerte non bloquante « Un locataire avec le même nom et prénom existe déjà. Vous pouvez enregistrer quand même. » Le bouton devient « Enregistrer quand même » ; le second clic enregistre. Toute modification d'un champ réarme l'alerte.

### 7.2 Statut du locataire (calculé)

- **RG-LOCT-10** – Un locataire a un seul statut, déduit de ses locations à la date du jour (priorité dans cet ordre) :
  - **Actuel** : il a au moins un garage loué actuellement. Badge **À jour** ou **En retard** selon ses paiements (RG-PAI-30) ;
  - **À venir** : aucune location active, mais au moins une location à venir (même s'il en a eu d'autres avant). Badge « À venir » ;
  - **Ancien** : il a eu des locations, n'en a plus d'active et n'en a aucune à venir. Badge « Ancien », ligne atténuée ;
  - **Sans location** : jamais loué. Badge « Sans location ».
- **RG-LOCT-11** – Filtres : Actuels (par défaut), À venir, Anciens, Sans location, Tous. La colonne Garage liste les garages actuellement loués.
- **RG-LOCT-12** – Colonnes : locataire, remarques, garage, statut, actions. Toutes triables sauf les actions. L'adresse et le téléphone sont affichés sous le nom.

### 7.3 Suppression (Admin uniquement)

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
- **RG-LOC-11** – Choix du locataire par recherche (nom, prénom, insensible aux accents) dans la liste triée par nom, 5 par page. Chaque ligne indique son statut (Actuel, À venir, Ancien ou Sans location, RG-LOCT-10). Tout locataire, quel que soit son statut, peut être choisi : un locataire peut avoir plusieurs locations, sur des garages différents.
- **RG-LOC-12** – Seuls les garages au statut **Libre** sont proposés ; sinon « Aucun garage libre pour le moment. » (Un garage Indisponible ou Loué n'est jamais proposé.)
- **RG-LOC-13** – Contrôles à l'enregistrement, dans cet ordre :
  1. le garage doit être Libre : « Ce garage n'est pas libre. » ;
  2. un loyer doit exister pour ce garage à la date de début : « Aucun loyer n'est défini pour ce garage à cette date. » ;
  3. clés remises ≥ 0 ;
  4. clés remises ≤ clés − réserve du garage : « Maximum n clés remises (hors réserve). »
- **RG-LOC-14** – Les clés remises sont proposées par défaut à la valeur maximale (clés − réserve) et recalculées au changement de garage. Le formulaire affiche les clés disponibles, la réserve et le loyer à la date de début.
- **RG-LOC-15** – La location est créée sans date de fin. Elle est « Active » si le début est ≤ date du jour, sinon « À venir ». La liste bascule automatiquement sur le filtre correspondant.
- **RG-LOC-16** – Une date de début passée ou future est acceptée.
- **RG-LOC-17** – Deux locations d'un même garage ne se chevauchent pas, à la création comme à la modification (début, fin, fin effacée) : « Cette location chevauche une autre location du garage (du jj/mm/aaaa au jj/mm/aaaa). » (ou « à partir du jj/mm/aaaa » si elle n'a pas de fin). Une location sans date de fin couvre tout l'avenir ; la date de fin est exclue de la période, comme dans le calcul des statuts : une location peut commencer le jour où la précédente se termine.

### 8.3 Modification et clôture

- **RG-LOC-20** – Modifiables : date de début, clés remises et (location active seulement) date de fin. Locataire et garage sont figés.
- **RG-LOC-21** – Mêmes contrôles qu'en création sur : début obligatoire, loyer existant à la date de début, clés (0 à clés − réserve).
- **RG-LOC-22** – La date de fin est facultative et réservée aux locations actives (champ masqué pour une location à venir).
- **RG-LOC-23** – Quand elle est renseignée, la date de fin doit être **le dernier jour d'un mois** : « La date de fin doit être le dernier jour d'un mois. » et doit être ≥ date de début : « La date de fin doit être postérieure ou égale au début. »
- **RG-LOC-24** – **Date de fin future** : enregistrée, la location reste active jusque-là et la date s'affiche dans la liste.
- **RG-LOC-25** – **Date de fin passée ou du jour** : la location passe à « Terminée », le garage redevient Libre, le loyer et les clés sont conservés dans l'historique. Pour une location à venir, la modification du début déplace la location et ajuste le filtre affiché (À venir ou Actives).
- **RG-LOC-26** – Effacer la date de fin d'une location active la rend de nouveau sans échéance.
- **RG-LOC-27** – Une location terminée n'a plus d'action de modification dans la liste (consultation via les historiques).
- **RG-LOC-28** – Mois payés : le début d'une location ne peut pas suivre son premier mois ayant un versement (« La date de début ne peut pas suivre juin 2026 : un paiement est déjà enregistré pour ce mois. Annulez d'abord ce paiement dans l'écran Paiements. ») et sa fin ne peut pas précéder son dernier mois ayant un versement (« La date de fin ne peut pas précéder septembre 2026 : … »). Une échéance sans versement ne compte pas.

### 8.4 Suppression (Admin uniquement)

- **RG-LOC-30** – Seules les locations **Active** et **À venir** exposent l'action de suppression.
- **RG-LOC-31** – **À venir** : supprimable, avec confirmation « Oui / Non », sans autre condition que l'absence de paiement anticipé (RG-LOC-32).
- **RG-LOC-32** – **Active** (ou **À venir** avec un paiement anticipé) : refusée si au moins un paiement a déjà été effectué sur cette location : « n paiement(s) ont déjà été effectué(s) pour cette location. » Sinon la location est supprimée avec ses échéances sans versement et le garage repasse Libre.
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

- **RG-PAI-20** – Les boutons de paiement n'apparaissent que si la ligne n'est pas soldée et que l'utilisateur n'est pas en Lecture seule.
- **RG-PAI-21** – **Payer en totalité** : verse le reste dû en un geste. Champs obligatoires : mode de paiement (Virement ou Espèces) et date de paiement (par défaut la date du jour).
- **RG-PAI-22** – **Paiement partiel** : montant reçu obligatoire, > 0 et **strictement inférieur** au reste dû. Sinon : « Le montant doit être inférieur au reste dû (x €). Utilisez « Payer en totalité ». » Mode et date obligatoires.
- **RG-PAI-23** – Chaque paiement crée un **versement** (montant, mode, date). Plusieurs versements successifs peuvent solder une échéance. La date et le mode affichés dans la liste sont ceux du dernier versement.
- **RG-PAI-24** – Le détail des versements (accessible dès qu'un versement existe) affiche montant dû, reçu, reste dû, et la liste des versements avec date, mode (icône) et montant.
- **RG-PAI-25** – **Annulation** : un versement peut être annulé individuellement, par l'**Admin** uniquement. Le reste dû et le statut sont recalculés.

### 9.4 Retards

- **RG-PAI-30** – Un locataire est « En retard » s'il a au moins une échéance non soldée en retard (RG-PAI-12).
- **RG-PAI-31** – Une échéance partielle reste en retard pour son reste dû.

### 9.5 Indicateurs de l'écran

- **RG-PAI-40** – Attendu = somme des montants dus du mois. Encaissé = somme des versements, ventilée virement / espèces. En retard = somme des restes dus des lignes en retard.

---

## 10. Remarques

- **RG-REM-01** – Une remarque est rattachée soit à un **garage** (écran Garages, icône commentaire), soit à un **locataire** (écran Locataires). Elle n'est jamais rattachée à une location.
- **RG-REM-02** – Champs obligatoires : type (Information, Problème, Autre) et texte. Le texte est un éditeur riche : gras, italique, souligné, listes numérotées et à puces, liens. Un texte vide est refusé : le back nettoie le HTML (liste blanche de balises) et refuse un texte sans caractère visible.
- **RG-REM-03** – La date et l'heure de création sont ajoutées automatiquement à la création, non modifiables (mention affichée dans le formulaire).
- **RG-REM-04** – La notion de **résolu** n'existe que pour le type **Problème**.
  - Nouvelle remarque Problème : non résolue.
  - Type autre que Problème : aucune notion de résolution (valeur vide).
  - Passer une remarque d'un autre type à Problème l'initialise non résolue ; modifier une remarque Problème conserve son état.
- **RG-REM-05** – **Marquer résolu** (Problème uniquement, hors Lecture seule) : demande une **date de résolution** obligatoire, proposée à la date du jour. Affichage « Résolu le jj/mm/aaaa ». Cette date ne peut être ni future ni antérieure à la création de la remarque ; sur un problème déjà résolu, elle est remplacée.
- **RG-REM-06** – **Rouvrir** une remarque résolue efface l'état résolu et sa date. Changer le type d'un problème en un autre type efface aussi l'état résolu et sa date.
- **RG-REM-07** – Suppression d'une remarque : Admin uniquement.
- **RG-REM-08** – Tri du plus récent au plus ancien. Message « Aucune remarque. » si vide. Le nombre de remarques s'affiche en pastille sur l'icône de chaque garage et chaque locataire.
- **RG-REM-09** – Les Gestionnaires peuvent ajouter, modifier et résoudre. La Lecture seule consulte uniquement.

---

## 11. Tableau de bord

- **RG-DAS-01** – **Taux d'occupation** = garages loués / total des garages (arrondi, en %), avec « n garages loués sur N ».
- **RG-DAS-02** – **Loyers mensuels** = somme des loyers des garages actuellement loués.
- **RG-DAS-03** – **Impayés** = somme des restes dus des échéances en retard (RG-PAI-12 : toutes les échéances enregistrées non soldées d'un mois passé ; le mois courant n'est jamais en retard). La note distingue les impayés totaux (aucun versement) et partiels.
- **RG-DAS-04** – **Garages libres** = nombre de garages au statut Libre, avec le nombre d'indisponibles.
- **RG-DAS-05** – Deux graphiques sur 12 mois, avec navigation entre eux : loyers encaissés (euros) et taux d'occupation (%). Le dernier point correspond aux valeurs courantes. Les loyers encaissés d'un mois sont les versements des échéances de ce mois de loyer ; le taux d'occupation d'un mois passé est celui du dernier jour du mois (celui du jour pour le mois courant), sur le nombre actuel de garages.
- **RG-DAS-06** – Liste « Impayés à relancer » : locataire, garage, période, reste dû, badge **Total** (rouge) ou **Partiel** (orange, avec « Reçu x sur y » en info-bulle), paginée par 3.

---

## 12. Règles transversales

- **RG-TRA-01** – Jamais de statut de location stocké : il est toujours déduit des dates (RG-LOC-01 à 03). Le statut « Loué » d'un garage est de même déduit des locations.
- **RG-TRA-02** – Intégrité historique : un garage ayant eu des locations, un locataire ayant eu des locations ou des paiements, et une location terminée ne sont jamais supprimés.
- **RG-TRA-03** – Montants en euros, format français (séparateur de milliers, symbole € après le montant).
- **RG-TRA-04** – Les clés remises à une location sont toujours bornées par clés − réserve du garage, à la création, à la modification de la location et à la modification du garage.
- **RG-TRA-05** – Les périodes de loyer d'un même garage ne se chevauchent pas : la fin de l'ancienne = veille du début de la nouvelle.

---

## 13. Écarts avec le document de règles métier initial et points non couverts par la maquette

Tous ces points ont été tranchés pendant l'implémentation du back (voir les décisions datées sous le tableau).

| Sujet | Document initial | Maquette |
| --- | --- | --- |
| Paiement | Non partiel, un seul geste, statut à payer → payé | Paiement partiel et versements multiples ; statuts À payer / Partiel / Payé |
| Annulation de paiement | Annuler un paiement validé (retour à « à payer ») réservé à l'admin | Annulation par versement, admin uniquement |
| Génération des échéances | Manuelle : choix d'un mois, sélection des garages, une échéance par (location, mois) | Pas d'écran de génération : une ligne par garage loué pour le mois affiché |
| Rattachement des remarques | Toujours à un locataire, jamais à une location | À un garage ou à un locataire |
| Statut du garage | Champ `actif` (désactivation) | Statuts Libre / Loué / Indisponible ; Indisponible joue le rôle de désactivation |
| Maximum 20 garages | Contrôle applicatif | Non contrôlé |
| Clés totales | > 0 | ≥ 0 accepté |
| Durée minimale d'une location | 1 mois calendrier | Non contrôlée (seulement fin ≥ début et fin = dernier jour du mois) |
| Une seule location active par garage | Contrôle applicatif | Garantie à la création pour les garages Libres uniquement ; un garage ayant une location « À venir » reste Libre et peut recevoir une autre location |
| Gestion des utilisateurs | Comptes, login et e-mail uniques, dernier admin protégé | Absente (rôle simulé par un sélecteur) |
| Suppression d'un garage | Seulement sans location ni échéance liée | Refusée si loué ou si historique de locations (les échéances dépendant des locations) |
| Suppression d'un loyer | Non précisée | Dernier loyer à venir uniquement, ouvert aux gestionnaires |
| Adresse du garage | Non prévue | Présente dans les données de démonstration et utilisée par la recherche, mais jamais affichée ni saisie ; les garages créés n'en ont pas |
| Historique des locations d'un garage | Statuts Active / Terminée | Une location « À venir » y apparaît comme « Terminée » (anomalie d'affichage de la maquette ; le statut attendu est « À venir ») |
| Date de début d'un nouveau loyer | Non précisée | Doit seulement être postérieure au début du précédent (peut être dans le passé) |
| Montant dû d'une échéance | Loyer en vigueur à la période, figé à la génération | Loyer courant du garage, non figé par période |
| Défaut de paiement | Échéance « à payer » dont la période est passée | Idem pour les mois passés ; pour le mois courant, certains impayés sont fixés dans les données de démonstration |
| Statut d'un locataire | — | Trois statuts : Actuel, Ancien, Sans location (un locataire qui n'a qu'une location à venir n'est classé nulle part) |
| Locataire « en retard » (RG-PAI-30) | Au moins une échéance non soldée dont la période est passée | « Impayé signalé du mois courant » (indicateur non stocké) |

Décisions du 24/10/2026 (module 3.2) : un quatrième statut **À venir** pour un locataire qui n'a que des locations à venir (RG-LOCT-10 et 11) ; un locataire est en retard seulement pour une échéance non soldée dont le mois est **strictement avant le mois courant** : le mois courant n'est jamais en retard, car aucun « signalement » n'est stocké. Cette dernière règle s'applique à l'écran Paiements (3.4) et s'appliquera au tableau de bord (3.6).

Décisions du 25/10/2026 (module 3.3) : deux locations d'un même garage ne se chevauchent pas, même si la maquette l'autorise (RG-LOC-17) ; le loyer affiché d'une location est le loyer en vigueur à la date utile : aujourd'hui pour une location active, sa date de début pour une location à venir, sa date de fin pour une location terminée (RG-LOC-04) ; une location à venir qui a reçu un paiement anticipé n'est pas supprimable, la clé étrangère des échéances l'interdisant (RG-LOC-31 et 32) ; la fin et le début d'une location sont contrôlés par rapport aux mois déjà payés (RG-LOC-28).

Décisions du 25/10/2026 (module 3.4) : les échéances sont **créées automatiquement pour le mois courant** (tâche quotidienne et création d'une location), avec le loyer en vigueur pour montant dû figé, et au premier versement pour les autres mois (RG-PAI-03) ; les mois passés ne sont jamais rattrapés, donc une ligne de mois passé sans échéance enregistrée est « à payer » mais pas en retard (RG-PAI-12) ; une ligne existe pour chaque location dont la période touche le mois, début en cours de mois et fin comprises, sans prorata (RG-PAI-01) ; le dernier versement est celui de la date de paiement la plus récente (RG-PAI-23) ; annuler le dernier versement d'un mois futur supprime son échéance (RG-PAI-25).

Décisions du 25/10/2026 (module 3.5) : la date de résolution d'une remarque n'est ni future ni antérieure à sa création (RG-REM-05) ; le texte enrichi est nettoyé par le back avec une liste blanche de balises (jsoup) : `p`, `br`, `b`, `strong`, `i`, `em`, `u`, `ul`, `ol`, `li` et `a` avec `href` en http, https ou mailto seulement (RG-REM-02) ; quitter le type Problème efface l'état résolu (RG-REM-04).

Décisions du 25/10/2026 (module 3.6) : les impayés du tableau de bord sont toutes les échéances enregistrées en retard, pas seulement celles du mois précédent (RG-DAS-03) ; les loyers encaissés d'un mois sont rangés par mois de loyer, pas par date de paiement (RG-DAS-05) ; le taux d'occupation d'un mois passé se lit au dernier jour du mois, avec la règle RG-GAR-02, et celui du mois courant à la date du jour (RG-DAS-05).

Les données (garages, locataires, paiements) de la maquette sont des données de démonstration : les règles ci-dessus décrivent le comportement attendu, pas les valeurs.
