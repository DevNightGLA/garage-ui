import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CIBLE_GARAGE, CIBLE_LOCATAIRE, probleme, remarque } from '../../../testing/remarque-fixtures';
import { RemarqueApi } from './remarque-api';

describe('RemarqueApi', () => {
  let api: RemarqueApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    api = TestBed.inject(RemarqueApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('liste les remarques d\'un garage et d\'un locataire', () => {
    let garage: unknown;
    api.list(CIBLE_GARAGE).subscribe((r) => (garage = r));
    http.expectOne((r) => r.method === 'GET' && r.url === '/api/garages/5/remarques').flush([remarque()]);
    expect(garage).toEqual([remarque()]);

    api.list(CIBLE_LOCATAIRE).subscribe();
    http.expectOne((r) => r.method === 'GET' && r.url === '/api/locataires/4/remarques').flush([]);
  });

  it('crée une remarque rattachée au garage ou au locataire', () => {
    const body = { type: 'INFORMATION' as const, texte: '<p>Porte</p>' };
    api.create(CIBLE_GARAGE, body).subscribe();
    const garage = http.expectOne((r) => r.method === 'POST' && r.url === '/api/garages/5/remarques');
    expect(garage.request.body).toEqual(body);
    garage.flush(remarque());

    api.create(CIBLE_LOCATAIRE, body).subscribe();
    http.expectOne((r) => r.method === 'POST' && r.url === '/api/locataires/4/remarques').flush(remarque());
  });

  it('modifie une remarque', () => {
    const body = { type: 'PROBLEME' as const, texte: '<p>Fuite</p>' };
    api.update(7, body).subscribe();
    const request = http.expectOne((r) => r.method === 'PUT' && r.url === '/api/remarques/7');
    expect(request.request.body).toEqual(body);
    request.flush(probleme({ id: 7 }));
  });

  it('marque un problème résolu à une date, puis le rouvre', () => {
    api.resolve(7, '2026-10-22').subscribe();
    const post = http.expectOne((r) => r.method === 'POST' && r.url === '/api/remarques/7/resolution');
    expect(post.request.body).toEqual({ dateResolution: '2026-10-22' });
    post.flush(probleme({ id: 7, resolu: true, dateResolution: '2026-10-22' }));

    api.reopen(7).subscribe();
    http.expectOne((r) => r.method === 'DELETE' && r.url === '/api/remarques/7/resolution').flush(probleme({ id: 7 }));
  });

  it('supprime une remarque', () => {
    api.delete(7).subscribe();
    http
      .expectOne((r) => r.method === 'DELETE' && r.url === '/api/remarques/7')
      .flush(null, { status: 204, statusText: 'No Content' });
  });
});
