import { LocataireDTO } from '../app/features/locataires/locataire.models';

/** Locataire actuel, en retard, avec deux garages. */
export const locataire = (over: Partial<LocataireDTO> = {}): LocataireDTO => ({
  id: 1,
  civilite: 'MME',
  nom: 'Dupont',
  prenom: 'Marie',
  rue: 'Rue de la Station',
  numeroRue: '14',
  codePostal: '1050',
  localite: 'Ixelles',
  tel1: '0470 00 00 01',
  tel2: null,
  email: 'marie.dupont@example.com',
  statut: 'ACTUEL',
  solde: 'EN_RETARD',
  garages: ['G01', 'G12'],
  nbRemarques: 2,
  ...over,
});

export const locataireAJour = (over: Partial<LocataireDTO> = {}): LocataireDTO =>
  locataire({ id: 2, civilite: 'M', nom: 'Peeters', prenom: 'Jan', solde: 'A_JOUR', garages: ['G02'], nbRemarques: 0, ...over });

export const locataireAVenir = (over: Partial<LocataireDTO> = {}): LocataireDTO =>
  locataire({ id: 3, civilite: 'M', nom: 'Martin', prenom: 'Luc', statut: 'A_VENIR', solde: null, garages: [], nbRemarques: 0, ...over });

export const locataireAncien = (over: Partial<LocataireDTO> = {}): LocataireDTO =>
  locataire({ id: 4, nom: 'Claes', prenom: 'Nathalie', statut: 'ANCIEN', solde: null, garages: [], nbRemarques: 1, ...over });

export const locataireSansLocation = (over: Partial<LocataireDTO> = {}): LocataireDTO =>
  locataire({ id: 5, nom: 'Maes', prenom: 'Julie', email: null, statut: 'SANS_LOCATION', solde: null, garages: [], nbRemarques: 0, ...over });

export const COMPTEURS_LOCATAIRES = { ACTUEL: 6, A_VENIR: 1, ANCIEN: 2, SANS_LOCATION: 1, TOUS: 10 };
