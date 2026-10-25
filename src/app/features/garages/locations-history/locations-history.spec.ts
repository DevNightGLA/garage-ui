import { HttpRequest, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { garage, pageOf } from '../../../../testing/garage-fixtures';
import { location, locationAVenir, locationTerminee } from '../../../../testing/location-fixtures';
import { provideTestTranslations } from '../../../../testing/translations';
import { LocationDTO } from '../../locations/location.models';
import { LocationsHistory } from './locations-history';

const isHistory = (r: HttpRequest<unknown>) => r.method === 'GET' && r.url === '/api/garages/1/locations';

describe('LocationsHistory', () => {
  let fixture: ComponentFixture<LocationsHistory>;
  let http: HttpTestingController;
  let root: HTMLElement;

  const text = (element: Element | null) => (element?.textContent ?? '').replace(/\s+/g, ' ').trim();
  const rows = () => Array.from(root.querySelectorAll('.lh tbody tr'));
  const render = () => fixture.detectChanges();
  const settle = async () => {
    render();
    await fixture.whenStable();
  };

  const create = () => {
    fixture = TestBed.createComponent(LocationsHistory);
    fixture.componentRef.setInput('garage', garage());
    root = fixture.nativeElement;
    render();
  };

  /** Ouvre l'historique et répond à la première page. */
  const open = async (content: LocationDTO[] = [location()], total = content.length) => {
    create();
    http.expectOne(isHistory).flush(pageOf(content, total, 0, 5));
    await settle();
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideTestTranslations()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('affiche le titre avec le numéro du garage', async () => {
    await open();
    expect(text(root.querySelector('.modal__title'))).toBe('Historique des locations · G01');
  });

  it('affiche le chargement, puis demande la première page de 5, sans tri', async () => {
    create();
    expect(text(root.querySelector('.lh__state'))).toBe('Chargement…');
    const request = http.expectOne(isHistory);
    expect(request.request.params.get('page')).toBe('0');
    expect(request.request.params.get('size')).toBe('5');
    expect(request.request.params.has('sort')).toBe(false);
    request.flush(pageOf([location()], 1, 0, 5));
    await settle();
    expect(root.querySelector('.lh__state')).toBeNull();
  });

  it('affiche « Ce garage n\'a jamais été loué. » quand il n\'y a aucune location', async () => {
    await open([]);
    expect(text(root.querySelector('.lh__state'))).toBe("Ce garage n'a jamais été loué.");
    expect(text(root.querySelector('.pg__count'))).toBe('0–0 sur 0 locations');
  });

  it('affiche l\'erreur et recharge au clic sur Réessayer', async () => {
    create();
    http
      .expectOne(isHistory)
      .flush({ code: 'ERREUR_INTERNE', message: 'Une erreur inattendue est survenue.' }, { status: 500, statusText: 'Server Error' });
    await settle();
    expect(text(root.querySelector('.lh__state--error'))).toContain('Une erreur inattendue est survenue.');
    (root.querySelector('.lh__state--error button') as HTMLElement).click();
    render();
    http.expectOne(isHistory).flush(pageOf([location()], 1, 0, 5));
    await settle();
    expect(rows()).toHaveLength(1);
  });

  it('affiche locataire, début, fin, clés, loyer et statut de chaque location', async () => {
    await open([
      locationAVenir({ garage: { id: 1, numero: 'G01' } }),
      location(),
      locationTerminee({ garage: { id: 1, numero: 'G01' } }),
    ]);
    const [upcoming, active, ended] = rows().map((row) => text(row));
    expect(upcoming).toContain('Luc Martin');
    expect(upcoming).toContain('01/12/2026');
    expect(upcoming).toContain('95,00 €');
    expect(upcoming).toContain('À venir');
    expect(active).toContain('Marie Dupont');
    expect(active).toContain('01/03/2025');
    expect(active).toContain('90,00 €');
    expect(active).toContain('Active');
    expect(ended).toContain('Nathalie Claes');
    expect(ended).toContain('01/01/2024');
    expect(ended).toContain('31/12/2025');
    expect(ended).toContain('85,00 €');
    expect(ended).toContain('Terminée');
  });

  it('laisse la fin et le loyer vides quand l\'API n\'en renvoie pas', async () => {
    await open([location({ dateFin: null, loyer: null })]);
    const cells = rows()[0].querySelectorAll('td');
    expect(text(cells[2])).toBe('');
    expect(text(cells[4])).toBe('');
  });

  it('pagine côté serveur, 5 par page', async () => {
    await open([location()], 12);
    expect(text(root.querySelector('.pg__count'))).toBe('1–5 sur 12 locations');
    (root.querySelectorAll('.pg__btn')[2] as HTMLElement).click();
    render();
    const request = http.expectOne(isHistory);
    expect(request.request.params.get('page')).toBe('1');
    expect(request.request.params.get('size')).toBe('5');
    request.flush(pageOf([locationTerminee()], 12, 1, 5));
    await settle();
    expect(text(root.querySelector('.pg__count'))).toBe('6–10 sur 12 locations');
  });

  it('se ferme avec le bouton Fermer', async () => {
    await open();
    let closed = 0;
    fixture.componentInstance.closed.subscribe(() => closed++);
    (root.querySelector('.modal__foot .btn--primary') as HTMLElement).click();
    expect(closed).toBe(1);
  });
});
