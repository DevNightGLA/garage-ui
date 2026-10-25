/** Remarques : voir docs/api-contract.md, chapitre 8. */

export type RemarqueType = 'INFORMATION' | 'PROBLEME' | 'AUTRE';

/** Une remarque est rattachée à un garage ou à un locataire, jamais aux deux (RG-REM-01). */
export type RemarqueCibleType = 'garage' | 'locataire';

export interface RemarqueCible {
  type: RemarqueCibleType;
  id: number;
  /** Texte de l'en-tête des fenêtres : numéro du garage ou nom du locataire. */
  libelle: string;
}

/** Une ressource, un DTO : lu en réponse, envoyé en création et en modification (seuls `type` et `texte` comptent). */
export interface RemarqueDTO {
  id: number;
  type: RemarqueType;
  /** HTML limité, nettoyé par l'API à l'enregistrement. */
  texte: string;
  /** Date et heure du serveur, `yyyy-MM-dd'T'HH:mm:ss` (RG-REM-03). */
  dateCreation: string;
  /** `null` pour un type autre que `PROBLEME` (RG-REM-04). */
  resolu: boolean | null;
  dateResolution: string | null;
}

export interface RemarqueEnvoi {
  type: RemarqueType;
  texte: string;
}
