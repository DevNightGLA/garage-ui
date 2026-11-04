import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ListQuery, buildListParams } from '../../core/api/list-params';
import { PageResponse } from '../../core/api/page-response';
import {
  ApercuMessageDTO,
  AvisLoyerDTO,
  CompteursAvis,
  CompteursRelances,
  DestinatairesLibre,
  EnvoiResultat,
  MessageLibre,
  MoyenManuel,
  RelanceDTO,
} from './messages.models';

const URL = '/api/messages';

function search(q: string): HttpParams {
  const value = q.trim();
  return value ? new HttpParams().set('q', value) : new HttpParams();
}

@Injectable({ providedIn: 'root' })
export class MessagesApi {
  private readonly http = inject(HttpClient);

  // --- Avis de loyer (écran AVI) ---
  avis(query: ListQuery): Observable<PageResponse<AvisLoyerDTO>> {
    return this.http.get<PageResponse<AvisLoyerDTO>>(`${URL}/avis`, { params: buildListParams(query) });
  }

  avisCounters(q: string): Observable<CompteursAvis> {
    return this.http.get<CompteursAvis>(`${URL}/avis/compteurs`, { params: search(q) });
  }

  /** Aperçu d'un avis à communiquer, ou de celui déjà envoyé (`avisId`). */
  avisPreview(avis: Pick<AvisLoyerDTO, 'avisId' | 'locationId' | 'loyerGarageId'>): Observable<ApercuMessageDTO> {
    return avis.avisId !== null
      ? this.http.get<ApercuMessageDTO>(`${URL}/avis/${avis.avisId}/apercu`)
      : this.http.get<ApercuMessageDTO>(`${URL}/avis/apercu`, {
          params: new HttpParams().set('locationId', avis.locationId).set('loyerGarageId', avis.loyerGarageId),
        });
  }

  sendAvis(lignes: { locationId: number; loyerGarageId: number }[]): Observable<EnvoiResultat> {
    return this.http.post<EnvoiResultat>(`${URL}/avis/envoi`, { lignes });
  }

  avisInforme(body: { locationId: number; loyerGarageId: number; moyen: MoyenManuel; date: string }): Observable<unknown> {
    return this.http.post(`${URL}/avis/informe`, body);
  }

  // --- Relances d'impayés (écran REL) ---
  relances(query: ListQuery): Observable<PageResponse<RelanceDTO>> {
    return this.http.get<PageResponse<RelanceDTO>>(`${URL}/relances`, { params: buildListParams(query) });
  }

  relanceCounters(q: string): Observable<CompteursRelances> {
    return this.http.get<CompteursRelances>(`${URL}/relances/compteurs`, { params: search(q) });
  }

  relancePreview(relance: Pick<RelanceDTO, 'relanceId' | 'echeanceId'>): Observable<ApercuMessageDTO> {
    return relance.relanceId !== null
      ? this.http.get<ApercuMessageDTO>(`${URL}/relances/${relance.relanceId}/apercu`)
      : this.http.get<ApercuMessageDTO>(`${URL}/relances/apercu`, {
          params: new HttpParams().set('echeanceId', relance.echeanceId),
        });
  }

  sendRelances(lignes: { echeanceId: number }[]): Observable<EnvoiResultat> {
    return this.http.post<EnvoiResultat>(`${URL}/relances/envoi`, { lignes });
  }

  relanceManuelle(body: { echeanceId: number; moyen: MoyenManuel; date: string }): Observable<unknown> {
    return this.http.post(`${URL}/relances/manuelle`, body);
  }

  // --- Message libre (écran LIB) ---
  libreRecipients(): Observable<DestinatairesLibre> {
    return this.http.get<DestinatairesLibre>(`${URL}/libre/destinataires`);
  }

  librePreview(message: MessageLibre): Observable<ApercuMessageDTO> {
    return this.http.post<ApercuMessageDTO>(`${URL}/libre/apercu`, message);
  }

  sendLibre(message: MessageLibre): Observable<EnvoiResultat> {
    return this.http.post<EnvoiResultat>(`${URL}/libre/envoi`, message);
  }
}
