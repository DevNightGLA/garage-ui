import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { pageOf } from '../../../testing/garage-fixtures';
import { impaye, tableauDeBord } from '../../../testing/tableau-de-bord-fixtures';
import { TableauDeBordApi } from './tableau-de-bord-api';

describe('TableauDeBordApi', () => {
  let api: TableauDeBordApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    api = TestBed.inject(TableauDeBordApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lit les indicateurs et les séries du tableau de bord', () => {
    let result: unknown;
    api.get().subscribe((d) => (result = d));
    const request = http.expectOne((r) => r.method === 'GET' && r.url === '/api/tableau-de-bord');
    request.flush(tableauDeBord());
    expect(result).toEqual(tableauDeBord());
  });

  it('lit les impayés à relancer par page de 3, sans tri', () => {
    api.impayes(1, 3).subscribe();
    const request = http.expectOne((r) => r.method === 'GET' && r.url === '/api/tableau-de-bord/impayes');
    expect(request.request.params.get('page')).toBe('1');
    expect(request.request.params.get('size')).toBe('3');
    expect(request.request.params.has('sort')).toBe(false);
    request.flush(pageOf([impaye()], 5, 1, 3));
  });
});
