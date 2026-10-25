/** Tableau de bord : voir docs/api-contract.md, chapitre 9. */
import { LocataireRef } from '../garages/garage.models';
import { GarageRef } from '../locations/location.models';

export interface PointMontant {
  /** `yyyy-MM`. */
  mois: string;
  montant: number;
}

export interface PointPourcentage {
  /** `yyyy-MM`. */
  mois: string;
  pourcentage: number;
}

/** Indicateurs et séries de 12 mois, du plus ancien au mois courant (RG-DAS-01 à 05). */
export interface TableauDeBord {
  tauxOccupation: { pourcentage: number; garagesLoues: number; garagesTotal: number };
  loyersMensuels: number;
  /** Toutes les échéances en retard : `nbTotaux` sans aucun versement, `nbPartiels` avec un reste dû. */
  impayes: { montant: number; nbTotaux: number; nbPartiels: number };
  /** Garages au statut `LIBRE`, et garages `INDISPONIBLES` non loués. */
  garagesLibres: { nombre: number; nombreIndisponibles: number };
  loyersEncaisses12Mois: PointMontant[];
  tauxOccupation12Mois: PointPourcentage[];
}

/** Une ligne de « Impayés à relancer » (RG-DAS-06), de la plus ancienne échéance à la plus récente. */
export interface ImpayeARelancer {
  locataire: LocataireRef;
  garage: GarageRef;
  /** Premier jour du mois de l'échéance, `yyyy-MM-dd`. */
  periode: string;
  resteDu: number;
  /** `TOTAL` : aucun versement (badge rouge) ; `PARTIEL` : badge orange, « Reçu x sur y » en info-bulle. */
  type: 'TOTAL' | 'PARTIEL';
  montantRecu: number;
  montantDu: number;
}
