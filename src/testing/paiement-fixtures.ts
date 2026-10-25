import {
  PaiementDTO,
  PaiementSynthese,
  VersementsDetail,
} from '../app/features/paiements/paiement.models';

/** Ligne à payer, sans échéance enregistrée. */
export const paiement = (over: Partial<PaiementDTO> = {}): PaiementDTO => ({
  locationId: 1,
  echeanceId: null,
  periode: '2026-10-01',
  locataire: { id: 1, nom: 'Dupont', prenom: 'Marie' },
  garage: { id: 1, numero: 'G01' },
  montantDu: 90,
  montantRecu: 0,
  resteDu: 90,
  statut: 'A_PAYER',
  enRetard: false,
  dernierVersement: null,
  nbVersements: 0,
  ...over,
});

export const paiementPartiel = (over: Partial<PaiementDTO> = {}): PaiementDTO =>
  paiement({
    locationId: 2,
    echeanceId: 12,
    locataire: { id: 2, nom: 'Peeters', prenom: 'Jan' },
    garage: { id: 2, numero: 'G02' },
    montantDu: 80,
    montantRecu: 30,
    resteDu: 50,
    statut: 'PARTIEL',
    dernierVersement: { date: '2026-10-06', modePaiement: 'VIREMENT' },
    nbVersements: 1,
    ...over,
  });

export const paiementPaye = (over: Partial<PaiementDTO> = {}): PaiementDTO =>
  paiement({
    locationId: 3,
    echeanceId: 13,
    locataire: { id: 3, nom: 'Janssens', prenom: 'Pieter' },
    garage: { id: 3, numero: 'G03' },
    montantDu: 100,
    montantRecu: 100,
    resteDu: 0,
    statut: 'PAYE',
    dernierVersement: { date: '2026-10-03', modePaiement: 'ESPECES' },
    nbVersements: 1,
    ...over,
  });

export const SYNTHESE: PaiementSynthese = {
  compteurs: { A_PAYER: 2, PARTIEL: 1, PAYE: 4, TOUS: 7 },
  attendu: 600,
  encaisse: { total: 370, virement: 285, especes: 85 },
  enRetard: 120.5,
};

export const VERSEMENTS: VersementsDetail = {
  montantDu: 80,
  montantRecu: 30,
  resteDu: 50,
  versements: [
    { id: 21, montant: 10, modePaiement: 'ESPECES', datePaiement: '2026-10-02' },
    { id: 22, montant: 20, modePaiement: 'VIREMENT', datePaiement: '2026-10-06' },
  ],
};
