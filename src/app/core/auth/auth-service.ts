import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { RightsService } from '../rights/rights-service';
import { STORAGE_KEYS, StorageService } from '../storage';
import {
  ChangementMotDePasse,
  ConnexionReponse,
  ConnexionRequete,
  ReinitialisationMotDePasse,
  Utilisateur,
} from './auth.models';

export const AUTH_URL = '/api/auth';

/** Endpoints publics : pas de jeton envoyé, une 401 n'y signifie pas « session expirée ». */
export const PUBLIC_AUTH_URLS = [
  `${AUTH_URL}/connexion`,
  `${AUTH_URL}/mot-de-passe-oublie`,
  `${AUTH_URL}/reinitialisation`,
  '/api/contexte',
  '/api/maintenance/etat',
];

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(StorageService);
  private readonly rights = inject(RightsService);

  readonly user = signal<Utilisateur | null>(null);
  readonly isAuthenticated = computed(() => this.user() !== null);
  /** Le compte doit choisir un nouveau mot de passe avant tout autre écran (RG-AUT-05). */
  readonly mustChangePassword = computed(() => this.user()?.motDePasseTemporaire === true);

  token(): string | null {
    return this.storage.session.get(STORAGE_KEYS.jeton);
  }

  login(credentials: ConnexionRequete): Observable<Utilisateur> {
    return this.http.post<ConnexionReponse>(`${AUTH_URL}/connexion`, credentials).pipe(
      tap((reponse) => {
        this.storage.session.set(STORAGE_KEYS.jeton, reponse.accessToken);
        this.user.set(reponse.utilisateur);
      }),
      map((reponse) => reponse.utilisateur),
    );
  }

  /**
   * Au rechargement : relit l'utilisateur du jeton mémorisé. Un jeton refusé (401) est oublié ; pendant une
   * maintenance (503) il est gardé, pour retrouver l'accès dès la réactivation (RG-MNT-03).
   */
  restoreSession(): Observable<Utilisateur | null> {
    if (!this.token()) {
      return of(null);
    }
    return this.http.get<Utilisateur>(`${AUTH_URL}/moi`).pipe(
      tap((utilisateur) => this.user.set(utilisateur)),
      catchError((err: unknown) => {
        if (!(err instanceof HttpErrorResponse) || err.status === 401) {
          this.logout();
        }
        return of(null);
      }),
    );
  }

  logout(): void {
    this.storage.session.remove(STORAGE_KEYS.jeton);
    this.user.set(null);
    this.rights.clear();
  }

  /** 403 `MOT_DE_PASSE_TEMPORAIRE` reçu : le compte doit changer de mot de passe. */
  markTemporaryPassword(): void {
    this.user.update((user) => (user ? { ...user, motDePasseTemporaire: true } : user));
  }

  /** Après le changement, le mot de passe n'est plus temporaire (RG-AUT-05). */
  changePassword(body: ChangementMotDePasse): Observable<void> {
    return this.http.put<void>(`${AUTH_URL}/mot-de-passe`, body).pipe(
      tap(() => this.user.update((user) => (user ? { ...user, motDePasseTemporaire: false } : user))),
    );
  }

  /** `identifiant` : le login, ou l'adresse e-mail du compte (RG-AUT-02). Réponse 202 dans tous les cas. */
  forgotPassword(identifiant: string): Observable<void> {
    return this.http.post<void>(`${AUTH_URL}/mot-de-passe-oublie`, { identifiant });
  }

  resetPassword(body: ReinitialisationMotDePasse): Observable<void> {
    return this.http.post<void>(`${AUTH_URL}/reinitialisation`, body);
  }
}
