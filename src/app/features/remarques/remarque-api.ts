import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { RemarqueCible, RemarqueDTO, RemarqueEnvoi } from './remarque.models';

const REMARQUES_URL = '/api/remarques';

@Injectable({ providedIn: 'root' })
export class RemarqueApi {
  private readonly http = inject(HttpClient);

  /** Remarques d'un garage ou d'un locataire, non paginées, de la plus récente à la plus ancienne. */
  list(cible: RemarqueCible): Observable<RemarqueDTO[]> {
    return this.http.get<RemarqueDTO[]>(this.cibleUrl(cible));
  }

  create(cible: RemarqueCible, body: RemarqueEnvoi): Observable<RemarqueDTO> {
    return this.http.post<RemarqueDTO>(this.cibleUrl(cible), body);
  }

  update(id: number, body: RemarqueEnvoi): Observable<RemarqueDTO> {
    return this.http.put<RemarqueDTO>(`${REMARQUES_URL}/${id}`, body);
  }

  /** Marque un problème résolu à la date donnée (`yyyy-MM-dd`, RG-REM-05). */
  resolve(id: number, dateResolution: string): Observable<RemarqueDTO> {
    return this.http.post<RemarqueDTO>(`${REMARQUES_URL}/${id}/resolution`, { dateResolution });
  }

  /** Rouvre un problème résolu (RG-REM-06). */
  reopen(id: number): Observable<RemarqueDTO> {
    return this.http.delete<RemarqueDTO>(`${REMARQUES_URL}/${id}/resolution`);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${REMARQUES_URL}/${id}`);
  }

  private cibleUrl(cible: RemarqueCible): string {
    return `/api/${cible.type === 'garage' ? 'garages' : 'locataires'}/${cible.id}/remarques`;
  }
}
