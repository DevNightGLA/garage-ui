/** Paramètres et modèles de messages : docs/api-contract.md, section 11 (RG chapitre 15). */

export type ParametreNature = 'METIER' | 'APPLICATION';
export type ParametreType = 'TEXTE' | 'EMAIL' | 'ENTIER' | 'LISTE' | 'TEXTE_RICHE';

export interface ParametreDTO {
  nature: ParametreNature;
  categorie: string;
  cle: string;
  /** Libellé français du back (repli si la traduction manque). */
  libelle: string;
  type: ParametreType;
  valeur: string | null;
  obligatoire: boolean;
  ordre: number;
  min: number | null;
  max: number | null;
  choix: string[] | null;
  dateModification: string;
}

export interface ParametreValeur {
  cle: string;
  valeur: string;
}

/** Catégories par nature, dans l'ordre de la maquette (`defParams`). */
export const CATEGORIES: Record<ParametreNature, readonly string[]> = {
  METIER: ['organisation', 'garages_loyers_locations', 'paiements_impayes'],
  APPLICATION: ['expediteur', 'affichage', 'securite'],
};

/** Catégories qui changent le contexte de l'application (lignes par page, langue, inactivité…). */
export const CATEGORIES_CONTEXTE: readonly string[] = ['affichage', 'securite'];
