import { formatDate } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { toApiError } from '../../../core/api/api-error';
import { ErrorMessageService } from '../../../core/api/error-message-service';
import { LanguageService } from '../../../core/language-service';
import { SettingsService } from '../../../core/settings-service';
import { DiffRow, DiffTable } from '../../../shared/diff-table/diff-table';
import { capitalize } from '../../../shared/month-picker/month-utils';
import { JournalApi } from '../journal-api';
import { ChampAuditDTO, DetailAuditDTO, OperationAuditDTO, conceptIcon } from '../journal.models';

interface Group {
  revisionId: number;
  time: string;
  user: string;
  login: string | null;
  initials: string;
  operations: OperationAuditDTO[];
}

interface Day {
  date: string;
  label: string;
  relative: string;
  groups: Group[];
}

/** Valeur d'un champ, telle qu'affichée (le back formate déjà dates et montants). */
function show(value: unknown): string | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  return String(value);
}

/**
 * Opérations du journal groupées par jour puis par révision (une révision peut toucher plusieurs enregistrements :
 * « n enregistrements liés »). Un clic ouvre le détail Champ / avant / après, chargé à la demande, et l'accès au
 * fil conducteur de l'enregistrement (RG-AUD-07 à 09).
 */
@Component({
  selector: 'app-journal-list',
  imports: [TranslatePipe, DiffTable],
  templateUrl: './journal-list.html',
  styleUrl: './journal-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JournalList {
  readonly operations = input.required<readonly OperationAuditDTO[]>();
  /** Total des opérations correspondant aux critères. */
  readonly total = input(0);
  /** Masquer l'auteur (liste filtrée sur un seul utilisateur). */
  readonly hideUser = input(false);
  /** Fil conducteur : pas de lien vers l'historique de l'enregistrement. */
  readonly recordMode = input(false);
  readonly loading = input(false);
  readonly more = output<void>();
  readonly history = output<OperationAuditDTO>();

  private readonly api = inject(JournalApi);
  private readonly errors = inject(ErrorMessageService);
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);
  private readonly settings = inject(SettingsService);

  protected readonly conceptIcon = conceptIcon;
  protected readonly open = signal<ReadonlySet<string>>(new Set());
  protected readonly details = signal<ReadonlyMap<string, DetailAuditDTO | { error: string }>>(new Map());
  protected readonly showUnchanged = signal(false);

  protected readonly hasMore = computed(() => this.operations().length < this.total());

  protected readonly days = computed<Day[]>(() => {
    const lang = this.language.lang();
    const days: Day[] = [];
    for (const op of this.operations()) {
      const date = op.dateHeure.slice(0, 10);
      let day = days[days.length - 1];
      if (!day || day.date !== date) {
        day = { date, label: capitalize(formatDate(date, 'EEEE d MMMM y', lang)), relative: this.relative(date), groups: [] };
        days.push(day);
      }
      let group = day.groups[day.groups.length - 1];
      if (!group || group.revisionId !== op.revisionId) {
        group = {
          revisionId: op.revisionId,
          time: op.dateHeure.slice(11, 19),
          user: op.utilisateurNom,
          login: op.utilisateurLogin,
          initials: op.utilisateurNom
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part.charAt(0))
            .join('')
            .toUpperCase(),
          operations: [],
        };
        day.groups.push(group);
      }
      group.operations.push(op);
    }
    return days;
  });

  protected key(op: OperationAuditDTO): string {
    return `${op.concept}|${op.enregistrementId}|${op.revisionId}`;
  }

  protected toggle(op: OperationAuditDTO): void {
    const key = this.key(op);
    const opened = this.open().has(key);
    this.open.update((set) => {
      const next = new Set(set);
      if (opened) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
    if (!opened && !this.details().has(key)) {
      this.api.detail(op.concept, op.enregistrementId, op.revisionId).subscribe({
        next: (detail) => this.details.update((map) => new Map(map).set(key, detail)),
        error: (err: unknown) => this.details.update((map) => new Map(map).set(key, { error: this.errors.text(toApiError(err)) })),
      });
    }
  }

  protected detail(op: OperationAuditDTO): DetailAuditDTO | null {
    const value = this.details().get(this.key(op));
    return value && 'champs' in value ? value : null;
  }

  protected detailError(op: OperationAuditDTO): string | null {
    const value = this.details().get(this.key(op));
    return value && 'error' in value ? value.error : null;
  }

  protected rows(detail: DetailAuditDTO): DiffRow[] {
    this.language.lang();
    return detail.champs.map((champ: ChampAuditDTO) => ({
      label: this.fieldLabel(detail.operation.concept, champ.champ),
      key: champ.champ,
      before: show(champ.avant),
      after: show(champ.apres),
      changed: champ.modifie,
      masked: champ.masque,
    }));
  }

  /** Libellé d'un champ : propre au concept, sinon commun, sinon la clé technique. */
  private fieldLabel(concept: string, champ: string): string {
    for (const key of [`journal.champ.${concept}.${champ}`, `journal.champ.commun.${champ}`]) {
      const text = this.translate.instant(key);
      if (text !== key) {
        return text;
      }
    }
    return champ;
  }

  protected actionLabel(op: OperationAuditDTO): string {
    return `journal.action.${op.action}`;
  }

  private relative(date: string): string {
    const day = new Date(`${date}T00:00:00`);
    const days = Math.round((this.settings.today().getTime() - day.getTime()) / 86_400_000);
    return days <= 0
      ? this.translate.instant('utilisateurs.connexion.aujourdhui')
      : days === 1
        ? this.translate.instant('utilisateurs.connexion.hier')
        : this.translate.instant('utilisateurs.connexion.jours', { n: days });
  }
}
