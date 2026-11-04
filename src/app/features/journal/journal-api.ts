import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PageResponse } from '../../core/api/page-response';
import { AuditConcept, DetailAuditDTO, JournalCriteria, OperationAuditDTO } from './journal.models';

const URL = '/api/journal';
/** Opérations chargées par lot (« Afficher plus »). */
export const JOURNAL_PAGE_SIZE = 20;

@Injectable({ providedIn: 'root' })
export class JournalApi {
  private readonly http = inject(HttpClient);

  list(criteria: JournalCriteria, page: number, size = JOURNAL_PAGE_SIZE): Observable<PageResponse<OperationAuditDTO>> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', `dateHeure,${criteria.asc ? 'asc' : 'desc'}`);
    if (criteria.du) {
      params = params.set('du', criteria.du);
    }
    if (criteria.au) {
      params = params.set('au', criteria.au);
    }
    if (criteria.utilisateurs.length) {
      params = params.set('utilisateurs', criteria.utilisateurs.join(','));
    }
    if (criteria.concepts.length) {
      params = params.set('concepts', criteria.concepts.join(','));
    }
    if (criteria.action) {
      params = params.set('action', { C: 'CREATION', M: 'MODIFICATION', S: 'SUPPRESSION' }[criteria.action]);
    }
    const q = criteria.q.trim();
    if (q) {
      params = params.set('q', q);
    }
    return this.http.get<PageResponse<OperationAuditDTO>>(URL, { params });
  }

  /** Fil conducteur d'un enregistrement, du plus ancien au plus récent. */
  record(concept: AuditConcept, id: number): Observable<OperationAuditDTO[]> {
    return this.http.get<OperationAuditDTO[]>(`${URL}/${concept}/${id}`);
  }

  detail(concept: AuditConcept, id: number, revisionId: number): Observable<DetailAuditDTO> {
    return this.http.get<DetailAuditDTO>(`${URL}/${concept}/${id}/${revisionId}`);
  }
}
