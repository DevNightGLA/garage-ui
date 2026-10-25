/** Locataires : voir docs/api-contract.md, chapitre 5. */

/** Statut calculé par l'API (RG-LOCT-10) ; `A_VENIR` : aucune location active, au moins une à venir. */
export type LocataireStatut = 'ACTUEL' | 'A_VENIR' | 'ANCIEN' | 'SANS_LOCATION';
export type LocataireFilter = LocataireStatut | 'TOUS';
/** Seulement pour un locataire `ACTUEL`, `null` sinon. */
export type Solde = 'A_JOUR' | 'EN_RETARD';
export type Civilite = 'M' | 'MME';

/** Une ressource, un DTO : lu en réponse, envoyé en création et en modification. */
export interface LocataireDTO {
  id: number;
  civilite: Civilite | null;
  nom: string;
  prenom: string;
  rue: string;
  numeroRue: string;
  codePostal: string;
  localite: string;
  tel1: string;
  tel2: string | null;
  email: string | null;
  statut: LocataireStatut;
  solde: Solde | null;
  /** Numéros des garages actuellement loués, dans l'ordre naturel. */
  garages: string[];
  nbRemarques: number;
}

/** Champs envoyés à la création et à la modification : les champs calculés sont ignorés par l'API. */
export interface LocataireEnvoi {
  civilite: Civilite | null;
  nom: string;
  prenom: string;
  rue: string;
  numeroRue: string;
  codePostal: string;
  localite: string;
  tel1: string;
  tel2: string | null;
  email: string | null;
}

export type LocataireCompteurs = Record<LocataireFilter, number>;
