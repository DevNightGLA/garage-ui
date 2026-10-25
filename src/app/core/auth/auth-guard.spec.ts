import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { authGuard, guestGuard, roleGuard, safeReturnUrl } from './auth-guard';
import { AuthService } from './auth-service';
import { Role } from './auth.models';

describe('guards', () => {
  let auth: AuthService;
  let router: Router;

  const run = (guard: CanActivateFn, url = '/garages') =>
    TestBed.runInInjectionContext(() => guard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot));

  const signIn = (role: Role) => auth.user.set({ id: 1, login: 'u', email: 'u@example.com', role, actif: true });

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    auth = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  describe('authGuard', () => {
    it('laisse passer un utilisateur connecté', () => {
      signIn('LECTURE_SEULE');
      expect(run(authGuard)).toBe(true);
    });

    it('renvoie à la connexion en mémorisant la page demandée', () => {
      const result = run(authGuard, '/locations?statut=ACTIVE') as UrlTree;
      expect(router.serializeUrl(result)).toBe('/connexion?retour=%2Flocations%3Fstatut%3DACTIVE');
    });
  });

  describe('guestGuard', () => {
    it('laisse passer un visiteur', () => {
      expect(run(guestGuard)).toBe(true);
    });

    it('renvoie un utilisateur connecté à l\'application', () => {
      signIn('ADMIN');
      expect(router.serializeUrl(run(guestGuard) as UrlTree)).toBe('/');
    });
  });

  describe('roleGuard', () => {
    it('autorise les rôles demandés', () => {
      signIn('ADMIN');
      expect(run(roleGuard('ADMIN'))).toBe(true);
      expect(run(roleGuard('ADMIN', 'GESTIONNAIRE'))).toBe(true);
    });

    it('refuse un autre rôle ou une absence de session', () => {
      signIn('GESTIONNAIRE');
      expect(router.serializeUrl(run(roleGuard('ADMIN')) as UrlTree)).toBe('/');
      auth.logout();
      expect(router.serializeUrl(run(roleGuard('ADMIN', 'GESTIONNAIRE')) as UrlTree)).toBe('/');
    });
  });
});

describe('safeReturnUrl', () => {
  it('accepte un chemin interne', () => {
    expect(safeReturnUrl('/garages?page=2')).toBe('/garages?page=2');
  });

  it.each([null, undefined, '', 'garages', '//autre-site.example', 'https://autre-site.example/x'])(
    'renvoie à l\'accueil pour %s',
    (url) => {
      expect(safeReturnUrl(url as string | null | undefined)).toBe('/');
    },
  );
});
