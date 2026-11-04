import { HttpRequest, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { pageOf } from '../../../../testing/garage-fixtures';
import { COMPTEURS_LOCATAIRES, locataire, locataireAJour, locataireAncien } from '../../../../testing/locataire-fixtures';
import { signInAs } from '../../../../testing/rights';
import { provideTestTranslations } from '../../../../testing/translations';
import { Chronologie, Evenement } from '../chronologie.models';
import { ChronologiePage } from './chronologie-page';

@Component({ template: '' })
class Empty {}

const evenement = (over: Partial<Evenement> = {}): Evenement => ({
  type: 'PAIEMENT',
  categorie: 'PAIEMENTS',
  dateHeure: '2026-10-02T00:00:00',
  titre: 'Paiement reçu',
  pastille: 'virement',
  montant: 90,
  description: 'Loyer de octobre 2026, garage G01.',
  aVenir: false,
  ...over,
});

const chronologie = (events: Evenement[], total = events.length): Chronologie => ({
  locataire: locataire(),
  nbLocations: 2,
  totalVerse: 450,
  remarquesOuvertes: 1,
  compteurs: { TOUS: total, LOCATIONS: 1, REMARQUES: 1, PAIEMENTS: total - 2 },
  evenements: pageOf(events, total),
});

describe('ChronologiePage', () => {
  let harness: RouterTestingHarness;
  let http: HttpTestingController;
  let root: HTMLElement;

  const isTenants = (req: HttpRequest<unknown>) => req.url === '/api/locataires';
  const isCounters = (req: HttpRequest<unknown>) => req.url === '/api/locataires/compteurs';
  const isChrono = (id: number) => (req: HttpRequest<unknown>) => req.url === `/api/locataires/${id}/chronologie`;
  const text = (el: Element | null) => el!.textContent!.replace(/\s+/g, ' ').trim();
  const settle = async () => {
    for (let i = 0; i < 3; i++) {
      await new Promise((resolve) => setTimeout(resolve));
      harness.detectChanges();
    }
  };

  const open = async (url = '/chronologie', tenants = [locataireAJour({ id: 2 }), locataire(), locataireAncien()]) => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'chronologie', component: ChronologiePage },
          { path: '**', component: Empty },
        ]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTestTranslations(),
      ],
    });
    signInAs('GESTIONNAIRE');
    http = TestBed.inject(HttpTestingController);
    harness = await RouterTestingHarness.create();
    void harness.navigateByUrl(url);
    await settle();
    root = harness.fixture.nativeElement as HTMLElement;
    const list = http.expectOne(isTenants);
    http.expectOne(isCounters).flush(COMPTEURS_LOCATAIRES);
    list.flush(pageOf(tenants));
    await settle();
    return list.request;
  };

  afterEach(() => http.verify());

  it('liste les locataires actuels triés par nom, actuels d\'abord, avec garage et solde (RG-CHR-01)', async () => {
    const request = await open();
    expect(request.params.get('statut')).toBe('ACTUEL');
    expect(request.params.getAll('sort')).toEqual(['locataire,asc']);
    http.expectOne(isChrono(2)).flush(chronologie([]));
    await settle();
    const titles = Array.from(root.querySelectorAll('.pick__title')).map(text);
    expect(titles).toEqual(['Jan Peeters', 'Marie Dupont', 'Nathalie Claes']);
    expect(text(root.querySelector('.pick__sub'))).toBe('Garage G02 · À jour');
    expect(root.querySelectorAll('.pick')[2].querySelector('.pick__badge.is-ancien')).not.toBeNull();
    expect(text(root.querySelector('app-pick-list app-filter-buttons'))).toContain('Actifs (6)');
  });

  it('en-tête, indicateurs et événements du locataire choisi (RG-CHR-02, 03)', async () => {
    await open('/chronologie?locataire=1');
    const request = http.expectOne(isChrono(1));
    expect(request.request.params.get('filtre')).toBe('TOUS');
    expect(request.request.params.get('size')).toBe('10');
    request.flush(
      chronologie([
        evenement(),
        evenement({ type: 'REMARQUE', categorie: 'REMARQUES', dateHeure: '2026-09-15T14:05:00', pastille: 'probleme', montant: null, description: '<p>Porte <b>bloquée</b></p>' }),
        evenement({ type: 'LOCATION_FIN', categorie: 'LOCATIONS', dateHeure: '2026-12-31T00:00:00', pastille: 'G01', montant: null, description: 'Garage G01.', aVenir: true }),
      ]),
    );
    await settle();
    expect(text(root.querySelector('.ch__name'))).toBe('Mme Marie Dupont');
    expect(text(root.querySelector('.ch__solde'))).toBe('En retard');
    expect(Array.from(root.querySelectorAll('app-stat-tiles .st__value')).map(text)).toEqual(['2', '450,00 €', '1']);
    const items = Array.from(root.querySelectorAll('.tl__item'));
    expect(text(items[0].querySelector('.tl__title'))).toBe('Paiement reçu');
    expect(text(items[0].querySelector('.tl__amount'))).toBe('90,00 €');
    expect(text(items[1].querySelector('.tl__date'))).toBe('15/09/2026 · 14:05');
    expect(items[1].querySelector('.ct__text b')!.textContent).toBe('bloquée');
    expect(text(items[2].querySelector('.tl__title'))).toBe('Fin de location prévue');
    expect(text(items[2])).toContain('À venir');
  });

  it('« Afficher plus » charge 10 événements de plus ; un filtre repart du premier lot', async () => {
    await open('/chronologie?locataire=1');
    http.expectOne(isChrono(1)).flush(chronologie(Array.from({ length: 10 }, (_, i) => evenement({ dateHeure: `2026-0${(i % 9) + 1}-01T00:00:00` })), 14));
    await settle();
    const more = root.querySelector<HTMLButtonElement>('.tl__more button')!;
    expect(text(more)).toBe('Afficher plus (4)');
    more.click();
    await settle();
    expect(http.expectOne(isChrono(1)).request.params.get('size')).toBe('20');

    const filters = root.querySelectorAll<HTMLButtonElement>('.panel__actions app-filter-buttons button');
    filters[3].click();
    await settle();
    const request = http.expectOne(isChrono(1)).request;
    expect(request.params.get('filtre')).toBe('PAIEMENTS');
    expect(request.params.get('size')).toBe('10');
  });

  it('choisir un autre locataire met son identifiant dans l\'adresse', async () => {
    await open();
    http.expectOne(isChrono(2)).flush(chronologie([]));
    await settle();
    root.querySelectorAll<HTMLButtonElement>('.pick')[1].click();
    await settle();
    expect(TestBed.inject(Router).url).toBe('/chronologie?locataire=1');
    http.expectOne(isChrono(1)).flush(chronologie([]));
    await settle();
    expect(text(root.querySelector('.tl__empty'))).toBe('Aucun événement.');
  });
});
