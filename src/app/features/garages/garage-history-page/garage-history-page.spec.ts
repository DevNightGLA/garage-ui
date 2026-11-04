import { HttpRequest, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { garage, libre, loyer, pageOf } from '../../../../testing/garage-fixtures';
import { signInAs } from '../../../../testing/rights';
import { provideTestTranslations } from '../../../../testing/translations';
import { GarageHistoryPage } from './garage-history-page';

@Component({ template: '' })
class Empty {}

describe('GarageHistoryPage', () => {
  let harness: RouterTestingHarness;
  let http: HttpTestingController;
  let root: HTMLElement;

  const isGarages = (req: HttpRequest<unknown>) => req.url === '/api/garages';
  const isLoyers = (id: number) => (req: HttpRequest<unknown>) => req.url === `/api/garages/${id}/loyers`;
  const isLocations = (id: number) => (req: HttpRequest<unknown>) => req.url === `/api/garages/${id}/locations`;
  /** Pas de `whenStable` : une requête simulée encore ouverte le bloquerait. */
  const text = (el: Element) => el.textContent!.replace(/\s+/g, ' ').trim();
  const settle = async () => {
    for (let i = 0; i < 3; i++) {
      await new Promise((resolve) => setTimeout(resolve));
      harness.detectChanges();
    }
  };

  const open = async (url: string, role: 'ADMIN' | 'CONSULTANT' | 'LOCATAIRE' = 'ADMIN') => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'historique-loyers', component: GarageHistoryPage, data: { vue: 'loyers' } },
          { path: 'historique-locations', component: GarageHistoryPage, data: { vue: 'locations' } },
          { path: '**', component: Empty },
        ]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTestTranslations(),
      ],
    });
    signInAs(role);
    http = TestBed.inject(HttpTestingController);
    harness = await RouterTestingHarness.create();
    void harness.navigateByUrl(url);
    await settle();
    root = harness.fixture.nativeElement as HTMLElement;
  };

  afterEach(() => http.verify());

  it('liste tous les garages (loyer par mois, statut) et choisit le premier (RG-GAR-42)', async () => {
    await open('/historique-loyers');
    const list = http.expectOne(isGarages);
    expect(list.request.params.get('size')).toBe('100');
    expect(list.request.params.getAll('sort')).toEqual(['numero,asc']);
    list.flush(pageOf([garage({ adresse: 'Rue des Tilleuls 12' }), libre({ loyerCourant: null })]));
    await settle();
    http.expectOne(isLoyers(1)).flush(pageOf([loyer()]));
    await settle();

    const picks = Array.from(root.querySelectorAll('.pick'));
    expect(picks.map((p) => text(p.querySelector('.pick__title')!))).toEqual(['90,00 €/mois', 'Aucun loyer']);
    expect(picks[0].classList.contains('is-selected')).toBe(true);
    expect(root.querySelector('.gh__numero')!.textContent).toContain('G01');
    expect(root.querySelector('.gh__numero')!.textContent).toContain('Rue des Tilleuls 12');
    const tiles = Array.from(root.querySelectorAll('app-stat-tiles .st__value')).map(text);
    expect(tiles).toEqual(['90,00 €', 'MD Marie Dupont']);
    expect(root.querySelector('.panel__title')!.textContent).toContain('Historique des loyers');
  });

  it('le garage choisi passe dans l\'adresse et son historique se charge', async () => {
    await open('/historique-loyers?garage=2');
    http.expectOne(isGarages).flush(pageOf([garage(), libre()]));
    await settle();
    http.expectOne(isLoyers(2)).flush(pageOf([loyer({ id: 9 })]));
    await settle();
    expect(root.querySelector('.pick.is-selected .pick__badge')!.textContent).toBe('G02');

    (root.querySelectorAll<HTMLButtonElement>('.pick')[0]).click();
    await settle();
    expect(TestBed.inject(Router).url).toBe('/historique-loyers?garage=1');
    http.expectOne(isLoyers(1)).flush(pageOf([]));
    await settle();
  });

  it('historique des locations : tuile « Clés / réserve » et liste des locations du garage (RG-GAR-43)', async () => {
    await open('/historique-locations');
    http.expectOne(isGarages).flush(pageOf([garage()]));
    await settle();
    http.expectOne(isLocations(1)).flush(pageOf([]));
    await settle();
    const labels = Array.from(root.querySelectorAll('app-stat-tiles .st__label')).map((t) => t.textContent!.trim());
    expect(labels).toEqual(['Loyer actuel', 'Locataire actuel', 'Clés / réserve']);
    expect(root.textContent).toContain("Ce garage n'a jamais été loué.");
  });

  it('Consultant : pas de bouton « Nouveau loyer »', async () => {
    await open('/historique-loyers', 'CONSULTANT');
    http.expectOne(isGarages).flush(pageOf([garage()]));
    await settle();
    http.expectOne(isLoyers(1)).flush(pageOf([loyer()]));
    await settle();
    expect(root.querySelector('.panel__head .btn--primary')).toBeNull();
  });

  it('sans garage : message, pas d\'historique', async () => {
    await open('/historique-loyers', 'LOCATAIRE');
    http.expectOne(isGarages).flush(pageOf([]));
    await settle();
    expect(root.querySelector('.gh__state')!.textContent).toContain('Aucun garage.');
    expect(root.querySelector('app-loyers-history')).toBeNull();
  });
});
