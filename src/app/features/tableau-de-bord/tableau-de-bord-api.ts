import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { buildListParams } from '../../core/api/list-params';
import { PageResponse } from '../../core/api/page-response';
import { ImpayeARelancer, TableauDeBord } from './tableau-de-bord.models';

const TABLEAU_DE_BORD_URL = '/api/tableau-de-bord';

@Injectable({ providedIn: 'root' })
export class TableauDeBordApi {
  private readonly http = inject(HttpClient);

  get(): Observable<TableauDeBord> {
    return this.http.get<TableauDeBord>(TABLEAU_DE_BORD_URL);
  }

  /** « Impayés à relancer » : l'ordre est fixé par l'API (un `sort` serait ignoré). */
  impayes(page: number, size: number): Observable<PageResponse<ImpayeARelancer>> {
    return this.http.get<PageResponse<ImpayeARelancer>>(`${TABLEAU_DE_BORD_URL}/impayes`, {
      params: buildListParams({ page, size }),
    });
  }
}
