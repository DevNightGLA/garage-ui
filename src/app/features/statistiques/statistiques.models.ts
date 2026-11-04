import { PointMontant, PointPourcentage } from '../tableau-de-bord/tableau-de-bord.models';

/** `GET /api/statistiques?annee=` : docs/api-contract.md, section 14 (RG-STA-01 à 04). */
export interface Statistiques {
  annee: number;
  /** Douze mois, versements rangés par mois de paiement. */
  loyersEncaisses: PointMontant[];
  totalEncaisse: number;
  /** Jusqu'au mois courant pour l'année en cours. */
  tauxOccupation: PointPourcentage[];
  /** Au 31/12, ou à la date du jour pour l'année en cours. */
  repartition: { date: string; loues: number; libres: number; indisponibles: number; total: number };
  remarques: { information: number; probleme: number; autre: number; problemesResolus: number; tauxResolution: number | null };
  anneesDisponibles: number[];
}
