/** Quatre profils (RG-DRO-01) : `CONSULTANT` remplace `LECTURE_SEULE`. */
export type Role = 'ADMIN' | 'GESTIONNAIRE' | 'LOCATAIRE' | 'CONSULTANT';

export const ROLES: readonly Role[] = ['ADMIN', 'GESTIONNAIRE', 'LOCATAIRE', 'CONSULTANT'];

/** `UtilisateurDTO` (docs/api-contract.md, section 3). */
export interface Utilisateur {
  id: number;
  login: string;
  prenom: string;
  nom: string;
  email: string;
  role: Role;
  /** Fiche locataire reliée à un compte Locataire, sinon `null`. */
  locataireId?: number | null;
  locataireNom?: string | null;
  actif: boolean;
  /** Vrai après la création ou la réinitialisation du compte : un nouveau mot de passe est exigé (RG-AUT-05). */
  motDePasseTemporaire?: boolean;
  derniereConnexion?: string | null;
  dateCreation?: string | null;
  /** Le compte est celui de l'utilisateur connecté (RG-USR-03). */
  vous?: boolean;
}

export interface ConnexionRequete {
  login: string;
  motDePasse: string;
}

export interface ConnexionReponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  utilisateur: Utilisateur;
}

export interface ChangementMotDePasse {
  motDePasseActuel: string;
  nouveauMotDePasse: string;
}

export interface ReinitialisationMotDePasse {
  jeton: string;
  nouveauMotDePasse: string;
}
