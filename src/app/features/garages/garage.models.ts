/** Garages et loyers : voir docs/api-contract.md, chapitre 4. */

/** Statut affiché ; `LOUE` est calculé par l'API. */
export type GarageStatut = 'LIBRE' | 'LOUE' | 'INDISPONIBLE';
/** Statut que l'utilisateur peut choisir. */
export type GarageStatutModifiable = 'LIBRE' | 'INDISPONIBLE';
export type GarageFilter = GarageStatut | 'TOUS';
export type LoyerEtat = 'A_VENIR' | 'EN_VIGUEUR' | 'CLOTURE';

export interface LocataireRef {
  id: number;
  nom: string;
  prenom: string;
}

/** Une ressource, un DTO : lu en réponse, envoyé en création et en modification. */
export interface GarageDTO {
  id: number;
  numero: string;
  adresse?: string | null;
  nbClesTotal: number;
  nbClesReserve: number;
  nbClesDisponibles: number;
  statut: GarageStatut;
  statutModifiable: GarageStatutModifiable;
  loyerCourant: number | null;
  locataire: LocataireRef | null;
  nbRemarques: number;
}

/** Champs envoyés à la création (`POST`) ; `loyerMontant` et `loyerDateDebut` ne sont jamais renvoyés. */
export interface GarageCreation {
  numero: string;
  nbClesTotal: number;
  nbClesReserve: number;
  statutModifiable: GarageStatutModifiable;
  loyerMontant: number;
  loyerDateDebut: string;
}

/** Champs envoyés à la modification (`PUT`) : le numéro et le loyer ne changent pas ici. */
export interface GarageModification {
  nbClesTotal: number;
  nbClesReserve: number;
  statutModifiable?: GarageStatutModifiable;
}

export type GarageCompteurs = Record<GarageFilter, number>;

export interface LoyerDTO {
  id: number;
  montant: number;
  dateDebut: string;
  dateFin: string | null;
  etat: LoyerEtat;
  modifiable: boolean;
  supprimable: boolean;
  /** Info-bulle de l'icône Modifier quand elle est bloquée ; `null` si l'action est permise. */
  motifModification: string | null;
  motifSuppression: string | null;
}

export interface LoyerEnvoi {
  montant: number;
  dateDebut: string;
}
