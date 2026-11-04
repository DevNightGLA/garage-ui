import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ListQuery, buildListParams } from '../../core/api/list-params';
import { PageResponse } from '../../core/api/page-response';
import { CompteursUtilisateurs, MotDePasseTemporaireDTO, UtilisateurDTO, UtilisateurSaisie } from './utilisateur.models';

const URL = '/api/utilisateurs';

@Injectable({ providedIn: 'root' })
export class UtilisateurApi {
  private readonly http = inject(HttpClient);

  list(query: ListQuery): Observable<PageResponse<UtilisateurDTO>> {
    return this.http.get<PageResponse<UtilisateurDTO>>(URL, { params: buildListParams(query) });
  }

  counters(): Observable<CompteursUtilisateurs> {
    return this.http.get<CompteursUtilisateurs>(`${URL}/compteurs`);
  }

  create(saisie: UtilisateurSaisie): Observable<MotDePasseTemporaireDTO> {
    return this.http.post<MotDePasseTemporaireDTO>(URL, saisie);
  }

  update(id: number, saisie: UtilisateurSaisie): Observable<UtilisateurDTO> {
    return this.http.put<UtilisateurDTO>(`${URL}/${id}`, saisie);
  }

  resetPassword(id: number): Observable<MotDePasseTemporaireDTO> {
    return this.http.post<MotDePasseTemporaireDTO>(`${URL}/${id}/reinitialisation`, {});
  }

  deactivate(id: number): Observable<UtilisateurDTO> {
    return this.http.post<UtilisateurDTO>(`${URL}/${id}/desactivation`, {});
  }

  reactivate(id: number): Observable<UtilisateurDTO> {
    return this.http.delete<UtilisateurDTO>(`${URL}/${id}/desactivation`);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${URL}/${id}`);
  }
}
