import { DestroyRef, Injectable, NgZone, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth/auth-service';
import { SettingsService } from './settings-service';

const EVENEMENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'wheel'] as const;

/**
 * Déconnexion après `inactiviteMin` minutes sans action de l'utilisateur (RG-AUT-06, 0 = désactivée), puis
 * écran de connexion avec « Votre session a été fermée. ». Démarré par le cadre de l'application.
 */
@Injectable({ providedIn: 'root' })
export class IdleService {
  private readonly auth = inject(AuthService);
  private readonly settings = inject(SettingsService);
  private readonly router = inject(Router);
  private readonly zone = inject(NgZone);
  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly onActivity = () => this.arm();
  private started = false;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.stop());
  }

  start(): void {
    if (this.started || typeof window === 'undefined') {
      return;
    }
    this.started = true;
    this.zone.runOutsideAngular(() => {
      for (const evenement of EVENEMENTS) {
        window.addEventListener(evenement, this.onActivity, { passive: true });
      }
    });
    this.arm();
  }

  stop(): void {
    if (!this.started) {
      return;
    }
    this.started = false;
    for (const evenement of EVENEMENTS) {
      window.removeEventListener(evenement, this.onActivity);
    }
    this.clear();
  }

  private arm(): void {
    this.clear();
    const minutes = this.settings.inactiviteMin();
    if (minutes <= 0) {
      return;
    }
    this.timer = setTimeout(() => this.zone.run(() => this.expire()), minutes * 60_000);
  }

  private expire(): void {
    this.stop();
    if (this.auth.isAuthenticated()) {
      this.auth.logout();
      this.router.navigate(['/connexion'], { queryParams: { raison: 'deconnecte' } });
    }
  }

  private clear(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
