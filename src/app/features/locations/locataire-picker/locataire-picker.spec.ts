import { Component } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { pageOf } from '../../../../testing/garage-fixtures';
import { locataire, locataireAVenir, locataireAncien, locataireSansLocation } from '../../../../testing/locataire-fixtures';
import { provideTestTranslations } from '../../../../testing/translations';
import { SEARCH_DEBOUNCE_MS } from '../../../shared/search-input/search-input';
import { LocatairePicker } from './locataire-picker';

@Component({
  imports: [ReactiveFormsModule, LocatairePicker],
  template: `<app-locataire-picker [formControl]="control" />`,
})
class Host {
  readonly control = new FormControl<number | null>(null);
}

describe('LocatairePicker', () => {
  let fixture: ComponentFixture<Host>;
  let http: HttpTestingController;
  let root: HTMLElement;

  const text = (element: Element | null) => (element?.textContent ?? '').replace(/\s+/g, ' ').trim();
  const rows = () => Array.from(root.querySelectorAll('.picker__row'));
  const render = () => fixture.detectChanges();
  /** Attend la stabilité : à n'utiliser qu'une fois toutes les requêtes ouvertes servies. */
  const settle = async () => {
    render();
    await fixture.whenStable();
  };
  const isList = (r: { url: string }) => r.url === '/api/locataires';

  const open = async (content = [locataire(), locataireAVenir(), locataireAncien(), locataireSansLocation()], total = content.length) => {
    fixture = TestBed.createComponent(Host);
    root = fixture.nativeElement;
    render();
    http.expectOne(isList).flush(pageOf(content, total, 0, 5));
    await settle();
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideTestTranslations()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    vi.useRealTimers();
    http.verify();
  });

  it('demande les locataires 5 par page, sans filtre de statut', () => {
    fixture = TestBed.createComponent(Host);
    root = fixture.nativeElement;
    render();
    const request = http.expectOne(isList);
    expect(request.request.params.get('size')).toBe('5');
    expect(request.request.params.get('page')).toBe('0');
    expect(request.request.params.has('statut')).toBe(false);
    request.flush(pageOf([locataire()], 1, 0, 5));
  });

  it('affiche chaque locataire en « NOM Prénom » avec son statut', async () => {
    await open();
    expect(rows().map((row) => text(row))).toEqual([
      'DUPONT Marie Actuel',
      'MARTIN Luc À venir',
      'CLAES Nathalie Ancien',
      'MAES Julie Sans location',
    ]);
  });

  it('choisit un locataire : la valeur du formulaire est son identifiant', async () => {
    await open();
    (rows()[1] as HTMLElement).click();
    render();
    expect(fixture.componentInstance.control.value).toBe(3);
    expect(rows().map((row) => row.classList.contains('is-selected'))).toEqual([false, true, false, false]);
    expect(root.querySelector<HTMLInputElement>('.picker__field')!.value).toBe('MARTIN Luc');
  });

  it('saisir de nouveau annule le choix et lance la recherche après une courte pause', async () => {
    await open();
    (rows()[0] as HTMLElement).click();
    render();
    expect(fixture.componentInstance.control.value).toBe(1);

    vi.useFakeTimers();
    const field = root.querySelector<HTMLInputElement>('.picker__field')!;
    field.value = 'mar';
    field.dispatchEvent(new Event('input'));
    render();
    expect(fixture.componentInstance.control.value).toBeNull();
    http.expectNone(isList);

    vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
    render();
    const request = http.expectOne(isList);
    expect(request.request.params.get('q')).toBe('mar');
    expect(request.request.params.get('page')).toBe('0');
    request.flush(pageOf([locataireAVenir()], 1, 0, 5));
  });

  it('Entrée lance la recherche tout de suite sans valider le formulaire', async () => {
    await open();
    const field = root.querySelector<HTMLInputElement>('.picker__field')!;
    field.value = 'maes';
    field.dispatchEvent(new Event('input'));
    const enter = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
    field.dispatchEvent(enter);
    render();
    expect(enter.defaultPrevented).toBe(true);
    const request = http.expectOne(isList);
    expect(request.request.params.get('q')).toBe('maes');
    request.flush(pageOf([locataireSansLocation()], 1, 0, 5));
    await settle();
    expect(rows().map((row) => text(row))).toEqual(['MAES Julie Sans location']);
  });

  it('pagine quand il y a plus de 5 locataires', async () => {
    await open([locataire()], 13);
    expect(text(root.querySelector('.picker__pager .pg__count'))).toBe('1–5 sur 13 locataires');
    (root.querySelectorAll('.picker__pager .pg__btn')[2] as HTMLElement).click();
    render();
    const request = http.expectOne(isList);
    expect(request.request.params.get('page')).toBe('1');
    request.flush(pageOf([locataireAncien()], 13, 1, 5));
    await settle();
    expect(text(root.querySelector('.picker__pager .pg__count'))).toBe('6–10 sur 13 locataires');
  });

  it('n\'affiche pas la pagination pour 5 locataires ou moins', async () => {
    await open();
    expect(root.querySelector('.picker__pager')).toBeNull();
  });

  it('indique quand aucun locataire ne correspond', async () => {
    await open([]);
    expect(text(root.querySelector('.picker__state'))).toBe('Aucun locataire trouvé.');
  });

  it('affiche l\'erreur de chargement et recharge au clic sur Réessayer', async () => {
    fixture = TestBed.createComponent(Host);
    root = fixture.nativeElement;
    render();
    http.expectOne(isList).flush({ code: 'ERREUR_INTERNE', message: 'Une erreur inattendue est survenue.' }, { status: 500, statusText: 'Server Error' });
    await settle();
    expect(text(root.querySelector('.picker__state--error'))).toContain('Une erreur inattendue est survenue.');
    (root.querySelector('.picker__state--error button') as HTMLElement).click();
    render();
    http.expectOne(isList).flush(pageOf([locataire()], 1, 0, 5));
    await settle();
    expect(rows()).toHaveLength(1);
  });

  it('désactive la liste quand le champ est désactivé', async () => {
    await open();
    fixture.componentInstance.control.disable();
    render();
    expect(root.querySelector<HTMLInputElement>('.picker__field')!.disabled).toBe(true);
    (rows()[0] as HTMLElement).click();
    expect(fixture.componentInstance.control.value).toBeNull();
  });

  it('efface la sélection quand le formulaire repasse à null', async () => {
    await open();
    (rows()[0] as HTMLElement).click();
    render();
    fixture.componentInstance.control.setValue(null);
    render();
    expect(rows().some((row) => row.classList.contains('is-selected'))).toBe(false);
    expect(root.querySelector<HTMLInputElement>('.picker__field')!.value).toBe('');
  });
});
