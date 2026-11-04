# Décisions du front v2

Branche `feature/v2-gestion-garages`. Les décisions validées par Gregory sont dans `CLAUDE.md` (« Décisions du projet »).
Ce document liste les choix faits pendant la réalisation des écrans, là où la maquette, les règles et le contrat d'API ne
tranchaient pas ou se contredisaient. **Tous sont à valider** lors de la validation complète de l'application ; une fois
validé, un choix passe dans `CLAUDE.md` ou est corrigé.

## Cadre et navigation

| Sujet | Sources | Choix retenu |
| --- | --- | --- |
| Ordre du menu | RG-NAV-01 : six sections ; maquette : groupes Garages et Locataires dépliables, Locations et Paiements à part | **Maquette** : menu dans l'ordre et avec les groupes de la maquette |
| « Contacter le support » | Bouton de la maquette avec une adresse de démonstration | Non repris |
| Choix de la langue | Maquette : FR / EN | Sélecteur gardé dans l'en-tête |
| Route interdite | RG-DRO : un écran sans droit `v` « redirige » | Retour à l'accueil (premier écran autorisé) |
| Écran retiré pour l'appareil | RG-APP-04 | Message de la maquette, avec le renvoi vers « Accès selon l'appareil » |

## Envoi de messages

| Sujet | Sources | Choix retenu |
| --- | --- | --- |
| Sélection des avis et relances | Maquette : toutes les lignes avec e-mail cochées d'office | **Maquette** : cochées d'office sur toutes les pages, on décoche ; « Tout sélectionner » porte sur toutes les pages |
| Lien du tableau de bord vers une relance | `?echeance=` | Seule la relance de cette échéance est cochée |
| Locataire sans e-mail (relances) | Maquette : icônes « Marquer comme relancé » et « Renseigner l'e-mail » | Les deux ; « Renseigner l'e-mail » ouvre Locataires avec la recherche sur son nom |
| Aperçu du message libre | API : `POST /api/messages/libre/apercu` ; maquette : pas de bouton | Bouton « Aperçu » ajouté (premier destinataire) |
| Après l'envoi d'un message libre | Maquette | Objet et message vidés, destinataires conservés |

## Configuration

| Sujet | Sources | Choix retenu |
| --- | --- | --- |
| Création d'un utilisateur | Handoff : deux étapes ; maquette : quatre (Identité, Connexion, Profil, Récapitulatif) | **Maquette** : quatre étapes ; une erreur du back ramène à l'étape du champ concerné |
| Compte Locataire | Contrat : `locataireId` obligatoire ; maquette : rien | Choix de la fiche locataire (liste de recherche des locations) à l'étape Profil |
| « Dernier administrateur actif » | RG-USR-09 ; l'API ne dit pas quels admins sont actifs | Icône grisée d'avance seulement s'il n'existe qu'un compte Admin ; sinon c'est le refus du back qui s'affiche dans la confirmation |
| Paramètres : changement de catégorie | Maquette | Les saisies non enregistrées sont abandonnées |
| Paramètres : contrôles | RG-PAR-11 | Seul « obligatoire » est contrôlé dans le front ; e-mail et bornes sont contrôlés par le back, dont les messages s'affichent sous les champs |
| Signature (modèles) | Maquette : variables remplacées dans l'affichage | Affichée avec ses variables (`{expediteur}`…) |
| Journal : troisième mode | Maquette : « Par wizard » | Intitulé « Par critères » |
| Journal : navigation | Maquette : compteur par utilisateur et par concept | Pas de compteurs (l'API ne les fournit pas) |
| Journal : liste | Maquette : deux champs modifiés résumés sous chaque entrée | Détail chargé à l'ouverture de l'entrée (l'API de liste ne renvoie pas les champs) |
| Maintenance : aperçu | Maquette : ouvre la page dans la même fenêtre | Nouvel onglet ; rappel de l'intervalle `maintenance_verif_sec` avec un lien vers Paramètres |

## Corrections faites en passant

- Un clic dans l'éditeur riche (fenêtre des remarques) activait le bouton Gras : le champ était dans un `<label>`. Corrigé par `FormField [group]`.
