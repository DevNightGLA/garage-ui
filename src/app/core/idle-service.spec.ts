import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { signInAs } from '../../testing/rights';
import { AuthService } from './auth/auth-service';
import { IdleService } from './idle-service';
import { SettingsService } from './settings-service';

describe('IdleService', () => {
  let navigate: ReturnType<typeof vi.spyOn>;

  const withInactivity = (minutes: number) => {
    TestBed.inject(SettingsService).load().subscribe();
    TestBed.inject(HttpTestingController)
      .expectOne('/api/contexte')
      .flush({ dateDuJour: '2026-10-09', lignesListe: 10, lignesHist: 5, graphMois: 12, langueDefaut: 'fr', menuReplie: false, inactiviteMin: minutes, mdpMin: 8, maintenance: false });
  };

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] });
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    signInAs('GESTIONNAIRE');
  });

  afterEach(() => {
    TestBed.inject(IdleService).stop();
    vi.useRealTimers();
  });

  it('déconnecte après inactivite_min minutes sans action (RG-AUT-06)', () => {
    withInactivity(15);
    TestBed.inject(IdleService).start();
    vi.advanceTimersByTime(14 * 60_000);
    expect(TestBed.inject(AuthService).isAuthenticated()).toBe(true);
    vi.advanceTimersByTime(60_000);
    expect(TestBed.inject(AuthService).isAuthenticated()).toBe(false);
    expect(navigate).toHaveBeenCalledWith(['/connexion'], { queryParams: { raison: 'deconnecte' } });
  });

  it('une action de l\'utilisateur relance le délai', () => {
    withInactivity(1);
    TestBed.inject(IdleService).start();
    vi.advanceTimersByTime(50_000);
    window.dispatchEvent(new Event('keydown'));
    vi.advanceTimersByTime(50_000);
    expect(TestBed.inject(AuthService).isAuthenticated()).toBe(true);
    vi.advanceTimersByTime(20_000);
    expect(TestBed.inject(AuthService).isAuthenticated()).toBe(false);
  });

  it('0 minute : jamais de déconnexion', () => {
    withInactivity(0);
    TestBed.inject(IdleService).start();
    vi.advanceTimersByTime(24 * 60 * 60_000);
    expect(TestBed.inject(AuthService).isAuthenticated()).toBe(true);
  });
});
