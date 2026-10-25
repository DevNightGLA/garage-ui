import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ListQuery, buildListParams } from '../../core/api/list-params';
import { PageResponse } from '../../core/api/page-response';
import {
  GarageCompteurs,
  GarageCreation,
  GarageDTO,
  GarageModification,
  LoyerDTO,
  LoyerEnvoi,
} from './garage.models';

const GARAGES_URL = '/api/garages';
const LOYERS_URL = '/api/loyers';

@Injectable({ providedIn: 'root' })
export class GarageApi {
  private readonly http = inject(HttpClient);

  list(query: ListQuery): Observable<PageResponse<GarageDTO>> {
    return this.http.get<PageResponse<GarageDTO>>(GARAGES_URL, { params: buildListParams(query) });
  }

  /** Compteurs par statut ; ils tiennent compte de la recherche mais couvrent tous les statuts. */
  counters(q: string): Observable<GarageCompteurs> {
    const search = q.trim();
    return this.http.get<GarageCompteurs>(`${GARAGES_URL}/compteurs`, {
      params: search ? new HttpParams().set('q', search) : new HttpParams(),
    });
  }

  nextNumber(): Observable<{ numero: string }> {
    return this.http.get<{ numero: string }>(`${GARAGES_URL}/prochain-numero`);
  }

  create(body: GarageCreation): Observable<GarageDTO> {
    return this.http.post<GarageDTO>(GARAGES_URL, body);
  }

  update(id: number, body: GarageModification): Observable<GarageDTO> {
    return this.http.put<GarageDTO>(`${GARAGES_URL}/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${GARAGES_URL}/${id}`);
  }

  loyers(garageId: number, page: number, size: number): Observable<PageResponse<LoyerDTO>> {
    return this.http.get<PageResponse<LoyerDTO>>(`${GARAGES_URL}/${garageId}/loyers`, {
      params: buildListParams({ page, size }),
    });
  }

  createLoyer(garageId: number, body: LoyerEnvoi): Observable<LoyerDTO> {
    return this.http.post<LoyerDTO>(`${GARAGES_URL}/${garageId}/loyers`, body);
  }

  updateLoyer(id: number, body: LoyerEnvoi): Observable<LoyerDTO> {
    return this.http.put<LoyerDTO>(`${LOYERS_URL}/${id}`, body);
  }

  deleteLoyer(id: number): Observable<void> {
    return this.http.delete<void>(`${LOYERS_URL}/${id}`);
  }
}
