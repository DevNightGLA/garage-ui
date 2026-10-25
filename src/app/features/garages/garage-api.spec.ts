import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { COMPTEURS, garage, loyer, pageOf } from '../../../testing/garage-fixtures';
import { GarageApi } from './garage-api';

describe('GarageApi', () => {
  let api: GarageApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    api = TestBed.inject(GarageApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('liste les garages avec page, taille, tris répétés, recherche et statut', () => {
    api
      .list({
        page: 1,
        size: 10,
        sort: [
          { key: 'numero', dir: 'asc' },
          { key: 'nbClesTotal', dir: 'desc' },
        ],
        q: ' dupont ',
        filters: { statut: 'LOUE' },
      })
      .subscribe();
    const request = http.expectOne((r) => r.url === '/api/garages');
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('page')).toBe('1');
    expect(request.request.params.get('size')).toBe('10');
    expect(request.request.params.getAll('sort')).toEqual(['numero,asc', 'nbClesTotal,desc']);
    expect(request.request.params.get('q')).toBe('dupont');
    expect(request.request.params.get('statut')).toBe('LOUE');
    request.flush(pageOf([garage()]));
  });

  it('n\'envoie pas de statut pour « Tous »', () => {
    api.list({ page: 0, size: 10, filters: { statut: null } }).subscribe();
    const request = http.expectOne((r) => r.url === '/api/garages');
    expect(request.request.params.has('statut')).toBe(false);
    request.flush(pageOf([]));
  });

  it('lit les compteurs en tenant compte de la recherche', () => {
    let result: unknown;
    api.counters(' dup ').subscribe((c) => (result = c));
    const request = http.expectOne((r) => r.url === '/api/garages/compteurs');
    expect(request.request.params.get('q')).toBe('dup');
    request.flush(COMPTEURS);
    expect(result).toEqual(COMPTEURS);

    api.counters('').subscribe();
    const empty = http.expectOne((r) => r.url === '/api/garages/compteurs');
    expect(empty.request.params.has('q')).toBe(false);
    empty.flush(COMPTEURS);
  });

  it('demande le prochain numéro', () => {
    let numero = '';
    api.nextNumber().subscribe((r) => (numero = r.numero));
    http.expectOne('/api/garages/prochain-numero').flush({ numero: 'G13' });
    expect(numero).toBe('G13');
  });

  it('crée, modifie et supprime un garage', () => {
    const creation = {
      numero: 'G13',
      nbClesTotal: 2,
      nbClesReserve: 0,
      statutModifiable: 'LIBRE' as const,
      loyerMontant: 80,
      loyerDateDebut: '2026-10-01',
    };
    api.create(creation).subscribe();
    const post = http.expectOne('/api/garages');
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual(creation);
    post.flush(garage());

    api.update(4, { nbClesTotal: 3, nbClesReserve: 1 }).subscribe();
    const put = http.expectOne('/api/garages/4');
    expect(put.request.method).toBe('PUT');
    expect(put.request.body).toEqual({ nbClesTotal: 3, nbClesReserve: 1 });
    put.flush(garage());

    api.delete(4).subscribe();
    const del = http.expectOne('/api/garages/4');
    expect(del.request.method).toBe('DELETE');
    del.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('gère l\'historique des loyers', () => {
    api.loyers(4, 0, 5).subscribe();
    const get = http.expectOne((r) => r.url === '/api/garages/4/loyers');
    expect(get.request.params.get('size')).toBe('5');
    get.flush(pageOf([loyer()], 1, 0, 5));

    api.createLoyer(4, { montant: 95, dateDebut: '2026-12-01' }).subscribe();
    const post = http.expectOne('/api/garages/4/loyers');
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual({ montant: 95, dateDebut: '2026-12-01' });
    post.flush(loyer());

    api.updateLoyer(7, { montant: 96, dateDebut: '2026-12-01' }).subscribe();
    const put = http.expectOne('/api/loyers/7');
    expect(put.request.method).toBe('PUT');
    put.flush(loyer());

    api.deleteLoyer(7).subscribe();
    const del = http.expectOne('/api/loyers/7');
    expect(del.request.method).toBe('DELETE');
    del.flush(null, { status: 204, statusText: 'No Content' });
  });
});
