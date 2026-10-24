(function () {
  const norm = s => String(s).replace(/\u00a0/g, ' ').replace(/’/g, "'").replace(/\s+/g, ' ').trim();
  const RAW = {
    // navigation / generic
    'Tableau de bord': 'Dashboard', 'Garages': 'Garages', 'Locataires': 'Tenants', 'Locations': 'Leases', 'Paiements': 'Payments',
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
    'Montant': 'Amount', 'Montant (€)': 'Amount (€)', 'Date de début': 'Start date', 'Date de fin': 'End date', 'N°': 'No.',
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
    'Un paiement anticipé existe déjà': 'An advance payment already exists', 'Une location a débuté depuis la date de début de ce loyer': 'A lease has started since the start date of this rent',
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
    'Nouvelle remarque': 'New remark', 'Modifier la remarque': 'Edit remark', 'Visualiser la remarque': 'View remark', 'Aucune remarque.': 'No remarks.', 'Saisir la remarque…': 'Enter the remark…', 'Marquer résolu': 'Mark as resolved', 'Rouvrir': 'Reopen', 'Date de résolution': 'Resolution date',
    'La date de création est ajoutée automatiquement et n\'est pas modifiable.': 'The creation date is added automatically and cannot be edited.',
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
    'sur': 'of', 'garages': 'garages', 'locataires': 'tenants', 'locations': 'leases', 'loyers': 'rents', 'paiements': 'payments', 'À jour': 'Up to date',
    'jj/mm/aaaa': 'dd/mm/yyyy',
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
    [/^Modification et suppression impossibles : un paiement anticipé est déjà enregistré pour (.+) \(loyer de (.+)\)\. Annulez d'abord ce paiement dans l'écran Paiements\.$/, 'Editing and deletion not possible: an advance payment is already recorded for $1 (rent of $2). Cancel this payment first in the Payments screen.'],
    [/^Le montant doit être inférieur au reste dû \((.+)\)\. Utilisez « Payer en totalité »\.$/, 'The amount must be less than the remaining due ($1). Use “Pay in full”.'],
    [/^Résolu le (.+)$/, 'Resolved on $1'],
    [/^Supprimer le garage (.+) \?$/, 'Delete garage $1?'],
    [/^Supprimer (.+) \?$/, 'Delete $1?']
  ];
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
  const ATTRS = ['placeholder', 'title', 'aria-label'];
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
    const q = root.querySelectorAll ? root.querySelectorAll('[placeholder],[title],[aria-label]') : [];
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
