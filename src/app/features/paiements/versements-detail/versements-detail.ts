import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';
import { toApiError } from '../../../core/api/api-error';
import { ErrorMessageService } from '../../../core/api/error-message-service';
import { LanguageService } from '../../../core/language-service';
import { RoleService } from '../../../core/role-service';
import { isoToDisplay } from '../../../shared/date-input/date-utils';
import { Modal } from '../../../shared/modal/modal';
import { monthLabel } from '../../../shared/month-picker/month-utils';
import { Tooltip } from '../../../shared/tooltip/tooltip';
import { PaiementApi } from '../paiement-api';
import { PaiementDTO, Versement } from '../paiement.models';

/**
 * Détail des versements d'une ligne (RG-PAI-24) : montant dû, reçu, reste dû, puis chaque versement
 * avec sa date, son mode et son montant. L'Admin peut annuler un versement (RG-PAI-25) ; le reste dû
 * et le statut sont alors recalculés par l'API.
 */
@Component({
  selector: 'app-versements-detail',
  imports: [CurrencyPipe, TranslatePipe, Modal, Tooltip],
  templateUrl: './versements-detail.html',
  styleUrl: './versements-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VersementsModal {
  readonly paiement = input.required<PaiementDTO>();
  /** Mois de la ligne, `yyyy-MM`. */
  readonly mois = input.required<string>();
  readonly closed = output<void>();
  /** Un versement a été annulé : la liste de l'écran et ses indicateurs doivent se recharger. */
  readonly changed = output<void>();

  protected readonly roles = inject(RoleService);
  private readonly api = inject(PaiementApi);
  private readonly errors = inject(ErrorMessageService);
  private readonly language = inject(LanguageService);

  protected readonly cancelError = signal<string | null>(null);

  protected readonly detail = rxResource({
    params: () => ({ locationId: this.paiement().locationId, mois: this.mois() }),
    stream: ({ params }) => this.api.versements(params.locationId, params.mois),
  });
  // `value()` lève une exception quand la ressource est en erreur : on le lit seulement s'il existe.
  protected readonly data = computed(() => (this.detail.hasValue() ? this.detail.value() : null));
  protected readonly loadError = computed(() => {
    const error = this.detail.error();
    return error ? this.errors.text(toApiError(error)) : null;
  });

  /** « Marie Dupont · G01 · Octobre 2026 » */
  protected readonly who = computed(() => {
    const { locataire, garage } = this.paiement();
    return `${locataire.prenom} ${locataire.nom} · ${garage.numero} · ${monthLabel(this.language.lang(), this.mois())}`;
  });

  protected date(iso: string): string {
    return isoToDisplay(iso);
  }

  protected cancel(versement: Versement): void {
    this.cancelError.set(null);
    this.api.cancelVersement(versement.id).subscribe({
      next: () => {
        this.detail.reload();
        this.changed.emit();
      },
      error: (err: unknown) => this.cancelError.set(this.errors.text(toApiError(err))),
    });
  }
}
