import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ListQuery, buildListParams } from '../../core/api/list-params';
import { PageResponse } from '../../core/api/page-response';
import { PaiementDTO, PaiementSaisie, PaiementSynthese, VersementsDetail } from './paiement.models';

const PAIEMENTS_URL = '/api/paiements';

@Injectable({ providedIn: 'root' })
export class PaiementApi {
  private readonly http = inject(HttpClient);

  /** Lignes d'un mois : le mois (`yyyy-MM`) et le statut sont des filtres de la liste. */
  list(query: ListQuery): Observable<PageResponse<PaiementDTO>> {
    return this.http.get<PageResponse<PaiementDTO>>(PAIEMENTS_URL, { params: buildListParams(query) });
  }

  /** Compteurs par statut et indicateurs du mois ; ils tiennent compte de la recherche mais pas du statut. */
  summary(mois: string, q: string): Observable<PaiementSynthese> {
    let params = new HttpParams().set('mois', mois);
    const search = q.trim();
    if (search) {
      params = params.set('q', search);
    }
    return this.http.get<PaiementSynthese>(`${PAIEMENTS_URL}/synthese`, { params });
  }

  versements(locationId: number, mois: string): Observable<VersementsDetail> {
    return this.http.get<VersementsDetail>(`${PAIEMENTS_URL}/versements`, {
      params: new HttpParams().set('locationId', locationId).set('mois', mois),
    });
  }

  /** Enregistre un versement ; l'API renvoie la ligne mise à jour. */
  pay(body: PaiementSaisie): Observable<PaiementDTO> {
    return this.http.post<PaiementDTO>(PAIEMENTS_URL, body);
  }

  cancelVersement(id: number): Observable<void> {
    return this.http.delete<void>(`${PAIEMENTS_URL}/versements/${id}`);
  }
}
