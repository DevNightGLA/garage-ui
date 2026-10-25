import { GarageDTO, LoyerDTO } from '../app/features/garages/garage.models';
import { PageResponse } from '../app/core/api/page-response';

export const garage = (over: Partial<GarageDTO> = {}): GarageDTO => ({
  id: 1,
  numero: 'G01',
  adresse: null,
  nbClesTotal: 3,
  nbClesReserve: 1,
  nbClesDisponibles: 2,
  statut: 'LOUE',
  statutModifiable: 'LIBRE',
  loyerCourant: 90,
  locataire: { id: 1, nom: 'Dupont', prenom: 'Marie' },
  nbRemarques: 2,
  ...over,
});

export const libre = (over: Partial<GarageDTO> = {}): GarageDTO =>
  garage({ id: 2, numero: 'G02', statut: 'LIBRE', loyerCourant: 85, locataire: null, nbRemarques: 0, ...over });

export const loyer = (over: Partial<LoyerDTO> = {}): LoyerDTO => ({
  id: 7,
  montant: 90,
  dateDebut: '2026-01-01',
  dateFin: null,
  etat: 'EN_VIGUEUR',
  modifiable: true,
  supprimable: false,
  motifModification: null,
  motifSuppression: "Seul le dernier loyer, s'il est à venir, peut être supprimé.",
  ...over,
});

export const pageOf = <T>(content: T[], total = content.length, page = 0, size = 10): PageResponse<T> => ({
  content,
  page,
  size,
  totalElements: total,
  totalPages: Math.max(1, Math.ceil(total / size)),
});

export const COMPTEURS = { LOUE: 4, LIBRE: 6, INDISPONIBLE: 1, TOUS: 11 };
