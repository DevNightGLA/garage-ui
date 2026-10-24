import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth-service';
import { Utilisateur } from './auth.models';

const admin: Utilisateur = { id: 1, login: 'admin', email: 'admin@example.com', role: 'ADMIN', actif: true };

describe('AuthService', () => {
  let auth: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('connecte l\'utilisateur et mémorise le jeton pour la session du navigateur', () => {
    let result: Utilisateur | undefined;
    auth.login({ login: 'admin', motDePasse: 'Garages2026!' }).subscribe((u) => (result = u));

    const request = http.expectOne('/api/auth/connexion');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ login: 'admin', motDePasse: 'Garages2026!' });
    request.flush({ accessToken: 'jeton-1', tokenType: 'Bearer', expiresIn: 28800, utilisateur: admin });

    expect(result).toEqual(admin);
    expect(auth.user()).toEqual(admin);
    expect(auth.isAuthenticated()).toBe(true);
    expect(auth.token()).toBe('jeton-1');
    expect(sessionStorage.getItem('gg-token')).toBe('jeton-1');
    expect(localStorage.getItem('gg-token')).toBeNull();
  });

  it('laisse l\'utilisateur déconnecté quand les identifiants sont refusés', () => {
    let status = 0;
    auth.login({ login: 'admin', motDePasse: 'x' }).subscribe({ error: (e) => (status = e.status) });
    http
      .expectOne('/api/auth/connexion')
      .flush({ code: 'AUTH_IDENTIFIANTS_INVALIDES', message: 'Login ou mot de passe incorrect.', details: [] }, { status: 401, statusText: 'Unauthorized' });
    expect(status).toBe(401);
    expect(auth.isAuthenticated()).toBe(false);
    expect(auth.token()).toBeNull();
  });

  it('restaure la session au rechargement avec le jeton mémorisé', () => {
    sessionStorage.setItem('gg-token', 'jeton-1');
    let result: Utilisateur | null | undefined;
    auth.restoreSession().subscribe((u) => (result = u));
    http.expectOne('/api/auth/moi').flush(admin);
    expect(result).toEqual(admin);
    expect(auth.user()).toEqual(admin);
  });

  it('ne fait aucun appel sans jeton mémorisé', () => {
    let result: Utilisateur | null | undefined;
    auth.restoreSession().subscribe((u) => (result = u));
    http.expectNone('/api/auth/moi');
    expect(result).toBeNull();
    expect(auth.isAuthenticated()).toBe(false);
  });

  it('oublie un jeton refusé par l\'API', () => {
    sessionStorage.setItem('gg-token', 'expire');
    let result: Utilisateur | null | undefined;
    auth.restoreSession().subscribe((u) => (result = u));
    http.expectOne('/api/auth/moi').flush({ code: 'NON_AUTHENTIFIE' }, { status: 401, statusText: 'Unauthorized' });
    expect(result).toBeNull();
    expect(auth.token()).toBeNull();
    expect(auth.isAuthenticated()).toBe(false);
  });

  it('déconnecte en effaçant le jeton et l\'utilisateur', () => {
    sessionStorage.setItem('gg-token', 'jeton-1');
    auth.user.set(admin);
    auth.logout();
    expect(auth.user()).toBeNull();
    expect(auth.token()).toBeNull();
    expect(sessionStorage.getItem('gg-token')).toBeNull();
  });

  it('change le mot de passe', () => {
    auth.changePassword({ motDePasseActuel: 'ancien', nouveauMotDePasse: 'nouveau-1' }).subscribe();
    const request = http.expectOne('/api/auth/mot-de-passe');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ motDePasseActuel: 'ancien', nouveauMotDePasse: 'nouveau-1' });
    request.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('demande un lien de réinitialisation par e-mail', () => {
    auth.forgotPassword('marie@example.com').subscribe();
    const request = http.expectOne('/api/auth/mot-de-passe-oublie');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ email: 'marie@example.com' });
    request.flush(null, { status: 202, statusText: 'Accepted' });
  });

  it('réinitialise le mot de passe avec le jeton du lien', () => {
    auth.resetPassword({ jeton: 'abc', nouveauMotDePasse: 'nouveau-1' }).subscribe();
    const request = http.expectOne('/api/auth/reinitialisation');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ jeton: 'abc', nouveauMotDePasse: 'nouveau-1' });
    request.flush(null, { status: 204, statusText: 'No Content' });
  });
});
