import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { toApiError } from '../../../core/api/api-error';
import { ErrorMessageService } from '../../../core/api/error-message-service';
import { ROLES } from '../../../core/auth/auth.models';
import { Confirm } from '../../../shared/confirm/confirm';
import { ToastService } from '../../../shared/toast/toast';
import { PROFILS } from '../../utilisateurs/utilisateur.models';
import { MaintenanceApi } from '../maintenance-api';

/**
 * Maintenance (RG-MNT, maquette « Gestion des utilisateurs » > Maintenance), Admin seulement : état du site,
 * mise en maintenance après confirmation, réactivation directe, aperçu de la page affichée aux utilisateurs,
 * comptes actifs par profil et accès pendant la maintenance (seul l'Admin garde l'accès).
 */
@Component({
  selector: 'app-maintenance-page',
  imports: [TranslatePipe, RouterLink, Confirm],
  templateUrl: './maintenance-page.html',
  styleUrl: './maintenance-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MaintenancePage {
  private readonly api = inject(MaintenanceApi);
  private readonly errors = inject(ErrorMessageService);
  private readonly translate = inject(TranslateService);
  private readonly toasts = inject(ToastService);

  protected readonly roles = ROLES;
  protected readonly profils = PROFILS;
  protected readonly state = rxResource({ stream: () => this.api.detail() });
  protected readonly active = computed(() => (this.state.hasValue() ? this.state.value().active : false));
  protected readonly loadError = computed(() => {
    const error = this.state.error();
    return error ? this.errors.text(toApiError(error)) : null;
  });

  protected readonly confirming = signal(false);
  protected readonly pending = signal(false);
  protected readonly confirmError = signal<string | null>(null);

  protected accounts(role: (typeof ROLES)[number]): number {
    return this.state.hasValue() ? (this.state.value().comptesActifsParProfil?.[role] ?? 0) : 0;
  }

  protected toggle(): void {
    if (this.active()) {
      this.change(false);
    } else {
      this.confirmError.set(null);
      this.confirming.set(true);
    }
  }

  protected change(active: boolean): void {
    if (this.pending()) {
      return;
    }
    this.pending.set(true);
    this.api
      .changer(active)
      .pipe(finalize(() => this.pending.set(false)))
      .subscribe({
        next: (state) => {
          this.confirming.set(false);
          this.state.set({ ...(this.state.hasValue() ? this.state.value() : state), ...state, active });
          this.toasts.show(this.translate.instant(active ? 'maintenance.admin.activee' : 'maintenance.admin.desactivee'));
        },
        error: (err: unknown) => {
          const message = this.errors.text(toApiError(err));
          if (this.confirming()) {
            this.confirmError.set(message);
          } else {
            this.toasts.show(message, 'error');
          }
        },
      });
  }
}
