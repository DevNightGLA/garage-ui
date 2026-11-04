import { provideHttpClient } from '@angular/common/http';
import { signInAs } from '../../testing/rights';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { WIDTH, mockViewport } from '../../testing/match-media';
import { provideTestTranslations } from '../../testing/translations';
import { AuthService } from '../core/auth/auth-service';
import { Shell } from './shell';

@Component({ template: `<p id="page">Page</p>` })
class Page {}

describe('Shell : tablette et smartphone', () => {
  let harness: RouterTestingHarness;
  let root: HTMLElement;
  let media: ReturnType<typeof mockViewport>;

  const sidebar = () => root.querySelector('app-sidebar')!;
  const burger = () => root.querySelector<HTMLButtonElement>('.shell__burger')!;
  const settle = () => harness.fixture.whenStable();
  const click = async (element: Element) => {
    (element as HTMLElement).click();
    await settle();
  };

  const open = async (smallScreen: boolean, collapsedStored = false) => {
    localStorage.clear();
    if (collapsedStored) {
      localStorage.setItem('gg-menu-replie', '1');
    }
    media = mockViewport(smallScreen ? WIDTH.smartphone : WIDTH.ordinateur);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: '',
            component: Shell,
            children: [
              { path: 'garages', component: Page, data: { titleKey: 'nav.garages', groupKey: null } },
              { path: 'locataires', component: Page, data: { titleKey: 'nav.locataires', groupKey: null } },
            ],
          },
        ]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTestTranslations(),
      ],
    });
    signInAs('GESTIONNAIRE');
    harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/garages');
    root = (harness.fixture.nativeElement as HTMLElement).querySelector('app-shell')!;
  };

  afterEach(() => {
    delete (window as { matchMedia?: unknown }).matchMedia;
  });

  it('smartphone : le menu est un tiroir fermé au départ, sans fond sombre', async () => {
    await open(true);
    expect(sidebar().classList.contains('is-open')).toBe(false);
    expect(root.querySelector('.shell__backdrop')).toBeNull();
    expect(burger().getAttribute('aria-expanded')).toBe('false');
  });

  it('smartphone : le bouton ouvre le tiroir avec un fond sombre, un second clic le referme', async () => {
    await open(true);
    await click(burger());
    expect(sidebar().classList.contains('is-open')).toBe(true);
    expect(root.querySelector('.shell__backdrop')).not.toBeNull();
    expect(burger().getAttribute('aria-expanded')).toBe('true');

    await click(burger());
    expect(sidebar().classList.contains('is-open')).toBe(false);
    expect(root.querySelector('.shell__backdrop')).toBeNull();
  });

  it('smartphone : un clic sur le fond sombre ou Échap referme le tiroir', async () => {
    await open(true);
    await click(burger());
    await click(root.querySelector('.shell__backdrop')!);
    expect(sidebar().classList.contains('is-open')).toBe(false);

    await click(burger());
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await settle();
    expect(sidebar().classList.contains('is-open')).toBe(false);
  });

  it('smartphone : choisir une page referme le tiroir', async () => {
    await open(true);
    await click(burger());
    const link = Array.from(root.querySelectorAll<HTMLAnchorElement>('.sb__kid')).find(
      (a) => a.textContent!.trim() === 'Liste des locataires',
    )!;
    await click(link);
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/locataires');
    expect(sidebar().classList.contains('is-open')).toBe(false);
  });

  it('smartphone : ouvrir le mot de passe ou la déconnexion referme le tiroir', async () => {
    await open(true);
    await click(burger());
    await click(root.querySelectorAll<HTMLButtonElement>('.sb__action')[0]);
    expect(sidebar().classList.contains('is-open')).toBe(false);
    expect(root.querySelector('app-change-password')).not.toBeNull();
  });

  it('smartphone : le tiroir montre toujours les libellés, même si le menu est mémorisé replié', async () => {
    await open(true, true);
    expect(sidebar().classList.contains('is-collapsed')).toBe(false);
    await click(burger());
    expect(localStorage.getItem('gg-menu-replie')).toBe('1');
    expect(sidebar().classList.contains('is-collapsed')).toBe(false);
  });

  it('ordinateur : le bouton replie le menu en colonne d\'icônes et mémorise l\'état, sans tiroir', async () => {
    await open(false);
    await click(burger());
    expect(sidebar().classList.contains('is-collapsed')).toBe(true);
    expect(sidebar().classList.contains('is-open')).toBe(false);
    expect(root.querySelector('.shell__backdrop')).toBeNull();
    expect(localStorage.getItem('gg-menu-replie')).toBe('1');
  });

  it('passer sur grand écran referme le tiroir ouvert', async () => {
    await open(true);
    await click(burger());
    expect(sidebar().classList.contains('is-open')).toBe(true);

    media.resize(WIDTH.ordinateur);
    await settle();
    expect(sidebar().classList.contains('is-open')).toBe(false);
    expect(root.querySelector('.shell__backdrop')).toBeNull();
  });

  it('repasser sur petit écran garde le menu replié mémorisé en colonne seulement sur ordinateur', async () => {
    await open(false, true);
    expect(sidebar().classList.contains('is-collapsed')).toBe(true);
    media.resize(WIDTH.smartphone);
    await settle();
    expect(sidebar().classList.contains('is-collapsed')).toBe(false);
    media.resize(WIDTH.ordinateur);
    await settle();
    expect(sidebar().classList.contains('is-collapsed')).toBe(true);
  });

  it('tablette (641 à 1024 px) : le menu est aussi un tiroir (RG-APP-01)', async () => {
    await open(false);
    media.resize(WIDTH.tablette);
    await settle();
    expect(burger().getAttribute('aria-expanded')).toBe('false');
    await click(burger());
    expect(sidebar().classList.contains('is-open')).toBe(true);
  });

  it('smartphone : les écrans de Configuration retirés pour l\'appareil disparaissent du menu, sauf Droits d\'accès (RG-APP-03)', async () => {
    await open(true);
    TestBed.inject(AuthService).user.set(null);
    signInAs('ADMIN');
    await settle();
    const kids = Array.from(root.querySelectorAll('.sb__kid-label')).map((l) => l.textContent!.trim());
    expect(kids).toContain('Droits d’accès');
    expect(kids).not.toContain('Utilisateurs');
    expect(kids).not.toContain('Paramètres');
  });
});
