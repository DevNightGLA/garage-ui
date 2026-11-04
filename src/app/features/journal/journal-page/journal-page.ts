import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { finalize, map, merge, startWith } from 'rxjs';
import { toApiError } from '../../../core/api/api-error';
import { ErrorMessageService } from '../../../core/api/error-message-service';
import { LanguageService } from '../../../core/language-service';
import { DateInput } from '../../../shared/date-input/date-input';
import { isoToDisplay } from '../../../shared/date-input/date-utils';
import { SearchInput } from '../../../shared/search-input/search-input';
import { Segmented, SegmentedOption } from '../../../shared/segmented/segmented';
import { UtilisateurApi } from '../../utilisateurs/utilisateur-api';
import { JournalApi } from '../journal-api';
import { JournalList } from '../journal-list/journal-list';
import { JournalUser, JournalWizard } from '../journal-wizard/journal-wizard';
import { AuditAction, AuditConcept, CONCEPTS, EMPTY_CRITERIA, JournalCriteria, OperationAuditDTO } from '../journal.models';

export type JournalMode = 'utilisateur' | 'concept' | 'criteres';

const signature = (c: JournalCriteria) =>
  [c.du, c.au, c.utilisateurs.join(','), c.concepts.join(','), c.action, c.q.trim(), c.asc].join('|');

/**
 * Journal d'audit (RG-AUD-01 à 10, maquette « Journal audit »), lecture seule, Admin : par utilisateur ou par
 * concept (navigation à gauche, filtres d'action, de période et de recherche, « Générer l'historique ») ou par
 * critères (assistant en quatre étapes). Résultat groupé par jour, « Afficher plus » par lots de 20, détail
 * avant / après et fil conducteur d'un enregistrement. Un bandeau signale des critères changés après génération.
 */
@Component({
  selector: 'app-journal-page',
  imports: [ReactiveFormsModule, TranslatePipe, Segmented, SearchInput, DateInput, JournalList, JournalWizard],
  templateUrl: './journal-page.html',
  styleUrl: './journal-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JournalPage {
  private readonly api = inject(JournalApi);
  private readonly errors = inject(ErrorMessageService);
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);
  private readonly userApi = inject(UtilisateurApi);

  protected readonly concepts = CONCEPTS;
  protected readonly mode = signal<JournalMode>('utilisateur');
  protected readonly selectedUser = signal<number | null>(null);
  protected readonly selectedConcept = signal<AuditConcept | null>(null);
  protected readonly action = new FormControl<AuditAction | ''>('', { nonNullable: true });
  protected readonly du = new FormControl<string | null>(null);
  protected readonly au = new FormControl<string | null>(null);
  protected readonly search = signal('');
  protected readonly asc = signal(false);
  private readonly filterValues = toSignal(
    merge(this.action.valueChanges, this.du.valueChanges, this.au.valueChanges).pipe(
      startWith(null),
      map(() => ({ action: this.action.value || null, du: this.du.value, au: this.au.value })),
    ),
    { initialValue: { action: null, du: null, au: null } },
  );

  protected readonly users = rxResource({
    stream: () =>
      this.userApi
        .list({ page: 0, size: 100, sort: [{ key: 'nom', dir: 'asc' }] })
        .pipe(map((page) => page.content.map((u): JournalUser => ({ id: u.id, nom: `${u.nom} ${u.prenom}` })))),
  });
  protected readonly userList = computed(() => (this.users.hasValue() ? this.users.value() : []));

  /** Critères des modes par utilisateur et par concept. */
  protected readonly criteria = computed<JournalCriteria>(() => {
    const filters = this.filterValues();
    const user = this.selectedUser();
    const concept = this.selectedConcept();
    return {
      du: filters.du,
      au: filters.au,
      action: filters.action,
      q: this.search(),
      asc: this.asc(),
      utilisateurs: this.mode() === 'utilisateur' && user !== null ? [user] : [],
      concepts: this.mode() === 'concept' && concept !== null ? [concept] : [],
    };
  });
  protected readonly hasFilters = computed(() => {
    const c = this.criteria();
    return !!(c.du || c.au || c.action || c.q.trim());
  });

  // --- Résultat ---
  private readonly generated = signal<JournalCriteria | null>(null);
  protected readonly operations = signal<OperationAuditDTO[]>([]);
  protected readonly total = signal(0);
  private readonly page = signal(0);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly isGenerated = computed(() => this.generated() !== null);
  protected readonly stale = computed(() => {
    const generated = this.generated();
    return generated !== null && this.mode() !== 'criteres' && !this.record() && signature(generated) !== signature(this.criteria());
  });

  // --- Fil conducteur d'un enregistrement ---
  protected readonly record = signal<OperationAuditDTO | null>(null);
  protected readonly recordOps = signal<OperationAuditDTO[]>([]);

  // --- Assistant ---
  protected readonly wizardDone = signal(false);
  protected readonly wizardCriteria = signal<JournalCriteria>(EMPTY_CRITERIA);
  protected readonly wizardStep = signal(0);

  protected readonly modeOptions = computed<SegmentedOption<JournalMode>[]>(() => {
    this.language.lang();
    return (['utilisateur', 'concept', 'criteres'] as const).map((value) => ({ value, label: this.translate.instant(`journal.mode.${value}`) }));
  });

  // --- Titres ---

  protected title(): string {
    this.language.lang();
    const record = this.record();
    if (record) {
      return `${this.translate.instant(`journal.concept.${record.concept}`)} · ${record.libelle}`;
    }
    if (this.mode() === 'criteres') {
      return this.translate.instant('journal.filTitre');
    }
    if (this.mode() === 'utilisateur' && this.selectedUser() !== null) {
      return this.userList().find((u) => u.id === this.selectedUser())?.nom ?? '';
    }
    if (this.mode() === 'concept' && this.selectedConcept()) {
      return this.translate.instant(`journal.concept.${this.selectedConcept()}`);
    }
    return this.translate.instant('journal.toute');
  }

  protected subtitle(): string {
    this.language.lang();
    const record = this.record();
    if (record) {
      return this.translate.instant('journal.filSous', { id: record.enregistrementId });
    }
    if (this.mode() === 'criteres') {
      const c = this.wizardCriteria();
      const period =
        c.du || c.au
          ? this.translate.instant('journal.recap.duAu', { du: c.du ? isoToDisplay(c.du) : '…', au: c.au ? isoToDisplay(c.au) : '…' })
          : this.translate.instant('journal.recap.toutePeriode');
      const users =
        c.utilisateurs.length === 1
          ? (this.userList().find((u) => u.id === c.utilisateurs[0])?.nom ?? '')
          : c.utilisateurs.length
            ? this.translate.instant('journal.recap.nUtilisateurs', { n: c.utilisateurs.length })
            : this.translate.instant('journal.recap.tousUtilisateurs');
      const concepts =
        c.concepts.length === 1
          ? this.translate.instant(`journal.concept.${c.concepts[0]}`)
          : c.concepts.length
            ? this.translate.instant('journal.recap.nConcepts', { n: c.concepts.length })
            : this.translate.instant('journal.recap.tousConcepts');
      return [period, users, concepts].join(' · ');
    }
    if (this.mode() === 'utilisateur') {
      return this.translate.instant(this.selectedUser() === null ? 'journal.recap.tousUtilisateurs' : 'journal.unUtilisateur');
    }
    return this.selectedConcept()
      ? this.translate.instant('journal.table', { table: this.selectedConcept() })
      : this.translate.instant('journal.recap.tousConcepts');
  }

  // --- Actions ---

  protected setMode(mode: JournalMode): void {
    this.mode.set(mode);
    this.leave();
  }

  protected selectUser(id: number | null): void {
    this.selectedUser.set(id);
    this.leave();
  }

  protected selectConcept(concept: AuditConcept | null): void {
    this.selectedConcept.set(concept);
    this.leave();
  }

  /** Changer de mode ou de sélection : le résultat est à régénérer (maquette). */
  private leave(): void {
    this.record.set(null);
    this.generated.set(null);
    this.operations.set([]);
    this.total.set(0);
    this.error.set(null);
    if (this.mode() !== 'criteres') {
      this.wizardDone.set(false);
    }
  }

  protected toggleOrder(): void {
    this.asc.update((asc) => !asc);
  }

  protected resetFilters(): void {
    this.action.setValue('');
    this.du.setValue(null);
    this.au.setValue(null);
    this.search.set('');
  }

  protected generate(): void {
    const criteria = this.criteria();
    if (criteria.du && criteria.au && criteria.du > criteria.au) {
      this.error.set(this.translate.instant('journal.erreur.ordre'));
      return;
    }
    this.run(criteria);
  }

  protected generateFromWizard(criteria: JournalCriteria): void {
    this.wizardCriteria.set(criteria);
    this.wizardDone.set(true);
    this.run(criteria);
  }

  protected editCriteria(): void {
    this.wizardStep.set(3);
    this.wizardDone.set(false);
    this.generated.set(null);
  }

  private run(criteria: JournalCriteria): void {
    this.generated.set(criteria);
    this.operations.set([]);
    this.total.set(0);
    this.page.set(0);
    this.load();
  }

  protected more(): void {
    this.page.update((page) => page + 1);
    this.load();
  }

  private load(): void {
    const criteria = this.generated();
    if (!criteria) {
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.api
      .list(criteria, this.page())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (page) => {
          this.operations.update((ops) => [...ops, ...page.content]);
          this.total.set(page.totalElements);
        },
        error: (err: unknown) => this.error.set(this.errors.text(toApiError(err))),
      });
  }

  protected openRecord(op: OperationAuditDTO): void {
    this.record.set(op);
    this.recordOps.set([]);
    this.loading.set(true);
    this.api
      .record(op.concept, op.enregistrementId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (ops) => this.recordOps.set(ops),
        error: (err: unknown) => this.error.set(this.errors.text(toApiError(err))),
      });
  }

  protected closeRecord(): void {
    this.record.set(null);
    this.error.set(null);
  }
}
