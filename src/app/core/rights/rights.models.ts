import { Role } from '../auth/auth.models';

/** Codes d'écran des droits (docs/api-contract.md, section 1, « Profils et droits »). */
export type Ecran =
  | 'DASH'
  | 'STA'
  | 'GAR'
  | 'LOY'
  | 'HLOC'
  | 'TEN'
  | 'CHR'
  | 'LOC'
  | 'PAI'
  | 'REM'
  | 'AVI'
  | 'REL'
  | 'LIB'
  | 'PAR'
  | 'TPL'
  | 'USR'
  | 'DRO'
  | 'AUD'
  | 'MNT';

/** Voir, ajouter, modifier, supprimer (RG-DRO-10). */
export type Action = 'v' | 'a' | 'm' | 'd';

export type Appareil = 'ORDINATEUR' | 'TABLETTE' | 'SMARTPHONE';

/** `DroitProfilDTO` (section 12). */
export interface DroitProfil {
  profil: Role;
  ecran: Ecran;
  section: string;
  libelle: string;
  ajoutPropose: boolean;
  modificationProposee: boolean;
  suppressionProposee: boolean;
  peutVoir: boolean;
  peutAjouter: boolean;
  peutModifier: boolean;
  peutSupprimer: boolean;
}

/** `DroitAppareilDTO` : écran autorisé ou non sur tablette et smartphone (l'ordinateur a tout). */
export interface DroitAppareil {
  appareil: Exclude<Appareil, 'ORDINATEUR'>;
  ecran: Ecran;
  autorise: boolean;
}

/** `GET /api/droits/moi`. */
export interface DroitsMoi {
  profil: Role;
  ecrans: DroitProfil[];
  appareils: DroitAppareil[];
}
