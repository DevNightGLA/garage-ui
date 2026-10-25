import { ConditionsLocation, LocationDTO } from '../app/features/locations/location.models';

/** Location active, sans date de fin. */
export const location = (over: Partial<LocationDTO> = {}): LocationDTO => ({
  id: 1,
  statut: 'ACTIVE',
  locataire: { id: 1, nom: 'Dupont', prenom: 'Marie' },
  garage: { id: 1, numero: 'G01' },
  dateDebut: '2025-03-01',
  dateFin: null,
  loyer: 90,
  nbClesRemises: 2,
  ...over,
});

export const locationAVenir = (over: Partial<LocationDTO> = {}): LocationDTO =>
  location({
    id: 2,
    statut: 'A_VENIR',
    locataire: { id: 3, nom: 'Martin', prenom: 'Luc' },
    garage: { id: 12, numero: 'G12' },
    dateDebut: '2026-12-01',
    loyer: 95,
    ...over,
  });

export const locationTerminee = (over: Partial<LocationDTO> = {}): LocationDTO =>
  location({
    id: 3,
    statut: 'TERMINEE',
    locataire: { id: 4, nom: 'Claes', prenom: 'Nathalie' },
    garage: { id: 2, numero: 'G02' },
    dateDebut: '2024-01-01',
    dateFin: '2025-12-31',
    loyer: 85,
    nbClesRemises: 1,
    ...over,
  });

export const COMPTEURS_LOCATIONS = { A_VENIR: 1, ACTIVE: 7, TERMINEE: 2, TOUS: 10 };

export const CONDITIONS: ConditionsLocation = { nbClesDisponibles: 2, nbClesReserve: 1, loyer: 90 };
