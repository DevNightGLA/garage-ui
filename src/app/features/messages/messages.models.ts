/** Envoi de messages : docs/api-contract.md, section 13 (RG chapitres 13 et 14). */

/** Moyen d'un contact enregistré à la main (sans e-mail). */
export type MoyenManuel = 'TELEPHONE' | 'COURRIER' | 'ORAL';
export const MOYENS_MANUELS: readonly MoyenManuel[] = ['TELEPHONE', 'COURRIER', 'ORAL'];
/** Moyen enregistré : e-mail ou contact manuel. */
export type Moyen = 'EMAIL' | MoyenManuel;

export type AvisStatut = 'A_ENVOYER' | 'A_CONTACTER' | 'ENVOYE' | 'INFORME';
export type AvisFiltre = 'A_ENVOYER' | 'ENVOYES';

export interface AvisLoyerDTO {
  /** `null` tant que l'avis n'est pas communiqué. */
  avisId: number | null;
  locationId: number;
  loyerGarageId: number;
  locataireId: number;
  /** « Nom Prénom ». */
  locataire: string;
  email: string | null;
  telephone: string | null;
  garageId: number;
  garage: string;
  ancienMontant: number;
  nouveauMontant: number;
  ecart: number;
  dateEffet: string;
  statut: AvisStatut;
  moyen: Moyen | null;
  dateEnvoi: string | null;
}

export type RelanceStatut = 'A_RELANCER' | 'RELANCE';
export type RelanceFiltre = 'A_RELANCER' | 'RELANCES';
export type RelanceCas = 'TOTAL' | 'PARTIEL';

export interface RelanceDTO {
  relanceId: number | null;
  echeanceId: number;
  locationId: number;
  locataireId: number;
  locataire: string;
  email: string | null;
  telephone: string | null;
  garageId: number;
  garage: string;
  periode: string;
  montantDu: number;
  montantRecu: number;
  resteDu: number;
  cas: RelanceCas;
  statut: RelanceStatut;
  moyen: Moyen | null;
  dateRelance: string | null;
}

export interface ApercuMessageDTO {
  de: string;
  reponseA: string | null;
  cci: string | null;
  a: string;
  objet: string;
  /** HTML, signature comprise. */
  texte: string;
}

/** Résultat d'un envoi groupé : e-mails partis, locataires sans e-mail, adresses. */
export interface EnvoiResultat {
  envoyes: number;
  sansEmail: number;
  destinataires: string[];
}

export interface DestinatairesLibre {
  actuels: number;
  actuelsSansEmail: number;
  locataires: { id: number; nom: string; email: string | null; ancien: boolean }[];
}

export type DestinataireMode = 'UN' | 'TOUS_ACTUELS';

export interface MessageLibre {
  destinataires: DestinataireMode;
  locataireId: number | null;
  objet: string;
  texte: string;
}

export type CompteursAvis = Record<AvisFiltre, number>;
export type CompteursRelances = Record<RelanceFiltre, number>;
