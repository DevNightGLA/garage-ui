/** Journal d'audit : docs/api-contract.md, section 15 (RG chapitre 19). */
export type AuditAction = 'C' | 'M' | 'S';
export type AuditConcept =
  | 'GARAGE'
  | 'LOYER_GARAGE'
  | 'LOCATAIRE'
  | 'LOCATION'
  | 'ECHEANCE'
  | 'VERSEMENT'
  | 'REMARQUE'
  | 'UTILISATEUR'
  | 'PARAMETRE';

export interface OperationAuditDTO {
  revisionId: number;
  dateHeure: string;
  action: AuditAction;
  utilisateurId: number | null;
  utilisateurLogin: string | null;
  /** « Système » pour une tâche planifiée. */
  utilisateurNom: string;
  concept: AuditConcept;
  conceptLibelle: string;
  enregistrementId: number;
  libelle: string;
  contexte: string | null;
}

export interface ChampAuditDTO {
  champ: string;
  avant: unknown;
  apres: unknown;
  modifie: boolean;
  /** Mot de passe : « modifié, valeur masquée ». */
  masque: boolean;
}

export interface DetailAuditDTO {
  operation: OperationAuditDTO;
  valeurs: Record<string, unknown>;
  champs: ChampAuditDTO[];
}

/** Critères du journal (`GET /api/journal`). */
export interface JournalCriteria {
  du: string | null;
  au: string | null;
  utilisateurs: readonly number[];
  concepts: readonly AuditConcept[];
  action: AuditAction | null;
  q: string;
  asc: boolean;
}

export const EMPTY_CRITERIA: JournalCriteria = { du: null, au: null, utilisateurs: [], concepts: [], action: null, q: '', asc: false };

/** Concepts et icônes, dans l'ordre de la maquette (`TB()`). */
export const CONCEPTS: readonly { concept: AuditConcept; icon: string }[] = [
  { concept: 'GARAGE', icon: 'fa-solid fa-warehouse' },
  { concept: 'LOYER_GARAGE', icon: 'fa-solid fa-coins' },
  { concept: 'LOCATAIRE', icon: 'fa-solid fa-user' },
  { concept: 'LOCATION', icon: 'fa-solid fa-file-signature' },
  { concept: 'ECHEANCE', icon: 'fa-regular fa-calendar-check' },
  { concept: 'VERSEMENT', icon: 'fa-solid fa-euro-sign' },
  { concept: 'REMARQUE', icon: 'fa-regular fa-comment' },
  { concept: 'UTILISATEUR', icon: 'fa-solid fa-users-gear' },
  { concept: 'PARAMETRE', icon: 'fa-solid fa-sliders' },
];

export const conceptIcon = (concept: AuditConcept) => CONCEPTS.find((c) => c.concept === concept)?.icon ?? 'fa-solid fa-circle';
