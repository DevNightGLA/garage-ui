export type Role = 'ADMIN' | 'GESTIONNAIRE' | 'LECTURE_SEULE';

export interface Utilisateur {
  id: number;
  login: string;
  email: string;
  role: Role;
  actif: boolean;
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
