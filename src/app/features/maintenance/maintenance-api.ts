import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Role } from '../../core/auth/auth.models';

/** `GET /api/maintenance/etat` (public) et `GET /api/maintenance` (Admin) : docs/api-contract.md, section 16. */
export interface MaintenanceEtat {
  active: boolean;
  /** Secondes entre deux vérifications de la page « Site en maintenance » (paramètre `maintenance_verif_sec`). */
  intervalleVerifSec: number;
  comptesActifsParProfil?: Partial<Record<Role, number>> | null;
}

/** Intervalle par défaut tant que l'API ne l'a pas donné (valeur de départ du paramètre). */
export const INTERVALLE_VERIF_DEFAUT_SEC = 15;

@Injectable({ providedIn: 'root' })
export class MaintenanceApi {
  private readonly http = inject(HttpClient);

  etat(): Observable<MaintenanceEtat> {
    return this.http.get<MaintenanceEtat>('/api/maintenance/etat');
  }

  detail(): Observable<MaintenanceEtat> {
    return this.http.get<MaintenanceEtat>('/api/maintenance');
  }

  changer(active: boolean): Observable<MaintenanceEtat> {
    return this.http.put<MaintenanceEtat>('/api/maintenance', { active });
  }
}
