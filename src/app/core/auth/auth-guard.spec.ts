import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { Observable, firstValueFrom } from 'rxjs';
import { defaultDroits, signInAs, testUser } from '../../../testing/rights';
import { DeviceService } from '../device-service';
import { RightsService } from '../rights/rights-service';
import { homeGuard, screenGuard } from '../rights/screen-guard';
import { authGuard, guestGuard, safeReturnUrl, temporaryPasswordGuard } from './auth-guard';
import { AuthService } from './auth-service';

describe('guards', () => {
  let auth: AuthService;
  let router: Router;

  const run = (guard: CanActivateFn, url = '/garages') =>
    TestBed.runInInjectionContext(() => guard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot));
  const url = (result: unknown) => router.serializeUrl(result as UrlTree);

  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] });
    auth = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  describe('authGuard', () => {
    it('laisse passer un utilisateur connecté dont les droits sont chargés', () => {
      signInAs('CONSULTANT');
      expect(run(authGuard)).toBe(true);
    });

    it('charge les droits avant la première page', async () => {
      auth.user.set(testUser('GESTIONNAIRE'));
      const result = run(authGuard) as Observable<boolean>;
      const done = firstValueFrom(result);
      TestBed.inject(HttpTestingController).expectOne('/api/droits/moi').flush(defaultDroits('GESTIONNAIRE'));
      expect(await done).toBe(true);
      expect(TestBed.inject(RightsService).can('GAR', 'd')).toBe(true);
    });

    it('renvoie à la connexion en mémorisant la page demandée', () => {
      expect(url(run(authGuard, '/locations?statut=ACTIVE'))).toBe('/connexion?retour=%2Flocations%3Fstatut%3DACTIVE');
    });

    it('impose le changement d\'un mot de passe temporaire avant tout écran (RG-AUT-05)', () => {
      signInAs('CONSULTANT', { motDePasseTemporaire: true });
      expect(url(run(authGuard))).toBe('/mot-de-passe-temporaire');
    });
  });

  describe('temporaryPasswordGuard', () => {
    it('n\'ouvre l\'écran qu\'à un compte au mot de passe temporaire', () => {
      expect(url(run(temporaryPasswordGuard))).toBe('/connexion');
      signInAs('ADMIN');
      expect(url(run(temporaryPasswordGuard))).toBe('/');
      signInAs('ADMIN', { motDePasseTemporaire: true });
      expect(run(temporaryPasswordGuard)).toBe(true);
    });
  });

  describe('guestGuard', () => {
    it('laisse passer un visiteur', () => {
      expect(run(guestGuard)).toBe(true);
    });

    it('renvoie un utilisateur connecté à l\'application', () => {
      signInAs('ADMIN');
      expect(url(run(guestGuard))).toBe('/');
    });
  });

  describe('screenGuard', () => {
    it('ouvre un écran au droit « voir »', () => {
      signInAs('CONSULTANT');
      expect(run(screenGuard('GAR'))).toBe(true);
    });

    it('sans droit « voir », redirige vers le premier écran autorisé (RG-NAV-01)', () => {
      signInAs('LOCATAIRE');
      expect(url(run(screenGuard('DASH')))).toBe('/garages');
      signInAs('GESTIONNAIRE');
      expect(url(run(screenGuard('USR')))).toBe('/tableau-de-bord');
    });

    it('écran retiré pour cet appareil : page d\'explication (RG-APP-04)', () => {
      signInAs('ADMIN');
      TestBed.inject(DeviceService).mode.set('SMARTPHONE');
      expect(url(run(screenGuard('USR')))).toBe('/ecran-indisponible?ecran=USR');
      expect(run(screenGuard('DRO'))).toBe(true);
      expect(run(screenGuard('GAR'))).toBe(true);
    });
  });
});

describe('homeGuard', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] });
  });

  const run = () => TestBed.runInInjectionContext(() => homeGuard({} as ActivatedRouteSnapshot, { url: '/' } as RouterStateSnapshot));

  it('attend les droits avant de choisir la page d\'accueil (pas d\'« Accès refusé » à la connexion)', async () => {
    TestBed.inject(AuthService).user.set(testUser('LOCATAIRE'));
    const done = firstValueFrom(run() as Observable<UrlTree>);
    TestBed.inject(HttpTestingController).expectOne('/api/droits/moi').flush(defaultDroits('LOCATAIRE'));
    expect(TestBed.inject(Router).serializeUrl(await done)).toBe('/garages');
  });

  it('reprend la dernière page visitée, y compris une sous-page', async () => {
    signInAs('ADMIN');
    localStorage.setItem('gg-page', 'statistiques/repartition');
    const url = await firstValueFrom(run() as Observable<UrlTree>);
    expect(TestBed.inject(Router).serializeUrl(url)).toBe('/statistiques/repartition');
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
