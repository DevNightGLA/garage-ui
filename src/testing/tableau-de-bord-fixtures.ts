import { ImpayeARelancer, TableauDeBord } from '../app/features/tableau-de-bord/tableau-de-bord.models';

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
