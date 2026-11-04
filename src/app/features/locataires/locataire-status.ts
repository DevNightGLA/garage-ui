import { BadgeTone } from '../../shared/status-badge/status-badge';
import { LocataireDTO } from './locataire.models';

/** Clé de traduction (`locataires.statut.*`) et teinte du badge : un locataire actuel affiche son solde (RG-LOCT-10). */
export type LocataireBadgeKey = 'A_JOUR' | 'EN_RETARD' | 'ACTUEL' | 'A_VENIR' | 'ANCIEN' | 'SANS_LOCATION';

export const LOCATAIRE_BADGE_TONE: Record<LocataireBadgeKey, BadgeTone> = {
  A_JOUR: 'success',
  EN_RETARD: 'danger',
  ACTUEL: 'success',
  A_VENIR: 'info',
  ANCIEN: 'ancien',
  SANS_LOCATION: 'warning',
};

export function locataireBadgeKey(locataire: Pick<LocataireDTO, 'statut' | 'solde'>): LocataireBadgeKey {
  return locataire.statut === 'ACTUEL' && locataire.solde ? locataire.solde : locataire.statut;
}

/** « Marie Dupont » → « MD ». */
export function locataireInitials(locataire: Pick<LocataireDTO, 'prenom' | 'nom'>): string {
  return `${locataire.prenom.charAt(0)}${locataire.nom.charAt(0)}`.toUpperCase();
}
