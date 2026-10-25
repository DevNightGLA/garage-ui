import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { pageOf } from '../../../testing/garage-fixtures';
import { COMPTEURS_LOCATAIRES, locataire } from '../../../testing/locataire-fixtures';
import { LocataireApi } from './locataire-api';
import { LocataireEnvoi } from './locataire.models';

const ENVOI: LocataireEnvoi = {
  civilite: 'MME',
  nom: 'Dupont',
  prenom: 'Marie',
  rue: 'Rue de la Station',
  numeroRue: '14',
  codePostal: '1050',
  localite: 'Ixelles',
  tel1: '0470 00 00 01',
  tel2: null,
  email: null,
};

describe('LocataireApi', () => {
  let api: LocataireApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    api = TestBed.inject(LocataireApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('liste les locataires avec page, taille, tris répétés, recherche et statut', () => {
    api
      .list({
        page: 2,
        size: 10,
        sort: [
          { key: 'locataire', dir: 'asc' },
          { key: 'garages', dir: 'desc' },
        ],
        q: ' dupont ',
        filters: { statut: 'A_VENIR' },
      })
      .subscribe();
    const request = http.expectOne((r) => r.url === '/api/locataires');
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('size')).toBe('10');
    expect(request.request.params.getAll('sort')).toEqual(['locataire,asc', 'garages,desc']);
    expect(request.request.params.get('q')).toBe('dupont');
    expect(request.request.params.get('statut')).toBe('A_VENIR');
    request.flush(pageOf([locataire()]));
  });

  it('n\'envoie pas de statut pour « Tous »', () => {
    api.list({ page: 0, size: 10, filters: { statut: null } }).subscribe();
    const request = http.expectOne((r) => r.url === '/api/locataires');
    expect(request.request.params.has('statut')).toBe(false);
    request.flush(pageOf([]));
  });

  it('lit les compteurs en tenant compte de la recherche', () => {
    let result: unknown;
    api.counters(' dup ').subscribe((c) => (result = c));
    const request = http.expectOne((r) => r.url === '/api/locataires/compteurs');
    expect(request.request.params.get('q')).toBe('dup');
    request.flush(COMPTEURS_LOCATAIRES);
    expect(result).toEqual(COMPTEURS_LOCATAIRES);

    api.counters('').subscribe();
    const empty = http.expectOne((r) => r.url === '/api/locataires/compteurs');
    expect(empty.request.params.has('q')).toBe(false);
    empty.flush(COMPTEURS_LOCATAIRES);
  });

  it('crée un locataire sans force, puis avec ?force=true pour passer outre le doublon', () => {
    api.create(ENVOI).subscribe();
    const first = http.expectOne((r) => r.method === 'POST' && r.url === '/api/locataires');
    expect(first.request.params.has('force')).toBe(false);
    expect(first.request.body).toEqual(ENVOI);
    first.flush(locataire());

    api.create(ENVOI, true).subscribe();
    const forced = http.expectOne((r) => r.method === 'POST' && r.url === '/api/locataires');
    expect(forced.request.params.get('force')).toBe('true');
    expect(forced.request.body).toEqual(ENVOI);
    forced.flush(locataire());
  });

  it('modifie un locataire, avec ou sans force', () => {
    api.update(7, ENVOI).subscribe();
    const plain = http.expectOne((r) => r.method === 'PUT' && r.url === '/api/locataires/7');
    expect(plain.request.params.has('force')).toBe(false);
    plain.flush(locataire({ id: 7 }));

    api.update(7, ENVOI, true).subscribe();
    const forced = http.expectOne((r) => r.method === 'PUT' && r.url === '/api/locataires/7');
    expect(forced.request.params.get('force')).toBe('true');
    forced.flush(locataire({ id: 7 }));
  });

  it('supprime un locataire', () => {
    api.delete(7).subscribe();
    const request = http.expectOne((r) => r.method === 'DELETE' && r.url === '/api/locataires/7');
    request.flush(null, { status: 204, statusText: 'No Content' });
  });
});
