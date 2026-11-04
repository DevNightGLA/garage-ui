import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { buildListParams } from '../../core/api/list-params';
import { PageResponse } from '../../core/api/page-response';
import { AvisLoyerDTO } from '../messages/messages.models';
import { ImpayeARelancer, RemarqueATraiter, TableauDeBord } from './tableau-de-bord.models';

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

  /** « Avis de loyer à communiquer » (RG-DAS-07) : à envoyer ou à contacter, les plus proches d'abord. */
  avis(): Observable<AvisLoyerDTO[]> {
    return this.http.get<AvisLoyerDTO[]>(`${TABLEAU_DE_BORD_URL}/avis`);
  }

  /** « Remarques à traiter » : problèmes non résolus, les plus récents d'abord. */
  remarques(page: number, size: number): Observable<PageResponse<RemarqueATraiter>> {
    return this.http.get<PageResponse<RemarqueATraiter>>(`${TABLEAU_DE_BORD_URL}/remarques`, {
      params: buildListParams({ page, size }),
    });
  }
}
