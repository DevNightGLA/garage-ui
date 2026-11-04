(function () {
  const norm = s => String(s).replace(/\u00a0/g, ' ').replace(/’/g, "'").replace(/\s+/g, ' ').trim();
  const RAW = {
    'Langue': 'Language',
    'Trier par…': 'Sort by…',
    'Tablette': 'Tablet', 'Mode d\'affichage': 'Display mode',
    // navigation / generic
    'Tableau de bord': 'Dashboard', 'Statistiques': 'Statistics', 'Année': 'Year', 'Loyers par mois, en euros': 'Rents per month, in euros', 'Garages loués en fin de mois, en %': 'Garages rented at month end, in %', 'Année en cours': 'Current year', 'Remarques par type': 'Remarks by type', 'Taux de résolution des problèmes': 'Problem resolution rate', 'Aucune remarque créée cette année-là.': 'No remarks created that year.', 'Aucun problème signalé': 'No problem reported', 'Répartition par statut': 'Breakdown by status', 'Répartition des garages par statut': 'Garage breakdown by status', ' garages au total': ' garages in total', 'Taux d’occupation': 'Occupancy rate', 'Garages': 'Garages', 'Locataires': 'Tenants', 'Locations': 'Leases', 'Paiements': 'Payments',
    'Pages /': 'Pages /', 'Gestion de garages': 'Garage management', 'Afficher / masquer le menu': 'Show / hide menu',
    'Admin': 'Admin', 'Gestionnaire': 'Manager', 'Lecture seule': 'Read-only', 'Rechercher...': 'Search...',
    'Tous': 'All', 'Actives': 'Active', 'À venir': 'Upcoming', 'Terminées': 'Ended', 'Actuels': 'Current', 'Anciens': 'Former', 'Sans location': 'No lease',
    'Loué': 'Rented', 'Libre': 'Available', 'Indisponible': 'Unavailable', 'Active': 'Active', 'Terminée': 'Ended',
    'À payer': 'To pay', 'Payé': 'Paid', 'Partiel': 'Partial', 'Total': 'Total', 'En vigueur': 'In effect', 'Clôturé': 'Closed', 'Résolu': 'Resolved',
    'Information': 'Information', 'Problème': 'Issue', 'Autre': 'Other', 'Espèces': 'Cash', 'Virement': 'Transfer',
    'En retard': 'Overdue', 'Encaissé': 'Collected', 'Attendu': 'Expected', 'Impayés': 'Unpaid', 'Impayés à relancer (': 'Unpaid to follow up (',
    'Oui': 'Yes', 'Non': 'No', 'Fermer': 'Close', 'Annuler': 'Cancel', 'Enregistrer': 'Save', 'Enregistrer quand même': 'Save anyway', 'Supprimer': 'Delete', 'Choisir': 'Choose', 'Choisir une date': 'Pick a date', "Aujourd'hui": 'Today',
    'Annuler les tris (': 'Clear sorts (', 'Actions': 'Actions', 'Date': 'Date', 'Début': 'Start', 'Fin': 'End', 'État': 'Status', 'Statut': 'Status', 'Type': 'Type', 'Mode': 'Mode', 'Texte': 'Text',
    // garages
    'Garage': 'Garage', 'Clés': 'Keys', 'Réserve': 'Reserve', 'Loyer': 'Rent', 'Locataire': 'Tenant', 'Historique': 'History', 'Remarques': 'Remarks',
    'Nouveau garage': 'New garage', 'Modifier le garage': 'Edit garage', 'Visualiser le garage': 'View garage', 'Supprimer le garage': 'Delete garage',
    'Numéro': 'Number', 'Clés / réserve': 'Keys / reserve', 'Loyer mensuel': 'Monthly rent', 'Loyer mensuel (€)': 'Monthly rent (€)', 'Début du loyer': 'Rent start', 'Loyer actuel': 'Current rent', 'Locataire actuel': 'Current tenant',
    'Garage libre': 'Available garage', 'Aucun garage libre pour le moment.': 'No available garage at the moment.',
    'Filtrer par numéro, locataire ou statut': 'Filter by number, tenant or status', 'Filtrer par locataire ou garage': 'Filter by tenant or garage', 'Filtrer par locataire, adresse ou téléphone': 'Filter by tenant, address or phone',
    'Historique des loyers et des locations': 'Rent and lease history', 'Historique des loyers ·': 'Rent history ·', 'Historique des locations ·': 'Lease history ·', 'Historique des loyers': 'Rent history', 'Historique des locations': 'Lease history',
    'Ce garage n\'a jamais été loué.': 'This garage has never been rented.', 'Nouveau loyer': 'New rent', 'Modifier le dernier loyer': 'Edit latest rent', 'Visualiser le loyer': 'View rent', 'Supprimer le loyer': 'Delete rent',
    'Montant': 'Amount', 'Montant (€)': 'Amount (€)', 'Date de début': 'Start date', 'Date début': 'Start date', 'Date fin': 'End date', 'Date de fin': 'End date', 'N°': 'No.',
    'Seul le dernier loyer est modifiable. Un loyer ne peut être supprimé que si sa date de début est dans un mois futur. Modification et suppression sont bloquées si un paiement est déjà effectué sur la période. Un nouveau loyer clôture automatiquement le précédent (fin = veille du début).': 'Only the latest rent can be edited. A rent can only be deleted if its start date is in a future month. Editing and deletion are blocked if a payment has already been made for the period. A new rent automatically closes the previous one (end = day before start).',
    'Fin entre le': 'Ends between', 'et le': 'and', 'Effacer les dates': 'Clear dates',
    'Se déconnecter': 'Log out', 'Vous êtes déconnecté': 'You are logged out', 'Votre session a été fermée.': 'Your session has been closed.', 'Se reconnecter': 'Log back in',
    'Se déconnecter ?': 'Log out?', 'Votre session sera fermée.': 'Your session will be closed.', 'Connexion': 'Sign in', 'Identifiant': 'Username', 'Mot de passe': 'Password', 'Se connecter': 'Sign in',
    'Modifier mon mot de passe': 'Change my password', 'Mot de passe actuel': 'Current password', 'Nouveau mot de passe': 'New password', 'Confirmer le nouveau mot de passe': 'Confirm new password',
    'Mot de passe oublié ?': 'Forgot password?', 'Mot de passe oublié': 'Forgot password', 'Saisissez votre identifiant pour recevoir un lien de réinitialisation.': 'Enter your username to receive a reset link.', 'Envoyer le lien': 'Send link', 'Retour à la connexion': 'Back to sign in', 'Vérifiez votre messagerie': 'Check your inbox', 'Si un compte correspond à cet identifiant, un lien de réinitialisation vient d\'être envoyé.': 'If an account matches this username, a reset link has just been sent.', 'Ouvrir le lien reçu': 'Open the received link', 'Choisissez un nouveau mot de passe.': 'Choose a new password.', 'Mot de passe modifié. Vous pouvez vous connecter.': 'Password changed. You can now sign in.',
    'Seul le dernier loyer est modifiable.': 'Only the latest rent can be edited.', 'Un loyer ne peut être supprimé que si sa date de début est dans un mois futur.': 'A rent can only be deleted if its start date is in a future month.', 'Modification et suppression sont bloquées si un paiement est déjà effectué sur la période.': 'Editing and deletion are blocked if a payment has already been made for the period.', 'Un nouveau loyer clôture automatiquement le précédent (fin = veille du début).': 'A new rent automatically closes the previous one (end = day before start).',
    'Ce garage ne peut pas être supprimé :': 'This garage cannot be deleted:', 'Ce locataire ne peut pas être supprimé :': 'This tenant cannot be deleted:', 'ne peut pas être supprimée :': 'cannot be deleted:', 'sera supprimée définitivement.': 'will be permanently deleted.',
    'Ce garage n’est rattaché à aucune location. Cette action est définitive.': 'This garage is not linked to any lease. This action is final.',
    'Cette action est définitive : le locataire et ses remarques seront supprimés.': 'This action is final: the tenant and their remarks will be deleted.',
    'Suppression impossible': 'Deletion not possible', 'Supprimer la location ?': 'Delete the lease?', 'Supprimer la location': 'Delete lease',
    'Un paiement anticipé existe déjà': 'An advance payment already exists', 'Modification impossible : une location est en cours depuis la date de début de ce loyer': 'Editing not possible: a lease has been running since the start date of this rent', 'Modification impossible : une location a eu lieu depuis la date de début de ce loyer': 'Editing not possible: a lease took place since the start date of this rent',
    'Aucun loyer n\'est défini pour ce garage à cette date.': 'No rent is defined for this garage on this date.', 'Ce garage n\'est pas libre.': 'This garage is not available.', 'Ce numéro de garage existe déjà.': 'This garage number already exists.',
    'Le nombre de clés doit être positif.': 'The number of keys must be positive.', 'Le nombre de clés remises doit être positif.': 'The number of keys issued must be positive.', 'La réserve doit être comprise entre 0 et le nombre de clés.': 'The reserve must be between 0 and the number of keys.',
    'Le montant du loyer se gère dans l\'historique des loyers du garage.': 'The rent amount is managed in the garage rent history.', 'Le loyer saisi crée le premier enregistrement de l\'historique des loyers du garage.': 'The rent entered creates the first record in the garage rent history.',
    'La date de fin doit être le dernier jour d\'un mois.': 'The end date must be the last day of a month.', 'La date de fin doit être postérieure ou égale au début.': 'The end date must be on or after the start date.',
    'Des paiements ont été effectués pour ce locataire.': 'Payments have been made for this tenant.', 'Format d\'e-mail invalide.': 'Invalid e-mail format.', 'Une location terminée ne peut pas être supprimée : elle fait partie de l\'historique du garage.': 'An ended lease cannot be deleted: it is part of the garage history.',
    'Un locataire avec le même nom et prénom existe déjà. Vous pouvez enregistrer quand même.': 'A tenant with the same name and first name already exists. You can still save.',
    // tenants
    'Nouveau locataire': 'New tenant', 'Modifier le locataire': 'Edit tenant', 'Visualiser le locataire': 'View tenant', 'Supprimer le locataire': 'Delete tenant', 'Civilité': 'Title', 'M.': 'Mr', 'Mme': 'Mrs', 'Nom': 'Last name', 'Prénom': 'First name', 'Rue': 'Street', 'Code postal': 'Postal code', 'Localité': 'City', 'Téléphone 1': 'Phone 1', 'Téléphone 2': 'Phone 2', 'E-mail': 'E-mail', 'Adresse': 'Address',
    'Retour aux garages': 'Back to garages', 'Retour aux locataires': 'Back to tenants',
    // remarks
    'Nouvelle remarque': 'New remark', 'Modifier la remarque': 'Edit remark', 'Visualiser la remarque': 'View remark', 'Aucune remarque.': 'No remarks.', 'Saisir la remarque…': 'Enter the remark…', 'Marquer résolu': 'Mark as resolved', 'Disponible à la location': 'Available for rent', 'Relances d’impayés': 'Overdue reminders', 'À relancer': 'To remind', 'Relancés': 'Reminded', 'Modèle · Impayé total': 'Template · Fully unpaid', 'Modèle · Paiement partiel': 'Template · Partial payment', 'Marquer comme relancé': 'Mark as reminded', 'Marquer comme relancé (téléphone, courrier, oral)': 'Mark as reminded (phone, mail, in person)', 'Envoyer un e-mail de relance': 'Send a reminder e-mail', 'Aucun impayé à relancer.': 'No overdue payments to remind.', 'Aucune relance effectuée.': 'No reminders sent yet.', 'Période': 'Period', 'Impayé': 'Overdue', 'Mois du loyer concerné': 'Month of the rent', 'Montant dû pour le mois': 'Amount due for the month', 'Montant déjà reçu': 'Amount already received', 'Relance enregistrée avec succès': 'Reminder saved successfully', 'Aucun versement': 'No payment received', 'Envoyer 1 relance d’impayé ?': 'Send 1 overdue reminder?', 'Variables disponibles': 'Available variables', 'Cliquer pour insérer à l’emplacement du curseur.': 'Click to insert at the cursor.', 'Expéditeur': 'Sender', 'Civilité (M. / Mme)': 'Title (Mr / Ms)', 'Nom du locataire': 'Tenant last name', 'Prénom du locataire': 'Tenant first name', 'Numéro du garage': 'Garage number', 'Date d’effet du nouveau loyer': 'Effective date of the new rent', 'Nom de l’expéditeur': 'Sender name', 'en date du': 'on', 'Verrouillé : le garage est loué.': 'Locked: the garage is rented.',  'Rouvrir': 'Reopen', 'Date de résolution': 'Resolution date',
    'La date de création est ajoutée automatiquement et n\'est pas modifiable.': 'The creation date is added automatically and cannot be edited.',
    'Visible par le locataire': 'Visible to the tenant', 'Non visible par le locataire': 'Not visible to the tenant', 'Affichée automatiquement : la remarque est résolue.': 'Shown automatically: the remark is resolved.',
    // leases
    'Nouvelle location': 'New lease', 'Modifier la location': 'Edit lease', 'Visualiser la location': 'View lease', 'Clés remises': 'Keys issued', 'Aucun locataire trouvé.': 'No tenant found.', 'Rechercher un locataire (nom, prénom)…': 'Search for a tenant (last name, first name)…',
    'La location est créée avec le statut « Active » et sans date de fin.': 'The lease is created with the status “Active” and no end date.',
    'Une date de fin passée ou du jour termine la location : elle passe à « Terminée » et le garage redevient libre. Une date de fin future est enregistrée et la location reste active jusque-là. La date de fin doit être le dernier jour d\'un mois.': 'An end date in the past or today ends the lease: it becomes “Ended” and the garage becomes available again. A future end date is saved and the lease stays active until then. The end date must be the last day of a month.',
    'Une date de fin passée ou du jour termine la location : elle passe à « Terminée » et le garage redevient libre.': 'An end date in the past or today ends the lease: it becomes “Ended” and the garage becomes available again.', 'Une date de fin future est enregistrée et la location reste active jusque-là.': 'A future end date is saved and the lease stays active until then.', 'La date de fin doit être le dernier jour d\'un mois.': 'The end date must be the last day of a month.',
    'La location de': 'The lease of', 'sur le garage': 'on garage',
    // payments
    'Payé le': 'Paid on', 'Mode de paiement': 'Payment method', 'Montant dû': 'Amount due', 'Reçu': 'Received', 'Reste dû': 'Remaining due', 'Montant reçu (€)': 'Amount received (€)',
    'Paiement partiel': 'Partial payment', 'Payer en totalité': 'Pay in full', 'Détail des versements': 'Payment details', 'Annuler ce versement': 'Cancel this payment',
    'Dû': 'Due',
    // dashboard
    'Taux d\'occupation': 'Occupancy rate', 'Loyers mensuels': 'Monthly rents', 'Locations actives': 'Active leases', 'Garages libres': 'Available garages', 'Loyers encaissés': 'Rents collected',
    '12 derniers mois, en euros': 'Last 12 months, in euros', 'Garages loués, 12 derniers mois, en %': 'Rented garages, last 12 months, in %', 'Garages loués': 'Rented garages',
    'Graphique précédent': 'Previous chart', 'Graphique suivant': 'Next chart',
    'Fuite au plafond près de la porte, à signaler au syndic.': 'Ceiling leak near the door, to report to the building manager.', 'Paie en espèces en début de mois.': 'Pays in cash at the beginning of the month.', 'Peinture au sol à refaire à la prochaine vacance.': 'Floor paint to redo at the next vacancy.', 'Porte du garage G02 difficile à fermer, intervention demandée.': 'Door of garage G02 hard to close, repair requested.', 'Souhaite un second garage si disponible.': 'Would like a second garage if available.', 'Télécommande de porte remplacée.': 'Door remote control replaced.', 'Véhicule garé devant l’entrée voisine.': 'Vehicle parked in front of the neighbouring entrance.',
    // small words in split text nodes
    'sur': 'of', 'garages': 'garages', 'locataires': 'tenants', 'locations': 'leases', 'loyers': 'rents', 'paiements': 'payments', 'impayés': 'unpaid', 'À jour': 'Up to date',
    'jj/mm/aaaa': 'dd/mm/yyyy',
    // rent change notices
    'Envoi de messages': 'Send messages', 'Locataires actuels dont le loyer change à une date future. Chaque envoi ajoute une remarque « Information » à la fiche du locataire, avec le contenu de l’e-mail.': 'Current tenants whose rent changes on a future date. Each send adds an “Information” remark to the tenant record, with the e-mail text.',
    'À envoyer': 'To send', 'Envoyés': 'Sent', 'Envoyé': 'Sent', 'Sans e-mail': 'No e-mail', 'Modèle du message': 'Message template', 'Tout sélectionner': 'Select all', 'À partir du': 'From',
    'Aperçu de l’e-mail': 'E-mail preview', 'E-mail envoyé': 'E-mail sent', 'Renseigner l’e-mail du locataire': 'Enter the tenant’s e-mail', 'Aucun e-mail enregistré : renseignez-le dans la fiche du locataire.': 'No e-mail on record: enter it in the tenant record.',
    'Aucun avis à envoyer.': 'No notices to send.', 'Aucun avis envoyé.': 'No notices sent.', 'À :': 'To:', 'Objet :': 'Subject:', 'Objet': 'Subject', 'Message': 'Message', 'Variables disponibles :': 'Available variables:',
    'Un e-mail sera envoyé à chaque locataire sélectionné. Une remarque « Information » reprenant son contenu sera ajoutée à la fiche du locataire.': 'An e-mail will be sent to each selected tenant. An “Information” remark with its content will be added to the tenant record.',
    'Envoyer les avis': 'Send notices', 'Envoyer': 'Send', 'Aucun avis de loyer à envoyer.': 'No rent notices to send.', 'Avis de loyer à envoyer (': 'Rent notices to send (', 'avis': 'notices', 'Voir tout': 'View all',
    'Avis de loyer': 'Rent notice', 'Message libre': 'Free message', 'Paramètres': 'Settings', 'Modèles de messages': 'Message templates', 'Expéditeur': 'Sender', 'Nom de l’expéditeur': 'Sender name', 'Adresse e-mail d’envoi': 'Sending e-mail address', 'Adresse de réponse': 'Reply-to address', 'Remplace la variable {expediteur} dans les messages et s’affiche comme nom d’envoi.': 'Replaces the {expediteur} variable in messages and is shown as the sender name.', 'Adresse depuis laquelle les e-mails sont envoyés aux locataires.': 'Address the e-mails to tenants are sent from.', 'Facultatif. Reçoit les réponses des locataires ; à défaut, l’adresse d’envoi.': 'Optional. Receives tenants’ replies; defaults to the sending address.', 'Identité utilisée pour l’envoi des e-mails aux locataires.': 'Identity used when sending e-mails to tenants.', 'Paramètres enregistrés avec succès': 'Settings saved successfully', 'Format d’e-mail invalide : ': 'Invalid e-mail format: ', 'De :': 'From:', 'Configuration': 'Configuration', 'Formule de politesse et signature': 'Closing and signature', 'Reprises automatiquement en bas de chaque message envoyé. Ne pas les répéter dans les modèles.': 'Added automatically at the bottom of every message sent. Do not repeat them in the templates.', 'Signature enregistrée avec succès': 'Signature saved successfully', 'Paramètres métier': 'Business settings', 'Paramètres de l’application': 'Application settings', 'Règles de gestion et données de l’activité.': 'Business rules and activity data.', 'Messagerie, affichage et sécurité de l’application.': 'Messaging, display and security of the application.', 'Copie cachée (Cci)': 'Blind copy (Bcc)', 'Facultatif. Reçoit une copie de chaque e-mail envoyé.': 'Optional. Receives a copy of every e-mail sent.', 'Cci :': 'Bcc:', 'Organisation': 'Organisation', 'Coordonnées du bailleur, disponibles comme variables dans les messages.': 'Landlord details, available as variables in messages.', 'Nom de l’entreprise ou du bailleur': 'Company or landlord name', 'Facultatif. Variable {entreprise} des messages.': 'Optional. {entreprise} variable in messages.', 'Adresse postale et téléphone': 'Postal address and phone', 'Adresse postale et téléphone (adresse · téléphone)': 'Postal address and phone (address · phone)', 'Adresse postale': 'Postal address', 'Facultatif. Incluse dans la variable {coordonnees} des messages.': 'Optional. Included in the {coordonnees} variable in messages.', 'Facultatif. Inclus dans la variable {coordonnees} des messages.': 'Optional. Included in the {coordonnees} variable in messages.', 'Facultatif. Variable {coordonnees} des messages.': 'Optional. {coordonnees} variable in messages.', 'Numéro de compte (IBAN)': 'Bank account (IBAN)', 'Facultatif. Variable {iban} des messages, utile pour les relances.': 'Optional. {iban} variable in messages, useful for payment reminders.', 'Garages, loyers et locations': 'Garages, rents and leases', 'Formats et contrôles appliqués à la saisie des garages et des locations.': 'Formats and checks applied when entering garages and leases.', 'Préfixe du numéro de garage': 'Garage number prefix', 'Proposé à la création d’un garage (ex. G05).': 'Suggested when creating a garage (e.g. G05).', 'Nombre de chiffres du numéro de garage': 'Digits in garage number', 'Complété par des zéros (2 : G05).': 'Padded with zeros (2: G05).', 'Durée minimale d’une location': 'Minimum lease duration', 'En mois calendaires. Contrôlée à la saisie de la date de fin.': 'In calendar months. Checked when the end date is entered.', 'Paiements et impayés': 'Payments and unpaid rent', 'Règle de calcul des retards de paiement.': 'How payment delays are calculated.', 'Jour limite de paiement dans le mois': 'Payment deadline day in the month', 'Après ce jour, l’échéance du mois en cours passe « En retard ». 31 : en retard seulement le mois suivant.': 'After this day, the current month’s instalment becomes “Overdue”. 31: overdue only from the following month.', 'Affichage': 'Display', 'Présentation des listes, du menu et de la langue.': 'Lists, menu and language.', 'Lignes par page (listes)': 'Rows per page (lists)', 'Garages, locataires, locations, paiements et messages.': 'Garages, tenants, leases, payments and messages.', 'Lignes par page (historiques et cartes)': 'Rows per page (histories and cards)', 'Historiques, cartes du tableau de bord et choix du locataire.': 'Histories, dashboard cards and tenant picker.', 'Nombre de mois des graphiques': 'Months shown in charts', 'Tableau de bord et statistiques.': 'Dashboard and statistics.', 'Langue par défaut': 'Default language', 'Appliquée tant que l’utilisateur n’a pas choisi sa langue.': 'Used until the user picks a language.', 'Français': 'Français', 'English': 'English', 'Menu latéral replié par défaut': 'Side menu collapsed by default', 'À l’ouverture de l’application.': 'When the application opens.', 'Sécurité': 'Security', 'Connexion et mots de passe.': 'Sign-in and passwords.', 'Déconnexion après inactivité': 'Sign out after inactivity', 'En minutes. 0 : désactivée.': 'In minutes. 0: disabled.', 'Longueur minimale du mot de passe': 'Minimum password length', 'En caractères, au changement du mot de passe.': 'In characters, when changing the password.', 'Minimum ': 'Minimum ', ' caractères.': ' characters.', 'La durée minimale d’une location est de ': 'The minimum lease duration is ', 'Objet et texte des e-mails envoyés depuis « Envoi de messages ».': 'Subject and text of the e-mails sent from “Messaging”.', 'Relance · Impayé total': 'Reminder · Full unpaid', 'Relance · Paiement partiel': 'Reminder · Partial payment', 'Modèle · Avis de loyer': 'Template · Rent notice', 'Modifier': 'Edit', 'Destinataires': 'Recipients', 'Un locataire': 'One tenant', 'Choisir un locataire': 'Choose a tenant', 'Message envoyé par e-mail à un locataire ou à tous les locataires actuels. Chaque envoi ajoute une remarque « Information » à la fiche du locataire, avec le contenu de l’e-mail.': 'E-mail message sent to one tenant or to all current tenants. Each send adds an “Information” remark to the tenant record, with the e-mail text.',
    'À contacter': 'To contact', 'Informé': 'Informed', 'À traiter': 'To process', 'Traités': 'Processed', 'Aucun avis à traiter.': 'No notices to process.', 'Aucun avis traité.': 'No notices processed.', 'Marquer comme informé': 'Mark as informed', 'Moyen de contact': 'Contact method', 'Date du contact': 'Contact date', 'Courrier postal': 'Postal mail', 'Téléphone': 'Phone', 'Oralement': 'Verbally', 'Voir plus': 'Show more', 'Voir moins': 'Show less', 'Traiter les avis': 'Process notices', 'Avis de loyer à communiquer (': 'Rent notices to communicate (', 'Aucun avis de loyer à communiquer.': 'No rent notices to communicate.', 'Avis communiqué avec succès': 'Notice communicated successfully',
    'Ce locataire n’a pas d’e-mail : informez-le par téléphone, par courrier postal ou oralement, puis enregistrez le contact. Une remarque sera ajoutée à sa fiche.': 'This tenant has no e-mail: inform them by phone, postal mail or verbally, then record the contact. A remark will be added to their record.',
    'Locataires actuels dont le loyer change à une date future. Envoyez l’avis par e-mail ; pour ceux qui n’ont pas d’e-mail, contactez-les par téléphone ou courrier. Chaque avis traité ajoute une remarque « Information » à la fiche du locataire.': 'Current tenants whose rent changes on a future date. Send the notice by e-mail; for those without e-mail, contact them by phone or mail. Each processed notice adds an “Information” remark to the tenant record.',
    'Locataires actuels dont le loyer change à une date future. Chaque envoi ajoute une remarque « Information » à la fiche du locataire, avec le contenu de l’e-mail. Les locataires sans e-mail sont à informer par téléphone, par courrier ou oralement depuis le tableau de bord.': 'Current tenants whose rent changes on a future date. Each send adds an “Information” remark to the tenant record, with the e-mail text. Tenants without e-mail are to be informed by phone, mail or verbally from the dashboard.',
    'Saisir le message…': 'Enter the message…',
    'Préparer l’envoi de l’e-mail': 'Prepare the e-mail',
    'Envoyer l’e-mail': 'Send e-mail', 'Marquer informé': 'Mark informed', 'par e-mail': 'by e-mail',
    'Cochez au moins un locataire': 'Tick at least one tenant', 'Date d’effet': 'Effective date', 'Aucun e-mail': 'No e-mail',
    'Modèle du message enregistré avec succès': 'Message template saved successfully',
    'Actifs': 'Active', 'Précédent': 'Previous', 'Suivant': 'Next', 'Résumé': 'Summary', 'Détails': 'Details', 'Loyer à la date de début': 'Rent at start date', 'Aucun loyer': 'No rent', 'Liste des garages': 'Garage list', 'Liste des locataires': 'Tenant list', 'Garages /': 'Garages /', 'Sans adresse': 'No address', 'Locataire actuel': 'Current tenant', 'Clés / réserve': 'Keys / reserve', 'Chronologie': 'Timeline', 'Locataires /': 'Tenants /', 'Rechercher un locataire…': 'Search for a tenant…', 'Total versé': 'Total paid', 'Remarques ouvertes': 'Open remarks', 'Aucun événement.': 'No events.', 'Début de location': 'Lease start', 'Location à venir': 'Upcoming lease', 'Remarque créée': 'Remark created', 'Remarque résolue': 'Remark resolved', 'Paiement du loyer': 'Rent payment', 'Fin de location prévue': 'Planned lease end',
    // months
    'Janvier': 'January', 'Février': 'February', 'Mars': 'March', 'Avril': 'April', 'Mai': 'May', 'Juin': 'June', 'Juillet': 'July', 'Août': 'August', 'Septembre': 'September', 'Octobre': 'October', 'Novembre': 'November', 'Décembre': 'December',
    'janvier': 'January', 'février': 'February', 'mars': 'March', 'avril': 'April', 'mai': 'May', 'juin': 'June', 'juillet': 'July', 'août': 'August', 'septembre': 'September', 'octobre': 'October', 'novembre': 'November', 'décembre': 'December',
    'Jan': 'Jan', 'Fév': 'Feb', 'Mar': 'Mar', 'Avr': 'Apr', 'Juil': 'Jul', 'Sep': 'Sep', 'Oct': 'Oct', 'Nov': 'Nov', 'Déc': 'Dec',
    'Janv.': 'Jan.', 'Févr.': 'Feb.', 'Avri.': 'Apr.', 'Juil.': 'Jul.', 'Sept.': 'Sep.', 'Octo.': 'Oct.', 'Nove.': 'Nov.', 'Déce.': 'Dec.'
  };
  const D = {};
  Object.keys(RAW).forEach(k => { D[norm(k)] = RAW[k]; });
  const MONTHS = { janvier: 'January', février: 'February', mars: 'March', avril: 'April', mai: 'May', juin: 'June', juillet: 'July', août: 'August', septembre: 'September', octobre: 'October', novembre: 'November', décembre: 'December' };
  const WD = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const P = [
    [/^Envoyer \((\d+)\)$/, 'Send ($1)'],
    [/^à contacter : (.+)$/, 'to contact: $1'],
    [/^par (téléphone|courrier)$/, (m, k) => 'by ' + (k === 'courrier' ? 'mail' : 'phone')], [/^Aucun e-mail$/, 'No e-mail'],
    [/^Tous les locataires actuels \((\d+)\)$/, 'All current tenants ($1)'], [/^(.+) \(ancien\)$/, '$1 (former)'], [/^Envoyer le message à (\d+) locataires? \?$/, 'Send the message to $1 tenant(s)?'], [/^(\d+) messages? envoyés? avec succès$/, '$1 message(s) sent successfully'], [/^(\d+) locataires? sans e-mail ne (?:recevront|recevra) pas le message\.$/, '$1 tenant(s) without e-mail will not receive the message.'],
    [/^Envoyé le (.+)\. Une remarque a été ajoutée à la fiche du locataire\.$/, 'Sent on $1. A remark was added to the tenant record.'],
    [/^Envoyer (\d+) avis de changement de loyer \?$/, 'Send $1 rent change notice(s)?'],
    [/^(\d+) avis envoyés? avec succès$/, '$1 notice(s) sent successfully'],
    [/^Envoi des e-mails : échec\. Veuillez réessayer\.$/, 'E-mail sending failed. Please try again.'],
    [/^le (\d{2}\/\d{2}\/\d{4})$/, 'on $1'], [/^dès le (.+)$/, 'from $1'], [/^(\d+) autres? avis$/, '$1 more notice(s)'],
    [/^(\d+) garages loués sur (\d+)$/, '$1 garages rented of $2'],
    [/^(\d+) impayés totaux · (\d+) partiels$/, '$1 total unpaid · $2 partial'],
    [/^(\d+) indisponible$/, '$1 unavailable'],
    [/^Remarques \((\d+)\)$/, 'Remarks ($1)'],
    [/^Reçu (.+) sur (.+)$/, 'Received $1 of $2'],
    [/^Reste dû : (.+)$/, 'Remaining due: $1'], [/^Montant : (.+)$/, 'Amount: $1'],
    [/^(\d+)–(\d+) sur (\d+) locataires$/, '$1–$2 of $3 tenants'],
    [/^Clés disponibles : (\d+) \(réserve : (\d+)\) · Loyer à la date de début : (.*?)\/mois$/, 'Keys available: $1 (reserve: $2) · Rent at start date: $3/month'],
    [/^Clés disponibles : (\d+) \(réserve : (\d+)\) · Loyer à la date de début : (.*)$/, 'Keys available: $1 (reserve: $2) · Rent at start date: $3'],
    [/^Maximum (\d+) clés remises \(hors réserve\)\.$/, 'Maximum $1 keys issued (excluding reserve).'],
    [/^La location active a (\d+) clé\(s\) remise\(s\) : clés moins réserve doit rester supérieur ou égal\.$/, 'The active lease has $1 key(s) issued: keys minus reserve must remain greater than or equal.'],
    [/^Le garage est actuellement loué \((.+)\)\.$/, 'The garage is currently rented ($1).'],
    [/^Le garage a un historique de (\d+) location(s?)\. Les locations passées sont conservées\.$/, 'The garage has a history of $1 lease$2. Past leases are kept.'],
    [/^Ce locataire a été assigné à un garage \((\d+) location(s?) : (.+)\)\.$/, 'This tenant has been assigned to a garage ($1 lease$2: $3).'],
    [/^(\d+) paiements? (?:a|ont) déjà été effectués? pour cette location\.$/, '$1 payment(s) already made for this lease.'],
    [/^La date de début doit être postérieure au début du loyer précédent \((.+)\) : pas de chevauchement\.$/, 'The start date must be after the start of the previous rent ($1): no overlap.'],
    [/^La date de début doit être postérieure à la fin de la dernière location \((.+)\)\.$/, 'The start date must be after the end of the latest lease ($1).'],
    [/^Modification et suppression impossibles : un paiement anticipé est déjà enregistré pour (.+) \(loyer de (.+)\)\. Annulez d'abord ce paiement dans l'écran Paiements\.$/, 'Editing and deletion not possible: an advance payment is already recorded for $1 (rent of $2). Cancel this payment first in the Payments screen.'],
    [/^Le montant doit être inférieur au reste dû \((.+)\)\. Utilisez « Payer en totalité »\.$/, 'The amount must be less than the remaining due ($1). Use “Pay in full”.'],
    [/^(\d+) locations?$/, '$1 lease(s)'], [/^(.+)\/mois$/, '$1/month'], [/^Aucun loyer$/, 'No rent'],
    [/^(\d+) clés disponibles \(réserve : (\d+)\)$/, '$1 keys available (reserve: $2)'],
    [/^Afficher plus \((\d+)\)$/, 'Show more ($1)'], [/^Départ du garage (.+)$/, 'Departure from garage $1'], [/^Fin de location prévue · (.+)$/, 'Planned lease end · $1'], [/^Contrat (.+)$/, 'Contract $1'], [/^Loyer (.+)\/mois$/, 'Rent $1/month'], [/^(\d+) clés? remises?$/, '$1 key(s) issued'], [/^Fin de la location (.+)$/, 'End of lease $1'],
    [/^Durée : (\d+) mois$/, 'Duration: $1 months'], [/^Durée : (\d+) ans? et (\d+) mois$/, 'Duration: $1 year(s) and $2 months'], [/^Durée : (\d+) ans?$/, 'Duration: $1 year(s)'], [/^Reste dû (.+)$/, 'Remaining due $1'],
    [/^Résolu le (.+)$/, 'Resolved on $1'],
    [/^Supprimer le garage (.+) \?$/, 'Delete garage $1?'],
    [/^Supprimer (.+) \?$/, 'Delete $1?']
  ];
  (() => { const N = { 'Garage': 'Garage', 'Locataire': 'Tenant', 'Loyer': 'Rent', 'Location': 'Lease', 'Remarque': 'Remark', 'Paiement': 'Payment', 'Mot de passe': 'Password' }, V = { 'créé': 'created', 'créée': 'created', 'modifié': 'modified', 'modifiée': 'modified', 'supprimé': 'deleted', 'supprimée': 'deleted', 'clôturée': 'closed', 'enregistré': 'recorded', 'annulé': 'cancelled' }, nn = '(Garage|Locataire|Loyer|Location|Remarque|Paiement|Mot de passe)', rf = r => r ? ' ' + r.replace(/^du garage /, 'of garage ') : '';
    P.push([new RegExp('^' + nn + '(?: (.+?))? (créé|créée|modifié|modifiée|supprimé|supprimée|clôturée|enregistré|annulé) avec succès$'), (m, n, r, v) => N[n] + rf(r) + ' ' + V[v] + ' successfully'], [new RegExp('^' + nn + '(?: (.+?))? : échec de (l\'enregistrement|la suppression)\. Veuillez réessayer\.$'), (m, n, r, v) => N[n] + rf(r) + ': ' + (v === 'la suppression' ? 'deletion' : 'saving') + ' failed. Please try again.']); })();
  function tr(s) {
    const core = norm(s);
    if (!core) return s;
    const lead = s.match(/^\s*/)[0], trail = s.match(/\s*$/)[0];
    let out = trCore(core);
    return out === core ? s : lead + out + trail;
  }
  function trCore(c) {
    if (D[c] !== undefined) return D[c];
    for (const [re, rep] of P) if (re.test(c)) return c.replace(re, rep);
    const mm = c.match(/^([A-Za-zÀ-ÿ]+) (\d{4})$/);
    if (mm && MONTHS[mm[1].toLowerCase()]) return MONTHS[mm[1].toLowerCase()] + ' ' + mm[2];
    if (c.indexOf(' · ') > -1) { const parts = c.split(' · '), out = parts.map(trCore); return out.join(' · '); }
    return c;
  }
  const S = window.__GG_I18N_STATE || (window.__GG_I18N_STATE = { orig: new WeakMap(), wrote: new WeakMap(), obs: null, lang: 'fr' });
  let lang = S.lang;
  const orig = S.orig, wrote = S.wrote;
  const ATTRS = ['placeholder', 'title', 'aria-label', 'data-tip'];
  const skip = n => { const p = n.nodeType === 3 ? n.parentNode : n; return !p || /^(SCRIPT|STYLE|TEXTAREA)$/.test(p.tagName) || (p.closest && p.closest('[data-i18n-skip],.ql-editor')); };
  function doText(n) {
    if (skip(n)) return;
    const cur = n.nodeValue;
    const known = wrote.has(n) && wrote.get(n) === cur;
    const fr = known ? orig.get(n) : cur;
    const p = n.parentNode;
    let en = fr;
    if (lang === 'en') en = (p && p.hasAttribute && p.hasAttribute('data-wd')) ? WD[+p.getAttribute('data-wd')] : tr(fr);
    orig.set(n, fr);
    if (en !== cur) n.nodeValue = en;
    wrote.set(n, en);
  }
  function doAttr(el, a) {
    if (skip(el)) return;
    const cur = el.getAttribute(a); if (cur == null) return;
    let rec = orig.get(el); if (!rec) { rec = {}; orig.set(el, rec); }
    const r = rec[a];
    const fr = r && r.wrote === cur ? r.fr : cur;
    const en = lang === 'en' ? tr(fr) : fr;
    rec[a] = { fr, wrote: en };
    if (en !== cur) el.setAttribute(a, en);
  }
  function walk(root) {
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n; while ((n = w.nextNode())) doText(n);
    const q = root.querySelectorAll ? root.querySelectorAll('[placeholder],[title],[aria-label],[data-tip]') : [];
    q.forEach(el => ATTRS.forEach(a => el.hasAttribute(a) && doAttr(el, a)));
    if (root.nodeType === 1) ATTRS.forEach(a => root.hasAttribute(a) && doAttr(root, a));
  }
  function start() {
    if (S.obs) S.obs.disconnect();
    const obs = S.obs = new MutationObserver(ms => {
      for (const m of ms) {
        if (m.type === 'characterData') doText(m.target);
        else if (m.type === 'attributes') doAttr(m.target, m.attributeName);
        else m.addedNodes.forEach(n => { if (n.nodeType === 3) doText(n); else if (n.nodeType === 1) walk(n); });
      }
    });
    obs.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }
  window.GG_I18N = {
    t: s => (lang === 'en' ? tr(s) : s),
    fr: (el, a) => { const r = orig.get(el); return r && r[a] ? r[a].fr : null; },
    get lang() { return lang; },
    dbg(txt) { const out = []; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) if (n.nodeValue.trim() === txt) out.push({ cur: n.nodeValue, wrote: wrote.get(n), orig: orig.get(n), has: wrote.has(n) }); return out; },
    setLang(l) { lang = S.lang = l === 'en' ? 'en' : 'fr'; document.documentElement.lang = lang; walk(document.body); start(); }
  };
})();
