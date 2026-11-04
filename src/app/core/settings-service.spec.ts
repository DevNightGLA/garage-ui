import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { SettingsService } from './settings-service';
import { TODAY } from './today';

describe('SettingsService', () => {
  let settings: SettingsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    settings = TestBed.inject(SettingsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('garde les valeurs de départ des paramètres tant que le contexte n\'est pas lu', () => {
    expect(settings.lignesListe()).toBe(10);
    expect(settings.lignesHist()).toBe(5);
    expect(settings.mdpMin()).toBe(8);
    expect(settings.inactiviteMin()).toBe(0);
  });

  it('lit GET /api/contexte : réglages et date du jour du serveur', () => {
    settings.load().subscribe();
    http.expectOne('/api/contexte').flush({
      dateDuJour: '2026-10-09',
      lignesListe: 20,
      lignesHist: 3,
      graphMois: 6,
      langueDefaut: 'en',
      menuReplie: true,
      inactiviteMin: 15,
      mdpMin: 12,
      maintenance: false,
    });
    expect(settings.lignesListe()).toBe(20);
    expect(settings.langueDefaut()).toBe('en');
    expect(settings.menuReplie()).toBe(true);
    expect(settings.mdpMin()).toBe(12);
    expect(settings.today()).toEqual(new Date(2026, 9, 9));
    expect(TestBed.inject(TODAY)()).toEqual(new Date(2026, 9, 9));
  });

  it('API injoignable : valeurs par défaut et date du navigateur', () => {
    settings.load().subscribe();
    http.expectOne('/api/contexte').error(new ProgressEvent('error'));
    expect(settings.lignesListe()).toBe(10);
    const now = new Date();
    expect(settings.today()).toEqual(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
  });
});
