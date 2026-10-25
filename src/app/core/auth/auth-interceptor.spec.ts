import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { authInterceptor } from './auth-interceptor';
import { AuthService } from './auth-service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let auth: AuthService;
  let navigate: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });

  afterEach(() => controller.verify());

  it('ajoute le jeton Bearer aux appels de l\'API', () => {
    sessionStorage.setItem('gg-token', 'jeton-1');
    http.get('/api/garages').subscribe();
    const request = controller.expectOne('/api/garages');
    expect(request.request.headers.get('Authorization')).toBe('Bearer jeton-1');
    request.flush([]);
  });

  it('n\'envoie pas de jeton sans session', () => {
    http.get('/api/garages').subscribe();
    const request = controller.expectOne('/api/garages');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush([]);
  });

  it.each(['/api/auth/connexion', '/api/auth/mot-de-passe-oublie', '/api/auth/reinitialisation'])(
    'n\'envoie pas de jeton à l\'endpoint public %s',
    (url) => {
      sessionStorage.setItem('gg-token', 'jeton-1');
      http.post(url, {}).subscribe();
      const request = controller.expectOne(url);
      expect(request.request.headers.has('Authorization')).toBe(false);
      request.flush(null);
    },
  );

  it('n\'ajoute pas le jeton aux autres adresses', () => {
    sessionStorage.setItem('gg-token', 'jeton-1');
    http.get('/assets/i18n/fr.json').subscribe();
    const request = controller.expectOne('/assets/i18n/fr.json');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({});
  });

  it('renvoie vers la connexion quand le jeton est refusé (session expirée)', () => {
    sessionStorage.setItem('gg-token', 'expire');
    auth.user.set({ id: 1, login: 'admin', email: 'a@b.c', role: 'ADMIN', actif: true });
    let status = 0;
    http.get('/api/garages').subscribe({ error: (e) => (status = e.status) });
    controller.expectOne('/api/garages').flush({ code: 'NON_AUTHENTIFIE' }, { status: 401, statusText: 'Unauthorized' });

    expect(status).toBe(401);
    expect(auth.isAuthenticated()).toBe(false);
    expect(auth.token()).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/connexion'], { queryParams: { raison: 'expiree' } });
  });

  it('laisse passer une 401 de la connexion sans déconnecter ni rediriger', () => {
    let code = '';
    http.post('/api/auth/connexion', {}).subscribe({ error: (e) => (code = e.error.code) });
    controller
      .expectOne('/api/auth/connexion')
      .flush({ code: 'AUTH_IDENTIFIANTS_INVALIDES' }, { status: 401, statusText: 'Unauthorized' });
    expect(code).toBe('AUTH_IDENTIFIANTS_INVALIDES');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('laisse passer les autres erreurs (403, 409) sans déconnecter', () => {
    sessionStorage.setItem('gg-token', 'jeton-1');
    auth.user.set({ id: 1, login: 'admin', email: 'a@b.c', role: 'ADMIN', actif: true });
    http.delete('/api/garages/1').subscribe({ error: () => undefined });
    controller.expectOne('/api/garages/1').flush({ code: 'ACCES_REFUSE' }, { status: 403, statusText: 'Forbidden' });
    expect(auth.isAuthenticated()).toBe(true);
    expect(navigate).not.toHaveBeenCalled();
  });
});
