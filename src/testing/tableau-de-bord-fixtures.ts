import { ImpayeARelancer, RemarqueATraiter, TableauDeBord } from '../app/features/tableau-de-bord/tableau-de-bord.models';
import { AvisLoyerDTO, RelanceDTO } from '../app/features/messages/messages.models';

const MOIS = ['2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10'];

export const tableauDeBord = (over: Partial<TableauDeBord> = {}): TableauDeBord => ({
  tauxOccupation: { pourcentage: 58, garagesLoues: 7, garagesTotal: 12 },
  loyersMensuels: 600,
  impayes: { montant: 120, nbTotaux: 1, nbPartiels: 1 },
  garagesLibres: { nombre: 4, nombreIndisponibles: 1 },
  loyersEncaisses12Mois: MOIS.map((mois, i) => ({ mois, montant: 400 + i * 20 })),
  tauxOccupation12Mois: MOIS.map((mois, i) => ({ mois, pourcentage: 40 + i * 2 })),
  ...over,
});

export const impaye = (over: Partial<ImpayeARelancer> = {}): ImpayeARelancer => ({
  locataire: { id: 6, nom: 'Dubois', prenom: 'Pierre' },
  garage: { id: 6, numero: 'G06' },
  periode: '2026-09-01',
  resteDu: 40,
  type: 'PARTIEL',
  montantRecu: 40,
  montantDu: 80,
  ...over,
});

export const impayeTotal = (over: Partial<ImpayeARelancer> = {}): ImpayeARelancer =>
  impaye({
    locataire: { id: 3, nom: 'Lambert', prenom: 'Sophie' },
    garage: { id: 3, numero: 'G03' },
    periode: '2026-08-01',
    resteDu: 80,
    type: 'TOTAL',
    montantRecu: 0,
    ...over,
  });

export const remarqueATraiter = (over: Partial<RemarqueATraiter> = {}): RemarqueATraiter => ({
  id: 3,
  dateCreation: '2026-10-02T09:00:00',
  texte: '<p>Porte <b>difficile à ouvrir</b>.</p>',
  garageId: 6,
  garage: 'G06',
  locataireId: null,
  locataire: null,
  ...over,
});

export const avisLoyer = (over: Partial<AvisLoyerDTO> = {}): AvisLoyerDTO => ({
  avisId: null,
  locationId: 5,
  loyerGarageId: 18,
  locataireId: 5,
  locataire: 'Janssens Eva',
  email: null,
  telephone: '0470 00 00 05',
  garageId: 5,
  garage: 'G05',
  ancienMontant: 75,
  nouveauMontant: 78,
  ecart: 3,
  dateEffet: '2026-12-01',
  statut: 'A_CONTACTER',
  moyen: null,
  dateEnvoi: null,
  ...over,
});

export const relance = (over: Partial<RelanceDTO> = {}): RelanceDTO => ({
  relanceId: null,
  echeanceId: 10,
  locationId: 6,
  locataireId: 6,
  locataire: 'Dubois Pierre',
  email: 'pierre.dubois@example.com',
  telephone: '0470 00 00 06',
  garageId: 6,
  garage: 'G06',
  periode: '2026-09-01',
  montantDu: 80,
  montantRecu: 40,
  resteDu: 40,
  cas: 'PARTIEL',
  statut: 'A_RELANCER',
  moyen: null,
  dateRelance: null,
  ...over,
});
