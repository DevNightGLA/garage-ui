import { PageResponse } from '../../core/api/page-response';
import { LocataireDTO } from '../locataires/locataire.models';

/** Chronologie d'un locataire : docs/api-contract.md, section 14 (RG-CHR-01 à 03). */
export type ChronologieFiltre = 'TOUS' | 'LOCATIONS' | 'REMARQUES' | 'PAIEMENTS';
export type EvenementType = 'LOCATION_DEBUT' | 'LOCATION_FIN' | 'PAIEMENT' | 'REMARQUE' | 'REMARQUE_RESOLUE';

export interface Evenement {
  type: EvenementType;
  categorie: Exclude<ChronologieFiltre, 'TOUS'>;
  /** `yyyy-MM-dd'T'HH:mm:ss` ; minuit pour un événement sans heure (location, paiement). */
  dateHeure: string;
  /** Titre français du back ; l'écran affiche un titre traduit selon `type`. */
  titre: string;
  /** Garage (location), mode de paiement (`virement`, `especes`) ou type de remarque (`information`…). */
  pastille: string | null;
  montant: number | null;
  /** Texte ou HTML nettoyé (remarque). */
  description: string | null;
  aVenir: boolean;
}

export interface Chronologie {
  locataire: LocataireDTO;
  nbLocations: number;
  totalVerse: number;
  /** Remarques « Problème » non résolues. */
  remarquesOuvertes: number;
  compteurs: Record<ChronologieFiltre, number>;
  evenements: PageResponse<Evenement>;
}
