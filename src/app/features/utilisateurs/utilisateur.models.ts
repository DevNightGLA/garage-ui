import { Role } from '../../core/auth/auth.models';

/** Utilisateurs : docs/api-contract.md, section 3 (RG chapitre 17). */
export interface UtilisateurDTO {
  id: number;
  login: string;
  prenom: string;
  nom: string;
  email: string;
  role: Role;
  locataireId: number | null;
  locataireNom: string | null;
  actif: boolean;
  motDePasseTemporaire: boolean;
  derniereConnexion: string | null;
  dateCreation: string;
  /** Compte connecté (« Vous »). */
  vous: boolean;
}

export interface UtilisateurSaisie {
  nom: string;
  prenom: string;
  email: string;
  login?: string;
  role: Role;
  locataireId: number | null;
}

/** Réponse de la création et de la réinitialisation : le mot de passe n'est donné qu'une fois. */
export interface MotDePasseTemporaireDTO {
  utilisateur: UtilisateurDTO;
  motDePasseTemporaire: string;
}

export type UtilisateurStatut = 'ACTIFS' | 'DESACTIVES' | 'TOUS';
export type CompteursUtilisateurs = Record<UtilisateurStatut | Role, number>;

/** Profils : icône et couleur (maquette, `P()`). */
export const PROFILS: Record<Role, { icon: string; gradient: string }> = {
  ADMIN: { icon: 'fa-user-shield', gradient: 'var(--gradient-primary)' },
  GESTIONNAIRE: { icon: 'fa-user-pen', gradient: 'var(--gradient-info)' },
  LOCATAIRE: { icon: 'fa-house-user', gradient: 'var(--gradient-warning)' },
  CONSULTANT: { icon: 'fa-eye', gradient: 'var(--gradient-dark)' },
};
