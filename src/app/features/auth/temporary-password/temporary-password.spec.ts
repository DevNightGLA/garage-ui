import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { signInAs } from '../../../../testing/rights';
import { provideTestTranslations } from '../../../../testing/translations';
import { AuthService } from '../../../core/auth/auth-service';
import { TemporaryPassword } from './temporary-password';

describe('TemporaryPassword', () => {
  let fixture: ComponentFixture<TemporaryPassword>;
  let http: HttpTestingController;
  let router: Router;
  const root = () => fixture.nativeElement as HTMLElement;

  const fill = async (actuel: string, nouveau: string, confirmer: string) => {
    const fields = Array.from(root().querySelectorAll<HTMLInputElement>('app-password-input input'));
    [actuel, nouveau, confirmer].forEach((text, i) => {
      fields[i].value = text;
      fields[i].dispatchEvent(new Event('input'));
    });
    root().querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TemporaryPassword],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), provideTestTranslations()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    signInAs('CONSULTANT', { motDePasseTemporaire: true });
    fixture = TestBed.createComponent(TemporaryPassword);
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  it('rappelle la longueur minimale du mot de passe (RG-PAR-10)', () => {
    expect(root().querySelector('.ff__hint')!.textContent).toBe('Minimum 8 caractères');
  });

  it('remplace le mot de passe temporaire puis ouvre l\'application (RG-AUT-05)', async () => {
    await fill('kwCKGunf22ET', 'Nouveau-2026', 'Nouveau-2026');
    const request = http.expectOne('/api/auth/mot-de-passe');
    expect(request.request.body).toEqual({ motDePasseActuel: 'kwCKGunf22ET', nouveauMotDePasse: 'Nouveau-2026' });
    request.flush(null, { status: 204, statusText: 'No Content' });
    await fixture.whenStable();
    expect(TestBed.inject(AuthService).mustChangePassword()).toBe(false);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('refuse deux mots de passe différents sans appeler l\'API', async () => {
    await fill('kwCKGunf22ET', 'Nouveau-2026', 'Autre-2026');
    http.expectNone('/api/auth/mot-de-passe');
    expect(root().textContent).toContain('Les deux mots de passe ne sont pas identiques.');
  });

  it('affiche l\'erreur du back dans la fenêtre', async () => {
    await fill('faux', 'Nouveau-2026', 'Nouveau-2026');
    http.expectOne('/api/auth/mot-de-passe').flush(
      { code: 'AUTH_MOT_DE_PASSE_ACTUEL_INCORRECT', message: 'Le mot de passe actuel est incorrect.', details: [] },
      { status: 409, statusText: 'Conflict' },
    );
    await fixture.whenStable();
    expect(root().querySelector('[role="alert"]')!.textContent).toContain('Le mot de passe actuel est incorrect.');
  });
});
