import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { Role } from '../auth/auth.models';
import { DeviceService } from '../device-service';
import { Action, DroitsMoi, Ecran } from './rights.models';

/** Écran toujours disponible sur tous les appareils, pour ne pas se bloquer (RG-APP-02). */
const TOUJOURS_SUR_APPAREIL: readonly Ecran[] = ['DRO'];

/**
 * Droits du compte connecté (`GET /api/droits/moi`), relus après chaque connexion et à chaque refus 403
 * `ACCES_REFUSE`. Ils pilotent le menu, les boutons et les fenêtres en consultation ; le back reste l'autorité.
 */
@Injectable({ providedIn: 'root' })
export class RightsService {
  private readonly http = inject(HttpClient);
  private readonly device = inject(DeviceService);
  private readonly droits = signal<DroitsMoi | null>(null);

  readonly loaded = computed(() => this.droits() !== null);
  readonly profil = computed<Role | null>(() => this.droits()?.profil ?? null);

  /** `can('GAR', 'm')` : le profil a-t-il ce droit sur cet écran ? */
  can(ecran: Ecran, action: Action = 'v'): boolean {
    const ligne = this.droits()?.ecrans.find((droit) => droit.ecran === ecran);
    if (!ligne || !ligne.peutVoir) {
      return false;
    }
    switch (action) {
      case 'v':
        return true;
      case 'a':
        return ligne.peutAjouter;
      case 'm':
        return ligne.peutModifier;
      case 'd':
        return ligne.peutSupprimer;
    }
  }

  /** L'écran est-il disponible sur l'appareil courant (réglage de l'Admin, RG-APP-02 à 04) ? */
  allowedOnDevice(ecran: Ecran): boolean {
    const mode = this.device.mode();
    if (mode === 'ORDINATEUR' || TOUJOURS_SUR_APPAREIL.includes(ecran)) {
      return true;
    }
    const ligne = this.droits()?.appareils.find((droit) => droit.appareil === mode && droit.ecran === ecran);
    return ligne?.autorise ?? true;
  }

  /** Visible au menu : droit voir et disponible sur l'appareil. */
  visible(ecran: Ecran): boolean {
    return this.can(ecran, 'v') && this.allowedOnDevice(ecran);
  }

  load(): Observable<boolean> {
    return this.http.get<DroitsMoi>('/api/droits/moi').pipe(
      tap((droits) => this.droits.set(droits)),
      map(() => true),
      catchError(() => of(false)),
    );
  }

  /** Remplace les droits connus (tests, ou réponse déjà reçue). */
  use(droits: DroitsMoi): void {
    this.droits.set(droits);
  }

  clear(): void {
    this.droits.set(null);
  }
}
