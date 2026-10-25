import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ListQuery, buildListParams } from '../../core/api/list-params';
import { PageResponse } from '../../core/api/page-response';
import {
  ConditionsLocation,
  LocationCompteurs,
  LocationCreation,
  LocationDTO,
  LocationModification,
} from './location.models';

const LOCATIONS_URL = '/api/locations';
const GARAGES_URL = '/api/garages';

@Injectable({ providedIn: 'root' })
export class LocationApi {
  private readonly http = inject(HttpClient);

  list(query: ListQuery): Observable<PageResponse<LocationDTO>> {
    return this.http.get<PageResponse<LocationDTO>>(LOCATIONS_URL, { params: buildListParams(query) });
  }

  /** Compteurs par statut ; ils tiennent compte de la recherche mais couvrent tous les statuts et ignorent les bornes de fin. */
  counters(q: string): Observable<LocationCompteurs> {
    const search = q.trim();
    return this.http.get<LocationCompteurs>(`${LOCATIONS_URL}/compteurs`, {
      params: search ? new HttpParams().set('q', search) : new HttpParams(),
    });
  }

  /** Historique des locations d'un garage (RG-GAR-43) ; sans tri, du plus récent au plus ancien. */
  listForGarage(garageId: number, query: ListQuery): Observable<PageResponse<LocationDTO>> {
    return this.http.get<PageResponse<LocationDTO>>(`${GARAGES_URL}/${garageId}/locations`, {
      params: buildListParams(query),
    });
  }

  /** Clés disponibles, réserve et loyer à la date de début (RG-LOC-14). */
  conditions(garageId: number, dateDebut: string | null): Observable<ConditionsLocation> {
    return this.http.get<ConditionsLocation>(`${GARAGES_URL}/${garageId}/conditions-location`, {
      params: dateDebut ? new HttpParams().set('dateDebut', dateDebut) : new HttpParams(),
    });
  }

  create(body: LocationCreation): Observable<LocationDTO> {
    return this.http.post<LocationDTO>(LOCATIONS_URL, body);
  }

  update(id: number, body: LocationModification): Observable<LocationDTO> {
    return this.http.put<LocationDTO>(`${LOCATIONS_URL}/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${LOCATIONS_URL}/${id}`);
  }
}
