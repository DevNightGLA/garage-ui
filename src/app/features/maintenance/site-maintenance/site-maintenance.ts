import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../core/auth/auth-service';
import { LanguageSwitch } from '../../../layout/language-switch';
import { INTERVALLE_VERIF_DEFAUT_SEC, MaintenanceApi } from '../maintenance-api';

/**
 * Page « Site en maintenance » (RG-MNT-02, RG-MNT-03). Elle vérifie l'état toutes les `intervalleVerifSec`
 * secondes (paramètre `maintenance_verif_sec`) et sur « Réessayer » ; dès la réactivation, l'utilisateur retrouve
 * l'application. `?apercu=1` : prévisualisation par l'Admin depuis l'écran Maintenance (RG-MNT-04), sans vérification.
 */
@Component({
  selector: 'app-site-maintenance',
  imports: [TranslatePipe, LanguageSwitch],
  templateUrl: './site-maintenance.html',
  styleUrl: './site-maintenance.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteMaintenance {
  private readonly api = inject(MaintenanceApi);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly preview = inject(ActivatedRoute).snapshot.queryParamMap.get('apercu') === '1';
  protected readonly busy = signal(false);
  protected readonly stillActive = signal(false);
  private timer: ReturnType<typeof setTimeout> | null = null;
  private intervalSec = INTERVALLE_VERIF_DEFAUT_SEC;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.clearTimer());
    if (!this.preview) {
      // Première lecture tout de suite : elle donne l'intervalle réglé par l'Admin.
      void this.check().then((active) => active && this.schedule());
    }
  }

  /** « Réessayer » : vérification immédiate, message si le site est toujours en maintenance. */
  protected async retry(): Promise<void> {
    if (this.busy()) {
      return;
    }
    this.busy.set(true);
    this.stillActive.set(false);
    const active = await this.check();
    this.busy.set(false);
    this.stillActive.set(active);
    if (active) {
      this.schedule();
    }
  }

  /** « Accès administrateur » : la session courante est fermée pour que l'Admin se connecte. */
  protected adminAccess(): void {
    this.auth.logout();
    this.router.navigate(['/connexion']);
  }

  protected leavePreview(): void {
    this.router.navigate(['/maintenance']);
  }

  /** Vrai si le site est toujours en maintenance ; sinon, retour à l'application. */
  private async check(): Promise<boolean> {
    try {
      const etat = await firstValueFrom(this.api.etat());
      if (etat.intervalleVerifSec > 0) {
        this.intervalSec = etat.intervalleVerifSec;
      }
      if (!etat.active) {
        this.clearTimer();
        await firstValueFrom(this.auth.restoreSession());
        await this.router.navigateByUrl('/');
        return false;
      }
    } catch {
      // API injoignable : on réessaiera au prochain intervalle
    }
    return true;
  }

  private schedule(): void {
    this.clearTimer();
    this.timer = setTimeout(async () => {
      if (await this.check()) {
        this.schedule();
      }
    }, this.intervalSec * 1000);
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
