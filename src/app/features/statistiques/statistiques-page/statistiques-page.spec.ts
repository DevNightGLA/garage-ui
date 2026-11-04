import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { signInAs } from '../../../../testing/rights';
import { provideTestTranslations } from '../../../../testing/translations';
import { TODAY } from '../../../core/today';
import { BarChart } from '../../../shared/bar-chart/bar-chart';
import { Statistiques } from '../statistiques.models';
import { StatistiquesPage } from './statistiques-page';

@Component({ template: '' })
class Empty {}

const MOIS = (annee: number, n: number) => Array.from({ length: n }, (_, i) => `${annee}-${String(i + 1).padStart(2, '0')}`);

const stats = (over: Partial<Statistiques> = {}): Statistiques => ({
  annee: 2026,
  loyersEncaisses: MOIS(2026, 12).map((mois, i) => ({ mois, montant: i * 10 })),
  totalEncaisse: 660,
  tauxOccupation: MOIS(2026, 10).map((mois) => ({ mois, pourcentage: 58 })),
  repartition: { date: '2026-10-09', loues: 7, libres: 4, indisponibles: 1, total: 12 },
  remarques: { information: 2, probleme: 2, autre: 0, problemesResolus: 1, tauxResolution: 50 },
  anneesDisponibles: [2024, 2025, 2026],
  ...over,
});

describe('StatistiquesPage', () => {
  let harness: RouterTestingHarness;
  let http: HttpTestingController;
  let root: HTMLElement;
  const text = (el: Element | null) => (el?.textContent ?? '').replace(/\s+/g, ' ').trim();
  const settle = async () => {
    for (let i = 0; i < 3; i++) {
      await new Promise((resolve) => setTimeout(resolve));
      harness.detectChanges();
    }
  };

  const open = async (url: string, data: Statistiques = stats()) => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'statistiques/loyers-encaisses', component: StatistiquesPage, data: { vue: 'loyers' } },
          { path: 'statistiques/taux-occupation', component: StatistiquesPage, data: { vue: 'occupation' } },
          { path: 'statistiques/repartition', component: StatistiquesPage, data: { vue: 'repartition' } },
          { path: 'statistiques/remarques', component: StatistiquesPage, data: { vue: 'remarques' } },
          { path: '**', component: Empty },
        ]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTestTranslations(),
        { provide: TODAY, useValue: () => new Date(2026, 9, 9) },
      ],
    }).overrideComponent(BarChart, {
      // jsdom ne dessine pas de canvas : témoin des valeurs reçues
      set: { imports: [], providers: [], template: `<p class="stub">{{ labels().join() }}|{{ values().join() }}</p>` },
    });
    signInAs('GESTIONNAIRE');
    http = TestBed.inject(HttpTestingController);
    harness = await RouterTestingHarness.create();
    void harness.navigateByUrl(url);
    await settle();
    root = harness.fixture.nativeElement as HTMLElement;
    const request = http.expectOne((r) => r.url === '/api/statistiques');
    request.flush(data);
    await settle();
    return request.request;
  };

  afterEach(() => http.verify());

  it('loyers encaissés : 12 mois de l\'année en cours, total dans la légende (RG-STA-01)', async () => {
    const request = await open('/statistiques/loyers-encaisses');
    expect(request.params.get('annee')).toBe('2026');
    expect(text(root.querySelector('.st-card__pill'))).toBe('Loyers encaissés');
    expect(text(root.querySelector('.stub'))).toBe('Janv,Févr,Mars,Avr,Mai,Juin,Juil,Août,Sept,Oct,Nov,Déc|0,10,20,30,40,50,60,70,80,90,100,110');
    expect(text(root.querySelector('.st-card__caption'))).toContain('total 660,00 €');
  });

  it('taux d\'occupation : jusqu\'au mois courant (RG-STA-02)', async () => {
    await open('/statistiques/taux-occupation');
    expect(text(root.querySelector('.stub')).split('|')[0].split(',')).toHaveLength(10);
  });

  it('répartition par statut : date, parts, pourcentages et total (RG-STA-03)', async () => {
    await open('/statistiques/repartition');
    expect(Array.from(root.querySelectorAll('.st-card__pill span')).map(text)).toEqual([
      'Répartition des garages par statut',
      'au 09/10/2026',
    ]);
    const rows = Array.from(root.querySelectorAll('.pie__row')).map((row) => Array.from(row.children).map(text).filter(Boolean));
    expect(rows).toEqual([
      ['Loué', '7', '58 %'],
      ['Libre', '4', '33 %'],
      ['Indisponible', '1', '8 %'],
    ]);
    expect(text(root.querySelector('.pie__total'))).toBe('12 garages au total');
  });

  it('remarques par type : taux de résolution, ou message sans remarque (RG-STA-04)', async () => {
    await open('/statistiques/remarques');
    expect(text(root.querySelector('.st-rate__value'))).toBe('50 %');
    expect(text(root.querySelector('.st-rate__text'))).toBe('1 résolu(s) sur 2 problème(s)');
  });

  it('remarques par type : « Aucune remarque créée cette année-là. »', async () => {
    await open('/statistiques/remarques', stats({ remarques: { information: 0, probleme: 0, autre: 0, problemesResolus: 0, tauxResolution: null } }));
    expect(text(root.querySelector('.st-card__state'))).toBe('Aucune remarque créée cette année-là.');
  });

  it('le sélecteur d\'année met l\'année dans l\'adresse et recharge ; les années hors données sont grisées', async () => {
    await open('/statistiques/repartition');
    root.querySelector<HTMLButtonElement>('app-year-picker .mp__btn')!.click();
    await settle();
    const cells = Array.from(root.querySelectorAll<HTMLButtonElement>('.mp__month'));
    expect(cells.find((c) => text(c) === '2023')!.disabled).toBe(true);
    cells.find((c) => text(c) === '2025')!.click();
    await settle();
    expect(TestBed.inject(Router).url).toBe('/statistiques/repartition?annee=2025');
    const request = http.expectOne((r) => r.url === '/api/statistiques');
    expect(request.request.params.get('annee')).toBe('2025');
    request.flush(stats({ annee: 2025 }));
    await settle();
  });
});

