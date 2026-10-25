import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { pageOf } from '../../../testing/garage-fixtures';
import { COMPTEURS_LOCATIONS, CONDITIONS, location } from '../../../testing/location-fixtures';
import { LocationApi } from './location-api';

describe('LocationApi', () => {
  let api: LocationApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    api = TestBed.inject(LocationApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('liste les locations avec page, taille, tris répétés, recherche, statut et période de fin', () => {
    api
      .list({
        page: 1,
        size: 10,
        sort: [
          { key: 'locataire', dir: 'asc' },
          { key: 'dateFin', dir: 'desc' },
        ],
        q: ' dupont ',
        filters: { statut: 'TERMINEE', finDu: '2025-01-01', finAu: '2025-12-31' },
      })
      .subscribe();
    const request = http.expectOne((r) => r.url === '/api/locations');
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('page')).toBe('1');
    expect(request.request.params.get('size')).toBe('10');
    expect(request.request.params.getAll('sort')).toEqual(['locataire,asc', 'dateFin,desc']);
    expect(request.request.params.get('q')).toBe('dupont');
    expect(request.request.params.get('statut')).toBe('TERMINEE');
    expect(request.request.params.get('finDu')).toBe('2025-01-01');
    expect(request.request.params.get('finAu')).toBe('2025-12-31');
    request.flush(pageOf([location()]));
  });

  it('n\'envoie pas les bornes vides', () => {
    api.list({ page: 0, size: 10, filters: { statut: 'ACTIVE', finDu: null, finAu: null } }).subscribe();
    const request = http.expectOne((r) => r.url === '/api/locations');
    expect(request.request.params.has('finDu')).toBe(false);
    expect(request.request.params.has('finAu')).toBe(false);
    request.flush(pageOf([]));
  });

  it('lit les compteurs en tenant compte de la recherche', () => {
    let result: unknown;
    api.counters(' dup ').subscribe((c) => (result = c));
    const request = http.expectOne((r) => r.url === '/api/locations/compteurs');
    expect(request.request.params.get('q')).toBe('dup');
    request.flush(COMPTEURS_LOCATIONS);
    expect(result).toEqual(COMPTEURS_LOCATIONS);

    api.counters('').subscribe();
    const empty = http.expectOne((r) => r.url === '/api/locations/compteurs');
    expect(empty.request.params.has('q')).toBe(false);
    empty.flush(COMPTEURS_LOCATIONS);
  });

  it('lit l\'historique d\'un garage', () => {
    api.listForGarage(4, { page: 0, size: 5 }).subscribe();
    const request = http.expectOne((r) => r.url === '/api/garages/4/locations');
    expect(request.request.params.get('size')).toBe('5');
    expect(request.request.params.has('sort')).toBe(false);
    request.flush(pageOf([location()], 1, 0, 5));
  });

  it('lit les conditions du garage à la date de début, sans date quand elle manque', () => {
    let result: unknown;
    api.conditions(12, '2026-11-01').subscribe((c) => (result = c));
    const request = http.expectOne((r) => r.url === '/api/garages/12/conditions-location');
    expect(request.request.params.get('dateDebut')).toBe('2026-11-01');
    request.flush(CONDITIONS);
    expect(result).toEqual(CONDITIONS);

    api.conditions(12, null).subscribe();
    const noDate = http.expectOne((r) => r.url === '/api/garages/12/conditions-location');
    expect(noDate.request.params.has('dateDebut')).toBe(false);
    noDate.flush({ ...CONDITIONS, loyer: null });
  });

  it('crée, modifie et supprime une location', () => {
    const creation = { locataireId: 1, garageId: 12, dateDebut: '2026-11-01', nbClesRemises: 2 };
    api.create(creation).subscribe();
    const post = http.expectOne((r) => r.method === 'POST' && r.url === '/api/locations');
    expect(post.request.body).toEqual(creation);
    post.flush(location());

    const modification = { dateDebut: '2026-11-01', nbClesRemises: 1, dateFin: null };
    api.update(7, modification).subscribe();
    const put = http.expectOne((r) => r.method === 'PUT' && r.url === '/api/locations/7');
    expect(put.request.body).toEqual(modification);
    put.flush(location({ id: 7 }));

    api.delete(7).subscribe();
    http.expectOne((r) => r.method === 'DELETE' && r.url === '/api/locations/7').flush(null, { status: 204, statusText: 'No Content' });
  });
});
