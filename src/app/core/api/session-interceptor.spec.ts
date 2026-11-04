import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { signInAs } from '../../../testing/rights';
import { AuthService } from '../auth/auth-service';
import { sessionInterceptor } from './session-interceptor';

describe('sessionInterceptor', () => {
  let http: HttpTestingController;
  let client: HttpClient;
  let navigate: ReturnType<typeof vi.spyOn>;

  const fail = (status: number, code: string) => {
    let error: unknown;
    client.get('/api/garages').subscribe({ error: (e) => (error = e) });
    http.expectOne('/api/garages').flush({ code, message: 'message', details: [] }, { status, statusText: 'x' });
    return error;
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([sessionInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    client = TestBed.inject(HttpClient);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });

  afterEach(() => http.verify());

  it('503 MAINTENANCE : page « Site en maintenance », l\'erreur continue jusqu\'à l\'écran (RG-MNT-02)', () => {
    signInAs('GESTIONNAIRE');
    expect(fail(503, 'MAINTENANCE')).toBeDefined();
    expect(navigate).toHaveBeenCalledWith(['/', 'site-en-maintenance']);
    expect(TestBed.inject(AuthService).isAuthenticated()).toBe(true);
  });

  it('403 MOT_DE_PASSE_TEMPORAIRE : écran du nouveau mot de passe (RG-AUT-05)', () => {
    signInAs('CONSULTANT');
    fail(403, 'MOT_DE_PASSE_TEMPORAIRE');
    expect(navigate).toHaveBeenCalledWith(['/', 'mot-de-passe-temporaire']);
    expect(TestBed.inject(AuthService).mustChangePassword()).toBe(true);
  });

  it('403 ACCES_REFUSE : relit les droits (un droit a pu changer, RG-DRO-14)', () => {
    signInAs('GESTIONNAIRE');
    fail(403, 'ACCES_REFUSE');
    http.expectOne('/api/droits/moi').flush({ profil: 'GESTIONNAIRE', ecrans: [], appareils: [] });
    expect(navigate).not.toHaveBeenCalled();
  });

  it('laisse passer les autres erreurs sans rien faire', () => {
    signInAs('ADMIN');
    fail(409, 'GAR_NUM_EXISTE');
    fail(503, 'AUTRE');
    expect(navigate).not.toHaveBeenCalled();
  });
});
