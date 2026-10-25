import { RemarqueCible, RemarqueDTO } from '../app/features/remarques/remarque.models';

/** Remarque d'information. */
export const remarque = (over: Partial<RemarqueDTO> = {}): RemarqueDTO => ({
  id: 1,
  type: 'INFORMATION',
  texte: '<p>Télécommande de porte <strong>remplacée</strong>.</p>',
  dateCreation: '2026-07-03T09:30:00',
  resolu: null,
  dateResolution: null,
  ...over,
});

/** Problème non résolu. */
export const probleme = (over: Partial<RemarqueDTO> = {}): RemarqueDTO =>
  remarque({
    id: 2,
    type: 'PROBLEME',
    texte: '<p>Fuite au plafond près de la porte.</p>',
    dateCreation: '2026-09-20T14:10:00',
    resolu: false,
    ...over,
  });

export const problemeResolu = (over: Partial<RemarqueDTO> = {}): RemarqueDTO =>
  probleme({ id: 3, texte: '<p>Véhicule garé devant l’entrée.</p>', resolu: true, dateResolution: '2026-09-28', ...over });

export const autre = (over: Partial<RemarqueDTO> = {}): RemarqueDTO =>
  remarque({ id: 4, type: 'AUTRE', texte: '<p>Peinture au sol à refaire.</p>', dateCreation: '2026-05-12T16:45:00', ...over });

export const CIBLE_GARAGE: RemarqueCible = { type: 'garage', id: 5, libelle: 'G05' };
export const CIBLE_LOCATAIRE: RemarqueCible = { type: 'locataire', id: 4, libelle: 'Nathalie Claes' };
