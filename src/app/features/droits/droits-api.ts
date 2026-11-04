import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { DroitAppareil, DroitProfil } from '../../core/rights/rights.models';

/** Droits d'accès : docs/api-contract.md, section 12 (RG chapitres 18 et 23). */
@Injectable({ providedIn: 'root' })
export class DroitsApi {
  private readonly http = inject(HttpClient);

  /** Grille 4 profils × 19 écrans (colonne Admin calculée). */
  profils(): Observable<DroitProfil[]> {
    return this.http.get<DroitProfil[]>('/api/droits/profils');
  }

  /** Lignes modifiées seulement (brouillon) ; renvoie la grille. */
  saveProfils(lignes: DroitProfil[]): Observable<DroitProfil[]> {
    return this.http.put<DroitProfil[]>('/api/droits/profils', lignes);
  }

  /** Admin seulement. */
  appareils(): Observable<DroitAppareil[]> {
    return this.http.get<DroitAppareil[]>('/api/droits/appareils');
  }

  saveAppareils(lignes: DroitAppareil[]): Observable<DroitAppareil[]> {
    return this.http.put<DroitAppareil[]>('/api/droits/appareils', lignes);
  }
}
