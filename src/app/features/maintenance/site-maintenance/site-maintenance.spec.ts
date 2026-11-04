import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { provideTestTranslations } from '../../../../testing/translations';
import { SiteMaintenance } from './site-maintenance';

describe('SiteMaintenance', () => {
  let fixture: ComponentFixture<SiteMaintenance>;
  let http: HttpTestingController;
  let navigateByUrl: ReturnType<typeof vi.spyOn>;
  const root = () => fixture.nativeElement as HTMLElement;
  const flushMicrotasks = async () => {
    await vi.advanceTimersByTimeAsync(0);
    fixture.detectChanges();
  };

  const setup = (query: Record<string, string> = {}) => {
    TestBed.configureTestingModule({
      imports: [SiteMaintenance],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTestTranslations(),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(query) } } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    fixture = TestBed.createComponent(SiteMaintenance);
    fixture.detectChanges();
  };

  beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
  });

  afterEach(() => {
    http.verify();
    vi.useRealTimers();
  });

  it('affiche le texte de la maquette (RG-MNT-02)', () => {
    setup();
    http.expectOne('/api/maintenance/etat').flush({ active: true, intervalleVerifSec: 15 });
    expect(root().querySelector('h1')!.textContent).toBe('Site en maintenance');
    expect(root().textContent).toContain('Vos données sont conservées');
  });

  it('lit l\'état dès l\'ouverture, puis vérifie selon intervalleVerifSec (maintenance_verif_sec)', async () => {
    setup();
    http.expectOne('/api/maintenance/etat').flush({ active: true, intervalleVerifSec: 30 });
    await flushMicrotasks();
    await vi.advanceTimersByTimeAsync(29_000);
    http.expectNone('/api/maintenance/etat');
    await vi.advanceTimersByTimeAsync(1_000);
    http.expectOne('/api/maintenance/etat').flush({ active: false, intervalleVerifSec: 30 });
    await flushMicrotasks();
    expect(navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('API injoignable à l\'ouverture : nouvelle vérification après 15 s (valeur par défaut)', async () => {
    setup();
    http.expectOne('/api/maintenance/etat').error(new ProgressEvent('error'));
    await flushMicrotasks();
    await vi.advanceTimersByTimeAsync(14_000);
    http.expectNone('/api/maintenance/etat');
    await vi.advanceTimersByTimeAsync(1_000);
    http.expectOne('/api/maintenance/etat').flush({ active: true, intervalleVerifSec: 15 });
    await flushMicrotasks();
  });

  it('« Réessayer » vérifie tout de suite et prévient si le site est toujours en maintenance (RG-MNT-03)', async () => {
    setup();
    http.expectOne('/api/maintenance/etat').flush({ active: true, intervalleVerifSec: 15 });
    await flushMicrotasks();
    root().querySelector<HTMLButtonElement>('.mnt__retry')!.click();
    fixture.detectChanges();
    expect(root().querySelector('.mnt__retry')!.textContent).toContain('Vérification…');
    http.expectOne('/api/maintenance/etat').flush({ active: true, intervalleVerifSec: 15 });
    await flushMicrotasks();
    expect(root().querySelector('[role="status"]')!.textContent).toContain('toujours en maintenance');
    expect(navigateByUrl).not.toHaveBeenCalled();
  });

  it('aperçu de l\'Admin : aucune vérification, lien « Quitter l\'aperçu » (RG-MNT-04)', async () => {
    setup({ apercu: '1' });
    await vi.advanceTimersByTimeAsync(60_000);
    http.expectNone('/api/maintenance/etat');
    expect(root().querySelector('.mnt__retry')).toBeNull();
    expect(root().querySelector('.mnt__link')!.textContent).toContain('Quitter l’aperçu');
  });
});
