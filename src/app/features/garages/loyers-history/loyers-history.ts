import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { toApiError } from '../../../core/api/api-error';
import { ErrorMessageService } from '../../../core/api/error-message-service';
import { RoleService } from '../../../core/role-service';
import { isoToDisplay } from '../../../shared/date-input/date-utils';
import { Modal } from '../../../shared/modal/modal';
import { Pagination } from '../../../shared/pagination/pagination';
import { BadgeTone, StatusBadge } from '../../../shared/status-badge/status-badge';
import { Tooltip } from '../../../shared/tooltip/tooltip';
import { GarageApi } from '../garage-api';
import { GarageDTO, LoyerDTO, LoyerEtat } from '../garage.models';
import { LoyerForm } from '../loyer-form/loyer-form';

export const LOYERS_PAGE_SIZE = 5;

const ETAT_TONE: Record<LoyerEtat, BadgeTone> = {
  A_VENIR: 'info',
  EN_VIGUEUR: 'success',
  CLOTURE: 'ancien',
};

/**
 * Historique des loyers d'un garage (RG-LOY). L'API dit si un loyer est modifiable
 * ou supprimable et pourquoi pas (`motifModification`, `motifSuppression`) : le
 * front n'applique aucune de ces règles, il affiche et relaie.
 */
@Component({
  selector: 'app-loyers-history',
  imports: [CurrencyPipe, TranslatePipe, Modal, Pagination, StatusBadge, Tooltip, LoyerForm],
  templateUrl: './loyers-history.html',
  styleUrl: './loyers-history.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoyersHistory {
  readonly garage = input.required<GarageDTO>();
  readonly closed = output<void>();
  /** Un loyer a été créé, modifié ou supprimé : le loyer courant du garage a pu changer. */
  readonly changed = output<void>();

  protected readonly roles = inject(RoleService);
  private readonly api = inject(GarageApi);
  private readonly errors = inject(ErrorMessageService);
  private readonly translate = inject(TranslateService);

  protected readonly pageSize = LOYERS_PAGE_SIZE;
  protected readonly page = signal(0);
  protected readonly form = signal<{ loyer: LoyerDTO | null } | null>(null);
  protected readonly deleteError = signal<string | null>(null);

  protected readonly list = rxResource({
    params: () => ({ id: this.garage().id, page: this.page() }),
    stream: ({ params }) => this.api.loyers(params.id, params.page, LOYERS_PAGE_SIZE),
  });
  protected readonly rows = computed(() => (this.list.hasValue() ? this.list.value().content : []));
  protected readonly total = computed(() => (this.list.hasValue() ? this.list.value().totalElements : 0));
  protected readonly loadError = computed(() => {
    const error = this.list.error();
    return error ? this.errors.text(toApiError(error)) : null;
  });

  protected tone(etat: LoyerEtat): BadgeTone {
    return ETAT_TONE[etat];
  }

  protected date(iso: string | null): string {
    return isoToDisplay(iso);
  }

  /** Seul le dernier loyer (le plus récent, en tête de la première page) porte des actions (RG-LOY-06, 07). */
  protected hasActions(index: number): boolean {
    return this.page() === 0 && index === 0;
  }

  protected canDelete(loyer: LoyerDTO, index: number): boolean {
    return this.roles.canWrite() && this.hasActions(index) && loyer.etat === 'A_VENIR';
  }

  protected editTooltip(loyer: LoyerDTO): string {
    if (this.roles.isReadOnly()) {
      return this.translate.instant('loyers.visualiser');
    }
    return loyer.modifiable ? this.translate.instant('loyers.modifier') : (loyer.motifModification ?? '');
  }

  protected deleteTooltip(loyer: LoyerDTO): string {
    return loyer.supprimable ? this.translate.instant('loyers.supprimer') : (loyer.motifSuppression ?? '');
  }

  protected openNew(): void {
    this.form.set({ loyer: null });
  }

  protected openEdit(loyer: LoyerDTO): void {
    if (this.roles.isReadOnly() || loyer.modifiable) {
      this.form.set({ loyer });
    }
  }

  protected remove(loyer: LoyerDTO): void {
    if (!loyer.supprimable) {
      return;
    }
    this.deleteError.set(null);
    this.api.deleteLoyer(loyer.id).subscribe({
      next: () => this.reload(),
      error: (err: unknown) => this.deleteError.set(this.errors.text(toApiError(err))),
    });
  }

  protected formSaved(): void {
    this.form.set(null);
    this.deleteError.set(null);
    this.page.set(0);
    this.reload();
  }

  private reload(): void {
    this.list.reload();
    this.changed.emit();
  }
}
