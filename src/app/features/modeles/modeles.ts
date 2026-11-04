/** Modèles des e-mails (écran `TPL`, RG chapitre 15), d'après la maquette (`stTpl`, `varGroups`). */
export interface ModeleDef {
  key: 'avis' | 'total' | 'partiel' | 'signature';
  icon: string;
  /** Clé du paramètre de l'objet ; aucune pour la signature. */
  objet: string | null;
  texte: string;
  variables: readonly string[];
}

const LOCATAIRE = ['civilite', 'nom', 'prenom', 'garage'];
const RELANCE = [...LOCATAIRE, 'periode', 'montant_du', 'montant_recu', 'reste_du', 'expediteur'];

export const MODELES: readonly ModeleDef[] = [
  {
    key: 'avis',
    icon: 'fa-file-invoice',
    objet: 'modele_avis_objet',
    texte: 'modele_avis_texte',
    variables: [...LOCATAIRE, 'ancien_loyer', 'nouveau_loyer', 'date_effet', 'expediteur'],
  },
  {
    key: 'total',
    icon: 'fa-file-invoice-dollar',
    objet: 'modele_relance_total_objet',
    texte: 'modele_relance_total_texte',
    variables: RELANCE,
  },
  {
    key: 'partiel',
    icon: 'fa-file-invoice-dollar',
    objet: 'modele_relance_partiel_objet',
    texte: 'modele_relance_partiel_texte',
    variables: RELANCE,
  },
];

export const SIGNATURE: ModeleDef = { key: 'signature', icon: 'fa-signature', objet: null, texte: 'signature', variables: ['expediteur'] };
