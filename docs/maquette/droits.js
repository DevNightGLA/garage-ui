(function () {
  var KEY = 'gg_droits_profils_v3', ROLE = { Admin: 'admin', Gestionnaire: 'gest', Locataire: 'tenant', Consultant: 'cons' }, PK = ['admin', 'gest', 'tenant', 'cons'];
  var S = [
    { id: 'dash', sec: 'Pilotage', label: 'Tableau de bord' },
    { id: 'sta', sec: 'Pilotage', label: 'Statistiques' },
    { id: 'gar', sec: 'Garages', label: 'Liste des garages', a: 1, m: 1, d: 1 },
    { id: 'loy', sec: 'Garages', label: 'Historique des loyers', a: 1, m: 1, d: 1 },
    { id: 'hloc', sec: 'Garages', label: 'Historique des locations' },
    { id: 'ten', sec: 'Locataires', label: 'Liste des locataires', a: 1, m: 1, d: 1 },
    { id: 'chr', sec: 'Locataires', label: 'Chronologie' },
    { id: 'loc', sec: 'Locations et paiements', label: 'Locations', a: 1, m: 1, d: 1 },
    { id: 'pai', sec: 'Locations et paiements', label: 'Paiements', a: 1, d: 1 },
    { id: 'rem', sec: 'Remarques', label: 'Fiches garage et locataire', a: 1, m: 1, d: 1 },
    { id: 'avi', sec: 'Envoi de messages', label: 'Avis de loyer', a: 1 },
    { id: 'rel', sec: 'Envoi de messages', label: 'Relances d’impayés', a: 1 },
    { id: 'lib', sec: 'Envoi de messages', label: 'Message libre', a: 1 },
    { id: 'par', sec: 'Configuration', label: 'Paramètres', m: 1 },
    { id: 'tpl', sec: 'Configuration', label: 'Modèles de messages', m: 1 },
    { id: 'usr', sec: 'Configuration', label: 'Utilisateurs', a: 1, m: 1 },
    { id: 'dro', sec: 'Configuration', label: 'Droits d’accès', m: 1 }
  ];
  function defaults() {
    var R = {}, z = function () { return { v: 0, a: 0, m: 0, d: 0 }; };
    PK.forEach(function (p) { R[p] = {}; S.forEach(function (s) { R[p][s.id] = z(); }); });
    S.forEach(function (s) {
      R.admin[s.id] = { v: 1, a: s.a ? 1 : 0, m: s.m ? 1 : 0, d: s.d ? 1 : 0 };
      if (s.sec !== 'Configuration') { R.gest[s.id] = { v: 1, a: R.admin[s.id].a, m: R.admin[s.id].m, d: R.admin[s.id].d }; R.cons[s.id].v = 1; }
      if (['gar', 'loy', 'hloc', 'loc', 'pai'].indexOf(s.id) >= 0) R.tenant[s.id].v = 1;
    });
    return R;
  }
  var cache = { raw: undefined, R: null };
  function load() {
    var raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) {}
    if (cache.R && raw === cache.raw) return cache.R;
    var D = defaults();
    try {
      var j = JSON.parse(raw || 'null');
      if (j) PK.forEach(function (p) { if (j[p]) Object.keys(D[p]).forEach(function (id) { if (j[p][id]) D[p][id] = Object.assign({}, D[p][id], j[p][id]); }); });
    } catch (e) {}
    D.admin = defaults().admin;
    cache = { raw: raw, R: D };
    return D;
  }
  window.GGDroits = {
    KEY: KEY, S: S, defaults: defaults, load: load,
    key: function (r) { return ROLE[r] || r; },
    can: function (role, id, act) {
      var c = (load()[ROLE[role] || role] || {})[id];
      if (!c) return false;
      return act === 'v' || !act ? !!c.v : !!(c.v && c[act]);
    }
  };
  var DK = 'gg_droits_appareils_v1';
  var DS = S.concat([{ id: 'aud', sec: 'Configuration', label: 'Journal d’audit' }, { id: 'mnt', sec: 'Configuration', label: 'Maintenance' }]);
  var LBL = { 'Tableau de bord': 'dash', 'Garages': 'gar', 'Liste des garages': 'gar', 'Historique des loyers': 'loy', 'Historique des locations': 'hloc', 'Locataires': 'ten', 'Liste des locataires': 'ten', 'Chronologie': 'chr', 'Locations': 'loc', 'Paiements': 'pai', 'Avis de loyer': 'avi', 'Relances d’impayés': 'rel', 'Message libre': 'lib', 'Loyers encaissés': 'sta', 'Taux d’occupation': 'sta', 'Répartition par statut': 'sta', 'Remarques par type': 'sta', 'Paramètres': 'par', 'Modèles de messages': 'tpl', 'Utilisateurs': 'usr', 'Droits d’accès': 'dro', 'Journal d’audit': 'aud', 'Maintenance': 'mnt' };
  function devDefaults() {
    var R = { tablet: {}, phone: {} };
    DS.forEach(function (s) { R.tablet[s.id] = 1; R.phone[s.id] = s.sec === 'Configuration' && s.id !== 'dro' ? 0 : 1; });
    return R;
  }
  function devLoad() {
    var D = devDefaults(), j = null;
    try { j = JSON.parse(localStorage.getItem(DK) || 'null'); } catch (e) {}
    if (j) ['tablet', 'phone'].forEach(function (k) { if (j[k]) Object.keys(D[k]).forEach(function (id) { if (j[k][id] === 0 || j[k][id] === 1) D[k][id] = j[k][id]; }); });
    return D;
  }
  function devSave(R) { try { localStorage.setItem(DK, JSON.stringify(R)); } catch (e) {} }
  function detect(view) {
    var v = view;
    if (!v) { try { v = localStorage.getItem('gg-view'); } catch (e) {} }
    if (v === 'tablet' || v === 'phone' || v === 'desktop') return v;
    var w = window.innerWidth;
    return w <= 640 ? 'phone' : w <= 1024 ? 'tablet' : 'desktop';
  }
  function devOk(id, dev) {
    dev = dev || detect();
    if (dev === 'desktop' || !id || id === 'dro') return true;
    return devLoad()[dev][id] !== 0;
  }
  window.GGDroits.dev = {
    KEY: DK, S: DS, defaults: devDefaults, load: devLoad, save: devSave, detect: detect, ok: devOk,
    idOf: function (l) { return LBL[l]; },
    okLabel: function (l, dev) { return devOk(LBL[l], dev); },
    filterSecs: function (secs, dev) {
      dev = dev || detect();
      var ok = function (l) { return devOk(LBL[l], dev); };
      return secs.map(function (s) { return Object.assign({}, s, { items: s.items.map(function (it) { return it.children ? Object.assign({}, it, { children: it.children.filter(ok) }) : it; }).filter(function (it) { return it.children ? it.children.length : ok(it.label); }) }); });
    }
  };
})();
(function () {
  var K = 'gg_maintenance', PAGE = 'Site en maintenance.dc.html';
  function on() { try { return localStorage.getItem(K) === '1'; } catch (e) { return false; } }
  function admin() { try { var r = localStorage.getItem('gg_role'); return !r || r === 'Admin'; } catch (e) { return true; } }
  window.GGMaint = { on: on, page: PAGE, set: function (v) { try { if (v) localStorage.setItem(K, '1'); else localStorage.removeItem(K); } catch (e) {} } };
  function guard() { if (on() && !admin()) location.replace(PAGE); }
  guard(); window.addEventListener('storage', guard); setInterval(guard, 1000);
})();
