/** Locations : voir docs/api-contract.md, chapitre 6. */
import { LocataireRef } from '../garages/garage.models';

/** Statut calculé par l'API à la date du jour (RG-LOC-01 à 03). */
export type LocationStatut = 'A_VENIR' | 'ACTIVE' | 'TERMINEE';
export type LocationCompteurs = Record<LocationStatut | 'TOUS', number>;

export interface GarageRef {
  id: number;
  numero: string;
}

/** Une ressource, un DTO : lu en réponse, envoyé en création et en modification. */
export interface LocationDTO {
  id: number;
  statut: LocationStatut;
  locataire: LocataireRef;
  garage: GarageRef;
  dateDebut: string;
  dateFin: string | null;
  /** Loyer en vigueur à la date utile (figé pour une location terminée) ; `null` s'il n'y en a pas. */
  loyer: number | null;
  nbClesRemises: number;
}

/** Champs envoyés à la création (`POST`) : la location naît sans date de fin. */
export interface LocationCreation {
  locataireId: number;
  garageId: number;
  dateDebut: string;
  nbClesRemises: number;
}

/** Champs envoyés à la modification (`PUT`) : sans `dateFin`, la date de fin est effacée (RG-LOC-26). */
export interface LocationModification {
  dateDebut: string;
  nbClesRemises: number;
  dateFin: string | null;
}

/** Aide du formulaire (RG-LOC-14) pour un garage et une date de début. */
export interface ConditionsLocation {
  nbClesDisponibles: number;
  nbClesReserve: number;
  loyer: number | null;
}
