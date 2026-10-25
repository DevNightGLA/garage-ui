import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';
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
];

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(StorageService);

  readonly user = signal<Utilisateur | null>(null);
  readonly isAuthenticated = computed(() => this.user() !== null);

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

  /** Au rechargement : relit l'utilisateur du jeton mémorisé ; un jeton refusé est oublié. */
  restoreSession(): Observable<Utilisateur | null> {
    if (!this.token()) {
      return of(null);
    }
    return this.http.get<Utilisateur>(`${AUTH_URL}/moi`).pipe(
      tap((utilisateur) => this.user.set(utilisateur)),
      catchError(() => {
        this.logout();
        return of(null);
      }),
    );
  }

  logout(): void {
    this.storage.session.remove(STORAGE_KEYS.jeton);
    this.user.set(null);
  }

  changePassword(body: ChangementMotDePasse): Observable<void> {
    return this.http.put<void>(`${AUTH_URL}/mot-de-passe`, body);
  }

  forgotPassword(email: string): Observable<void> {
    return this.http.post<void>(`${AUTH_URL}/mot-de-passe-oublie`, { email });
  }

  resetPassword(body: ReinitialisationMotDePasse): Observable<void> {
    return this.http.post<void>(`${AUTH_URL}/reinitialisation`, body);
  }
}
