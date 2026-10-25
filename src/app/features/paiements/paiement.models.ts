/** Paiements : voir docs/api-contract.md, chapitre 7. */
import { LocataireRef } from '../garages/garage.models';
import { GarageRef } from '../locations/location.models';

/** Statut de la ligne, calculé par l'API (RG-PAI-11). */
export type PaiementStatut = 'A_PAYER' | 'PARTIEL' | 'PAYE';
export type PaiementFilter = PaiementStatut | 'TOUS';
export type ModePaiement = 'VIREMENT' | 'ESPECES';
/** Type d'un paiement saisi : `TOTAL` verse le reste dû. */
export type TypePaiement = 'TOTAL' | 'PARTIEL';

/** Une ligne de l'écran : une location, pour un mois. */
export interface PaiementDTO {
  locationId: number;
  /** `null` tant qu'aucune échéance n'est enregistrée pour ce mois. */
  echeanceId: number | null;
  /** Premier jour du mois, `yyyy-MM-dd`. */
  periode: string;
  locataire: LocataireRef;
  garage: GarageRef;
  montantDu: number;
  montantRecu: number;
  resteDu: number;
  statut: PaiementStatut;
  /** Échéance enregistrée, non soldée, d'un mois strictement passé (RG-PAI-12 et 31). */
  enRetard: boolean;
  dernierVersement: { date: string; modePaiement: ModePaiement } | null;
  nbVersements: number;
}

/** Synthèse du mois (RG-PAI-40) : compteurs par statut et indicateurs. */
export interface PaiementSynthese {
  compteurs: Record<PaiementFilter, number>;
  attendu: number;
  encaisse: { total: number; virement: number; especes: number };
  enRetard: number;
}

export interface Versement {
  id: number;
  montant: number;
  modePaiement: ModePaiement;
  datePaiement: string;
}

/** Détail des versements d'une ligne (RG-PAI-24), du plus ancien au plus récent. */
export interface VersementsDetail {
  montantDu: number;
  montantRecu: number;
  resteDu: number;
  versements: Versement[];
}

/** Champs envoyés pour enregistrer un paiement ; `montant` seulement pour un paiement partiel. */
export interface PaiementSaisie {
  locationId: number;
  /** `yyyy-MM`. */
  mois: string;
  type: TypePaiement;
  montant?: number;
  modePaiement: ModePaiement;
  datePaiement: string;
}
