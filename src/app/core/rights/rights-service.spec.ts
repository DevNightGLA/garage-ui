import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { defaultDroits, withRight } from '../../../testing/rights';
import { DeviceService } from '../device-service';
import { RightsService } from './rights-service';

describe('RightsService', () => {
  let rights: RightsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    rights = TestBed.inject(RightsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('n\'accorde rien tant que les droits ne sont pas chargés', () => {
    expect(rights.loaded()).toBe(false);
    expect(rights.can('GAR')).toBe(false);
  });

  it('lit les droits du compte connecté dans GET /api/droits/moi', async () => {
    const done = firstValueFrom(rights.load());
    http.expectOne('/api/droits/moi').flush(defaultDroits('CONSULTANT'));
    expect(await done).toBe(true);
    expect(rights.profil()).toBe('CONSULTANT');
    expect(rights.can('GAR', 'v')).toBe(true);
    expect(rights.can('GAR', 'm')).toBe(false);
    expect(rights.can('USR', 'v')).toBe(false);
  });

  it('applique les quatre actions du réglage (RG-DRO-10) ; sans « voir », aucune autre action', () => {
    rights.use(withRight(defaultDroits('GESTIONNAIRE'), 'LOC', { peutSupprimer: false }));
    expect(rights.can('LOC', 'a')).toBe(true);
    expect(rights.can('LOC', 'm')).toBe(true);
    expect(rights.can('LOC', 'd')).toBe(false);
    rights.use(withRight(defaultDroits('GESTIONNAIRE'), 'LOC', { peutVoir: false }));
    expect(rights.can('LOC', 'a')).toBe(false);
  });

  it('filtre par appareil : ordinateur tout, smartphone sans Configuration sauf Droits d\'accès (RG-APP-02, 03)', () => {
    rights.use(defaultDroits('ADMIN'));
    const device = TestBed.inject(DeviceService);
    expect(rights.visible('USR')).toBe(true);
    device.mode.set('SMARTPHONE');
    expect(rights.visible('USR')).toBe(false);
    expect(rights.visible('DRO')).toBe(true);
    expect(rights.visible('GAR')).toBe(true);
    device.mode.set('TABLETTE');
    expect(rights.visible('USR')).toBe(true);
  });

  it('garde les valeurs par défaut quand l\'API ne répond pas, et oublie tout à la déconnexion', async () => {
    const done = firstValueFrom(rights.load());
    http.expectOne('/api/droits/moi').flush(null, { status: 500, statusText: 'Erreur' });
    expect(await done).toBe(false);
    rights.use(defaultDroits('ADMIN'));
    rights.clear();
    expect(rights.can('GAR')).toBe(false);
  });
});
