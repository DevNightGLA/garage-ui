import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Chronologie, ChronologieFiltre } from './chronologie.models';

@Injectable({ providedIn: 'root' })
export class ChronologieApi {
  private readonly http = inject(HttpClient);

  /** Événements du plus récent au plus ancien, agrégés et paginés par le back. */
  get(locataireId: number, filtre: ChronologieFiltre, size: number): Observable<Chronologie> {
    const params = new HttpParams().set('filtre', filtre).set('page', 0).set('size', size);
    return this.http.get<Chronologie>(`/api/locataires/${locataireId}/chronologie`, { params });
  }
}
