import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideTestTranslations } from '../../../testing/translations';
import { AuthService } from '../auth/auth-service';
import { Role } from '../auth/auth.models';
import { LanguageService } from '../language-service';
import { Shell } from './shell';
import { initials } from './sidebar';

@Component({ template: `<p id="page">Page</p>` })
class Page {}

describe('initials', () => {
  it.each([
    ['admin', 'AD'],
    ['marie.dupont', 'MD'],
    ['jean-pierre_martin', 'JP'],
    ['x', 'X'],
    ['', ''],
  ])('%s → %s', (login, expected) => {
    expect(initials(login)).toBe(expected);
  });
});

describe('Shell', () => {
  let harness: RouterTestingHarness;
  let router: Router;
  let auth: AuthService;
  let root: HTMLElement;
  let http: HttpTestingController;

  const open = async (url: string, role: Role = 'GESTIONNAIRE') => {
    auth.user.set({ id: 1, login: 'marie.dupont', email: 'marie@example.com', role, actif: true });
    await harness.navigateByUrl(url);
    root = harness.routeNativeElement!.closest('app-shell')! as HTMLElement;
    root = (harness.fixture.nativeElement as HTMLElement).querySelector('app-shell')!;
  };

  beforeEach(async () => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: '',
            component: Shell,
            children: [
              { path: 'garages', component: Page, data: { titleKey: 'nav.garages' } },
              { path: 'locataires', component: Page, data: { titleKey: 'nav.locataires' } },
              { path: 'connexion', component: Page },
            ],
          },
        ]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTestTranslations(),
      ],
    });
    harness = await RouterTestingHarness.create();
    router = TestBed.inject(Router);
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    vi.spyOn(router, 'navigate');
  });

  afterEach(() => http.verify());

  it('affiche le fil d\'Ariane et le titre de la page active', async () => {
    await open('/garages');
    expect(root.querySelector('.shell__crumb')!.textContent).toBe('Pages / Garages');
    expect(root.querySelector('.shell__title')!.textContent).toBe('Garages');
    await harness.navigateByUrl('/locataires');
    expect(root.querySelector('.shell__title')!.textContent).toBe('Locataires');
    expect(root.querySelector('#page')).not.toBeNull();
  });

  it('affiche l\'utilisateur et son rôle en pied de menu, pas dans l\'en-tête', async () => {
    await open('/garages', 'LECTURE_SEULE');
    expect(root.querySelector('.shell__head')!.textContent).not.toContain('Lecture seule');
    expect(root.querySelector('.sb__avatar')!.textContent).toBe('MD');
    expect(root.querySelector('.sb__who')!.textContent).toContain('marie.dupont');
    expect(root.querySelector('.sb__who')!.textContent).toContain('Lecture seule');
  });

  it('propose les cinq écrans du menu et marque la page active', async () => {
    await open('/garages');
    const links = Array.from(root.querySelectorAll<HTMLAnchorElement>('.sb__link'));
    expect(links.map((l) => l.textContent!.trim())).toEqual([
      'Tableau de bord',
      'Garages',
      'Locataires',
      'Locations',
      'Paiements',
    ]);
    expect(links.filter((l) => l.classList.contains('is-active')).map((l) => l.textContent!.trim())).toEqual(['Garages']);
  });

  it('mémorise la dernière page visitée', async () => {
    await open('/locataires');
    expect(localStorage.getItem('gg-page')).toBe('locataires');
    await harness.navigateByUrl('/garages');
    expect(localStorage.getItem('gg-page')).toBe('garages');
  });

  it('replie et déplie le menu en mémorisant l\'état', async () => {
    await open('/garages');
    const sidebar = root.querySelector('app-sidebar')!;
    const burger = root.querySelector<HTMLButtonElement>('.shell__burger')!;
    expect(sidebar.classList.contains('is-collapsed')).toBe(false);

    burger.click();
    await harness.fixture.whenStable();
    expect(sidebar.classList.contains('is-collapsed')).toBe(true);
    expect(localStorage.getItem('gg-menu-replie')).toBe('1');

    burger.click();
    await harness.fixture.whenStable();
    expect(sidebar.classList.contains('is-collapsed')).toBe(false);
    expect(localStorage.getItem('gg-menu-replie')).toBe('0');
  });

  it('change de langue depuis l\'en-tête', async () => {
    await open('/garages');
    const [fr, en] = Array.from(root.querySelectorAll<HTMLButtonElement>('.ls__btn'));
    expect(fr.classList.contains('is-active')).toBe(true);
    en.click();
    await harness.fixture.whenStable();
    expect(TestBed.inject(LanguageService).lang()).toBe('en');
    expect(en.classList.contains('is-active')).toBe(true);
    expect(localStorage.getItem('gg-lang')).toBe('en');
  });

  it('ouvre la fenêtre de changement de mot de passe', async () => {
    await open('/garages');
    const actions = Array.from(root.querySelectorAll<HTMLButtonElement>('.sb__action'));
    actions[0].click();
    await harness.fixture.whenStable();
    expect(root.querySelector('app-change-password .modal__title')!.textContent).toBe('Modifier mon mot de passe');

    root.querySelector<HTMLButtonElement>('app-change-password .modal__close')!.click();
    await harness.fixture.whenStable();
    expect(root.querySelector('app-change-password')).toBeNull();
  });

  it('demande confirmation avant de déconnecter, puis revient à la connexion', async () => {
    await open('/garages');
    sessionStorage.setItem('gg-token', 'jeton-1');
    const actions = Array.from(root.querySelectorAll<HTMLButtonElement>('.sb__action'));

    actions[1].click();
    await harness.fixture.whenStable();
    expect(root.querySelector('app-confirm .modal__title')!.textContent).toBe('Se déconnecter ?');
    root.querySelector<HTMLButtonElement>('app-confirm .btn--secondary')!.click();
    await harness.fixture.whenStable();
    expect(root.querySelector('app-confirm')).toBeNull();
    expect(auth.isAuthenticated()).toBe(true);

    actions[1].click();
    await harness.fixture.whenStable();
    root.querySelector<HTMLButtonElement>('app-confirm .btn--primary')!.click();
    await harness.fixture.whenStable();
    expect(auth.isAuthenticated()).toBe(false);
    expect(sessionStorage.getItem('gg-token')).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/connexion'], { queryParams: { raison: 'deconnecte' } });
  });
});
