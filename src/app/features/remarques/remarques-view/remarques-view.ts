import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';
import { toApiError } from '../../../core/api/api-error';
import { ErrorMessageService } from '../../../core/api/error-message-service';
import { RoleService } from '../../../core/role-service';
import { isoToDisplay } from '../../../shared/date-input/date-utils';
import { BadgeTone, StatusBadge } from '../../../shared/status-badge/status-badge';
import { Tooltip } from '../../../shared/tooltip/tooltip';
import { RemarqueForm } from '../remarque-form/remarque-form';
import { RemarqueApi } from '../remarque-api';
import { RemarqueCible, RemarqueDTO, RemarqueType } from '../remarque.models';
import { ResolutionForm } from '../resolution-form/resolution-form';

const TYPE_TONE: Record<RemarqueType, BadgeTone> = {
  PROBLEME: 'danger',
  INFORMATION: 'info',
  AUTRE: 'dark',
};

const EMPTY_PARAGRAPHS_START = /^(\s*<p>(<br\s*\/?>|\s)*<\/p>)+/i;
const EMPTY_PARAGRAPHS_END = /(<p>(<br\s*\/?>|\s)*<\/p>\s*)+$/i;

/**
 * Remarques d'un garage ou d'un locataire (RG-REM-01 à 09) : de la plus récente à la plus ancienne,
 * avec le type, la date de création et, pour un problème, son état. Gestionnaire et Admin ajoutent,
 * modifient, résolvent et rouvrent ; l'Admin supprime ; la Lecture seule consulte.
 */
@Component({
  selector: 'app-remarques-view',
  imports: [TranslatePipe, StatusBadge, Tooltip, RemarqueForm, ResolutionForm],
  templateUrl: './remarques-view.html',
  styleUrl: './remarques-view.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RemarquesView {
  readonly cible = input.required<RemarqueCible>();
  /** Une remarque a été créée, modifiée, résolue, rouverte ou supprimée : le nombre de l'écran a pu changer. */
  readonly changed = output<void>();

  protected readonly roles = inject(RoleService);
  private readonly api = inject(RemarqueApi);
  private readonly errors = inject(ErrorMessageService);

  /** Remarque dont on édite la fiche (`null` dans l'objet : création) et remarque à marquer résolue. */
  protected readonly form = signal<{ remarque: RemarqueDTO | null } | null>(null);
  protected readonly resolution = signal<RemarqueDTO | null>(null);
  protected readonly actionError = signal<string | null>(null);

  protected readonly list = rxResource({
    params: () => this.cible(),
    stream: ({ params }) => this.api.list(params),
  });
  // `value()` lève une exception quand la ressource est en erreur : on le lit seulement s'il existe.
  protected readonly remarques = computed(() => (this.list.hasValue() ? this.list.value() : []));
  protected readonly loadError = computed(() => {
    const error = this.list.error();
    return error ? this.errors.text(toApiError(error)) : null;
  });

  protected tone(remarque: RemarqueDTO): BadgeTone {
    return TYPE_TONE[remarque.type];
  }

  /** « 02/10/2026 09:00 » pour `2026-10-02T09:00:00`. */
  protected created(remarque: RemarqueDTO): string {
    return `${isoToDisplay(remarque.dateCreation.slice(0, 10))} ${remarque.dateCreation.slice(11, 16)}`;
  }

  protected resolvedOn(remarque: RemarqueDTO): string | null {
    return remarque.dateResolution ? isoToDisplay(remarque.dateResolution) : null;
  }

  /** Le HTML est nettoyé par l'API ; on retire encore les paragraphes vides en tête et en queue. */
  protected html(remarque: RemarqueDTO): string {
    return remarque.texte.replace(EMPTY_PARAGRAPHS_START, '').replace(EMPTY_PARAGRAPHS_END, '');
  }

  /** Un lien d'une remarque s'ouvre dans un autre onglet : l'écran reste en place. */
  protected openLink(event: MouseEvent): void {
    const link = (event.target as HTMLElement).closest('a');
    if (link?.getAttribute('href')) {
      event.preventDefault();
      window.open(link.getAttribute('href')!, '_blank', 'noopener,noreferrer');
    }
  }

  protected openForm(remarque: RemarqueDTO | null): void {
    this.form.set({ remarque });
  }

  /** Une remarque enregistrée ferme la fiche et recharge la liste. */
  protected saved(): void {
    this.form.set(null);
    this.resolution.set(null);
    this.actionError.set(null);
    this.refresh();
  }

  protected reopen(remarque: RemarqueDTO): void {
    this.actionError.set(null);
    this.api.reopen(remarque.id).subscribe({
      next: () => this.refresh(),
      error: (err: unknown) => this.actionError.set(this.errors.text(toApiError(err))),
    });
  }

  protected remove(remarque: RemarqueDTO): void {
    this.actionError.set(null);
    this.api.delete(remarque.id).subscribe({
      next: () => this.refresh(),
      error: (err: unknown) => this.actionError.set(this.errors.text(toApiError(err))),
    });
  }

  private refresh(): void {
    this.list.reload();
    this.changed.emit();
  }
}
