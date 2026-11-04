import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signInAs } from '../../../../testing/rights';
import { provideTestTranslations } from '../../../../testing/translations';
import { ToastService } from '../../../shared/toast/toast';
import { MaintenancePage } from './maintenance-page';

describe('MaintenancePage', () => {
  let fixture: ComponentFixture<MaintenancePage>;
  let http: HttpTestingController;
  let root: HTMLElement;
  const text = (el: Element) => el.textContent!.replace(/\s+/g, ' ').trim();
  const settle = async () => {
    for (let i = 0; i < 3; i++) {
      await new Promise((resolve) => setTimeout(resolve));
      fixture.detectChanges();
    }
  };
  const button = (label: string) => Array.from(root.querySelectorAll<HTMLButtonElement>('button')).find((b) => text(b) === label)!;

  const open = async (active = false) => {
    TestBed.configureTestingModule({
      imports: [MaintenancePage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), provideTestTranslations()],
    });
    signInAs('ADMIN');
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(MaintenancePage);
    root = fixture.nativeElement;
    await settle();
    http
      .expectOne('/api/maintenance')
      .flush({ active, intervalleVerifSec: 30, comptesActifsParProfil: { ADMIN: 1, GESTIONNAIRE: 2, LOCATAIRE: 1, CONSULTANT: 0 } });
    await settle();
  };

  afterEach(() => http.verify());

  it('site en ligne : état, comptes actifs par profil, intervalle et lien d\'aperçu', async () => {
    await open();
    expect(text(root.querySelector('.mn__title')!)).toBe('Le site est en ligne');
    const profiles = Array.from(root.querySelectorAll('.mn__profile')).map(text);
    expect(profiles[0]).toContain('1 compte actif');
    expect(profiles[0]).toContain('Accès maintenu');
    expect(profiles[1]).toContain('2 comptes actifs');
    expect(profiles[1]).toContain('Connexion bloquée');
    expect(text(root.querySelector('.mn__interval')!)).toContain('toutes les 30 secondes');
    expect(root.querySelector('a.mn__thumb')!.getAttribute('href')).toBe('/site-en-maintenance?apercu=1');
  });

  it('mise en maintenance après confirmation', async () => {
    await open();
    button('Mettre le site en maintenance').click();
    await settle();
    expect(text(root.querySelector('app-confirm')!)).toContain('Mettre le site en maintenance ?');
    button('Mettre en maintenance').click();
    const req = http.expectOne('/api/maintenance');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ active: true });
    req.flush({ active: true, intervalleVerifSec: 30 });
    await settle();
    expect(root.querySelector('app-confirm')).toBeNull();
    expect(text(root.querySelector('.mn__title')!)).toBe('Le site est en maintenance');
    expect(text(root.querySelectorAll('.mn__profile')[1])).toContain('2 comptes actifs');
    expect(TestBed.inject(ToastService).current()?.text).toContain('Site en maintenance');
  });

  it('réactivation sans confirmation', async () => {
    await open(true);
    button('Réactiver le site').click();
    const req = http.expectOne('/api/maintenance');
    expect(req.request.body).toEqual({ active: false });
    req.flush({ active: false, intervalleVerifSec: 30 });
    await settle();
    expect(text(root.querySelector('.mn__title')!)).toBe('Le site est en ligne');
  });
});
