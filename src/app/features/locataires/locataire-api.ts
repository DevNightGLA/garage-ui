import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ListQuery, buildListParams } from '../../core/api/list-params';
import { PageResponse } from '../../core/api/page-response';
import { LocataireCompteurs, LocataireDTO, LocataireEnvoi } from './locataire.models';

const LOCATAIRES_URL = '/api/locataires';

@Injectable({ providedIn: 'root' })
export class LocataireApi {
  private readonly http = inject(HttpClient);

  list(query: ListQuery): Observable<PageResponse<LocataireDTO>> {
    return this.http.get<PageResponse<LocataireDTO>>(LOCATAIRES_URL, { params: buildListParams(query) });
  }

  /** Compteurs par statut ; ils tiennent compte de la recherche mais couvrent tous les statuts. */
  counters(q: string): Observable<LocataireCompteurs> {
    const search = q.trim();
    return this.http.get<LocataireCompteurs>(`${LOCATAIRES_URL}/compteurs`, {
      params: search ? new HttpParams().set('q', search) : new HttpParams(),
    });
  }

  /** `force` renvoie la même requête malgré l'alerte de doublon (RG-LOCT-04). */
  create(body: LocataireEnvoi, force = false): Observable<LocataireDTO> {
    return this.http.post<LocataireDTO>(LOCATAIRES_URL, body, { params: forceParams(force) });
  }

  update(id: number, body: LocataireEnvoi, force = false): Observable<LocataireDTO> {
    return this.http.put<LocataireDTO>(`${LOCATAIRES_URL}/${id}`, body, { params: forceParams(force) });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${LOCATAIRES_URL}/${id}`);
  }
}

function forceParams(force: boolean): HttpParams {
  return force ? new HttpParams().set('force', 'true') : new HttpParams();
}
