import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideTestTranslations } from '../../testing/translations';
import { signInAs } from '../../testing/rights';
import { AuthService } from '../core/auth/auth-service';
import { Role, Utilisateur } from '../core/auth/auth.models';
import { LanguageService } from '../core/language-service';
import { Shell } from './shell';
import { displayName, initials, userInitials } from './sidebar';

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

describe('displayName et userInitials', () => {
  const base: Utilisateur = { id: 1, login: 'marie.dupont', prenom: '', nom: '', email: 'm@e.c', role: 'GESTIONNAIRE', actif: true };

  it('affiche « Prénom Nom » et leurs initiales', () => {
    const user = { ...base, prenom: 'Marie', nom: 'Dupont' };
    expect(displayName(user)).toBe('Marie Dupont');
    expect(userInitials(user)).toBe('MD');
  });

  it('retombe sur le login quand le compte n\'a ni prénom ni nom', () => {
    expect(displayName(base)).toBe('marie.dupont');
    expect(displayName({ ...base, prenom: ' ', nom: '' })).toBe('marie.dupont');
    expect(userInitials(base)).toBe('MD');
  });

  it('se contente de ce qui est renseigné', () => {
    expect(displayName({ ...base, nom: 'Dupont' })).toBe('Dupont');
    expect(userInitials({ ...base, nom: 'dupont' })).toBe('D');
  });
});

describe('Shell', () => {
  let harness: RouterTestingHarness;
  let router: Router;
  let auth: AuthService;
  let root: HTMLElement;
  let http: HttpTestingController;

  const open = async (url: string, role: Role = 'GESTIONNAIRE') => {
    signInAs(role, { login: 'marie.dupont', prenom: '', nom: '', email: 'marie@example.com' });
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
              { path: 'garages', component: Page, data: { titleKey: 'nav.garages', groupKey: null } },
              { path: 'locataires', component: Page, data: { titleKey: 'nav.locataires', groupKey: null } },
              { path: 'historique-loyers', component: Page, data: { titleKey: 'nav.historiqueLoyers', groupKey: 'nav.garages' } },
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
    await harness.navigateByUrl('/historique-loyers');
    expect(root.querySelector('.shell__crumb')!.textContent).toBe('Pages / Garages / Historique des loyers');
    expect(root.querySelector('.shell__title')!.textContent).toBe('Historique des loyers');
  });

  it('affiche l\'utilisateur et son rôle en pied de menu, pas dans l\'en-tête', async () => {
    await open('/garages', 'CONSULTANT');
    expect(root.querySelector('.shell__head')!.textContent).not.toContain('Consultant');
    expect(root.querySelector('.sb__avatar')!.textContent).toBe('MD');
    expect(root.querySelector('.sb__who')!.textContent).toContain('marie.dupont');
    expect(root.querySelector('.sb__who')!.textContent).toContain('Consultant');
  });

  it('affiche le prénom et le nom de l\'utilisateur dans le menu plutôt que son login', async () => {
    await open('/garages');
    auth.user.set({ ...auth.user()!, prenom: 'Marie', nom: 'Dupont' });
    harness.detectChanges();
    expect(root.querySelector('.sb__avatar')!.textContent).toBe('MD');
    expect(root.querySelector('.sb__who b')!.textContent).toBe('Marie Dupont');
    expect(root.querySelector('.sb__who')!.textContent).not.toContain('marie.dupont');
  });

  const topLabels = () =>
    Array.from(root.querySelectorAll<HTMLElement>('.sb__nav > ul > li > .sb__link .sb__label')).map((l) => l.textContent!.trim());
  const kidLabels = () => Array.from(root.querySelectorAll<HTMLElement>('.sb__kid-label')).map((l) => l.textContent!.trim());

  it('Gestionnaire : menu de la maquette sans Configuration, page active marquée (RG-NAV-01, RG-DRO-03)', async () => {
    await open('/garages');
    expect(topLabels()).toEqual(['Tableau de bord', 'Garages', 'Locataires', 'Locations', 'Paiements', 'Envoi de messages', 'Statistiques']);
    expect(kidLabels().slice(0, 5)).toEqual([
      'Liste des garages',
      'Historique des loyers',
      'Historique des locations',
      'Liste des locataires',
      'Chronologie',
    ]);
    const active = Array.from(root.querySelectorAll('.sb__kid.is-active')).map((l) => l.textContent!.trim());
    expect(active).toEqual(['Liste des garages']);
  });

  it('Admin : la section Configuration apparaît, avec ses six écrans', async () => {
    await open('/garages', 'ADMIN');
    expect(topLabels().at(-1)).toBe('Configuration');
    expect(kidLabels().slice(-6)).toEqual([
      'Paramètres',
      'Modèles de messages',
      'Utilisateurs',
      'Droits d’accès',
      'Journal d’audit',
      'Maintenance',
    ]);
  });

  it('Locataire : seulement ses écrans, un groupe sans page visible disparaît (RG-DRO-05)', async () => {
    await open('/garages', 'LOCATAIRE');
    expect(topLabels()).toEqual(['Garages', 'Locations', 'Paiements']);
    expect(kidLabels()).toEqual(['Liste des garages', 'Historique des loyers', 'Historique des locations']);
  });

  it('un groupe se replie et se déplie au clic', async () => {
    await open('/garages');
    const group = root.querySelector<HTMLElement>('.sb__group')!;
    const toggle = group.querySelector<HTMLButtonElement>('.sb__toggle')!;
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    toggle.click();
    harness.detectChanges();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(group.classList.contains('is-open')).toBe(false);
    toggle.click();
    harness.detectChanges();
    expect(group.classList.contains('is-open')).toBe(true);
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
