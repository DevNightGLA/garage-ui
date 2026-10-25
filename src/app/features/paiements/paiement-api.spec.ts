import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { pageOf } from '../../../testing/garage-fixtures';
import { SYNTHESE, VERSEMENTS, paiement } from '../../../testing/paiement-fixtures';
import { PaiementApi } from './paiement-api';

describe('PaiementApi', () => {
  let api: PaiementApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    api = TestBed.inject(PaiementApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('liste les lignes d\'un mois avec page, taille, tris répétés, recherche et statut', () => {
    api
      .list({
        page: 1,
        size: 10,
        sort: [
          { key: 'locataire', dir: 'asc' },
          { key: 'montantDu', dir: 'desc' },
        ],
        q: ' dupont ',
        filters: { mois: '2026-09', statut: 'PARTIEL' },
      })
      .subscribe();
    const request = http.expectOne((r) => r.url === '/api/paiements');
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('mois')).toBe('2026-09');
    expect(request.request.params.get('page')).toBe('1');
    expect(request.request.params.get('size')).toBe('10');
    expect(request.request.params.getAll('sort')).toEqual(['locataire,asc', 'montantDu,desc']);
    expect(request.request.params.get('q')).toBe('dupont');
    expect(request.request.params.get('statut')).toBe('PARTIEL');
    request.flush(pageOf([paiement()]));
  });

  it('n\'envoie pas de statut pour « Tous »', () => {
    api.list({ page: 0, size: 10, filters: { mois: '2026-10', statut: null } }).subscribe();
    const request = http.expectOne((r) => r.url === '/api/paiements');
    expect(request.request.params.has('statut')).toBe(false);
    request.flush(pageOf([]));
  });

  it('lit la synthèse du mois en tenant compte de la recherche', () => {
    let result: unknown;
    api.summary('2026-10', ' dup ').subscribe((s) => (result = s));
    const request = http.expectOne((r) => r.url === '/api/paiements/synthese');
    expect(request.request.params.get('mois')).toBe('2026-10');
    expect(request.request.params.get('q')).toBe('dup');
    request.flush(SYNTHESE);
    expect(result).toEqual(SYNTHESE);

    api.summary('2026-10', '').subscribe();
    const empty = http.expectOne((r) => r.url === '/api/paiements/synthese');
    expect(empty.request.params.has('q')).toBe(false);
    empty.flush(SYNTHESE);
  });

  it('lit le détail des versements d\'une location pour un mois', () => {
    let result: unknown;
    api.versements(3, '2026-10').subscribe((d) => (result = d));
    const request = http.expectOne((r) => r.url === '/api/paiements/versements');
    expect(request.request.params.get('locationId')).toBe('3');
    expect(request.request.params.get('mois')).toBe('2026-10');
    request.flush(VERSEMENTS);
    expect(result).toEqual(VERSEMENTS);
  });

  it('enregistre un paiement et annule un versement', () => {
    const saisie = {
      locationId: 3,
      mois: '2026-10',
      type: 'PARTIEL' as const,
      montant: 30.5,
      modePaiement: 'VIREMENT' as const,
      datePaiement: '2026-10-06',
    };
    api.pay(saisie).subscribe();
    const post = http.expectOne((r) => r.method === 'POST' && r.url === '/api/paiements');
    expect(post.request.body).toEqual(saisie);
    post.flush(paiement());

    api.cancelVersement(22).subscribe();
    http
      .expectOne((r) => r.method === 'DELETE' && r.url === '/api/paiements/versements/22')
      .flush(null, { status: 204, statusText: 'No Content' });
  });
});
