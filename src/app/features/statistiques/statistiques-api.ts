import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Statistiques } from './statistiques.models';

@Injectable({ providedIn: 'root' })
export class StatistiquesApi {
  private readonly http = inject(HttpClient);

  get(annee: number): Observable<Statistiques> {
    return this.http.get<Statistiques>('/api/statistiques', { params: new HttpParams().set('annee', annee) });
  }
}
