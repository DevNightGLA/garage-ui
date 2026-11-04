import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { map, startWith } from 'rxjs';
import { LanguageService } from '../../../core/language-service';
import { SettingsService } from '../../../core/settings-service';
import { DateInput } from '../../../shared/date-input/date-input';
import { dateToIso, isoToDisplay } from '../../../shared/date-input/date-utils';
import { Stepper } from '../../../shared/stepper/stepper';
import { JournalApi } from '../journal-api';
import { AuditConcept, CONCEPTS, EMPTY_CRITERIA, JournalCriteria } from '../journal.models';

export interface JournalUser {
  id: number;
  nom: string;
}

const PRESETS: readonly number[] = [7, 30, 90, 0];

/**
 * Assistant de critères du journal (RG-AUD-06) : Période (bornes facultatives, raccourcis), Par qui, Sur quoi
 * (aucune sélection = tous), Validation avec le nombre d'opérations qui correspondent.
 */
@Component({
  selector: 'app-journal-wizard',
  imports: [ReactiveFormsModule, TranslatePipe, Stepper, DateInput],
  templateUrl: './journal-wizard.html',
  styleUrl: './journal-wizard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JournalWizard implements OnInit {
  readonly users = input.required<readonly JournalUser[]>();
  /** Critères de départ (retour depuis le résultat : « Modifier les critères »). */
  readonly initial = input<JournalCriteria>(EMPTY_CRITERIA);
  readonly startStep = input(0);
  readonly generate = output<JournalCriteria>();

  private readonly api = inject(JournalApi);
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);
  private readonly settings = inject(SettingsService);

  protected readonly concepts = CONCEPTS;
  protected readonly presets = PRESETS;
  protected readonly step = signal(0);
  protected readonly du = new FormControl<string | null>(null);
  protected readonly au = new FormControl<string | null>(null);
  private readonly duValue = toSignal(this.du.valueChanges.pipe(startWith(null), map(() => this.du.value)), { initialValue: null });
  private readonly auValue = toSignal(this.au.valueChanges.pipe(startWith(null), map(() => this.au.value)), { initialValue: null });
  protected readonly selectedUsers = signal<ReadonlySet<number>>(new Set());
  protected readonly selectedConcepts = signal<ReadonlySet<AuditConcept>>(new Set());
  protected readonly error = signal<string | null>(null);

  protected readonly labels = computed(() => {
    this.language.lang();
    return ['periode', 'qui', 'quoi', 'validation'].map((key) => this.translate.instant(`journal.etape.${key}`));
  });

  protected readonly criteria = computed<JournalCriteria>(() => ({
    ...EMPTY_CRITERIA,
    du: this.duValue(),
    au: this.auValue(),
    utilisateurs: [...this.selectedUsers()],
    concepts: [...this.selectedConcepts()],
  }));

  /** Nombre d'opérations qui correspondent, calculé à l'étape Validation. */
  protected readonly count = rxResource({
    params: () => (this.step() === 3 ? this.criteria() : undefined),
    stream: ({ params }) => this.api.list(params, 0, 1).pipe(map((page) => page.totalElements)),
  });

  ngOnInit(): void {
    const initial = this.initial();
    this.du.setValue(initial.du);
    this.au.setValue(initial.au);
    this.selectedUsers.set(new Set(initial.utilisateurs));
    this.selectedConcepts.set(new Set(initial.concepts));
    this.step.set(this.startStep());
  }

  // --- Période ---

  private presetRange(days: number): { du: string | null; au: string | null } {
    if (!days) {
      return { du: null, au: null };
    }
    const today = this.settings.today();
    const start = new Date(today);
    start.setDate(start.getDate() - days);
    return { du: dateToIso(start), au: dateToIso(today) };
  }

  protected presetActive(days: number): boolean {
    const range = this.presetRange(days);
    return range.du === this.duValue() && range.au === this.auValue();
  }

  protected applyPreset(days: number): void {
    const range = this.presetRange(days);
    this.du.setValue(range.du);
    this.au.setValue(range.au);
    this.error.set(null);
  }

  // --- Sélections ---

  protected toggleUser(id: number): void {
    this.selectedUsers.update((set) => {
      const next = new Set(set);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  protected toggleConcept(concept: AuditConcept): void {
    this.selectedConcepts.update((set) => {
      const next = new Set(set);
      if (next.has(concept)) {
        next.delete(concept);
      } else {
        next.add(concept);
      }
      return next;
    });
  }

  protected initials(name: string): string {
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase();
  }

  // --- Récapitulatif ---

  protected periodText(): string {
    this.language.lang();
    const du = this.duValue();
    const au = this.auValue();
    return du || au
      ? this.translate.instant('journal.recap.duAu', { du: du ? isoToDisplay(du) : '…', au: au ? isoToDisplay(au) : '…' })
      : this.translate.instant('journal.recap.toutePeriode');
  }

  protected usersText(): string {
    this.language.lang();
    const ids = [...this.selectedUsers()];
    if (ids.length === 0) {
      return this.translate.instant('journal.recap.tousUtilisateurs');
    }
    return ids.length === 1
      ? (this.users().find((u) => u.id === ids[0])?.nom ?? '')
      : this.translate.instant('journal.recap.nUtilisateurs', { n: ids.length });
  }

  protected conceptsText(): string {
    this.language.lang();
    const concepts = [...this.selectedConcepts()];
    if (concepts.length === 0) {
      return this.translate.instant('journal.recap.tousConcepts');
    }
    return concepts.length === 1
      ? this.translate.instant(`journal.concept.${concepts[0]}`)
      : this.translate.instant('journal.recap.nConcepts', { n: concepts.length });
  }

  // --- Navigation ---

  private periodError(): string | null {
    const du = this.duValue();
    const au = this.auValue();
    return du && au && du > au ? this.translate.instant('journal.erreur.ordre') : null;
  }

  protected next(): void {
    if (this.step() === 0) {
      const error = this.periodError();
      this.error.set(error);
      if (error) {
        return;
      }
    }
    this.step.update((step) => Math.min(3, step + 1));
  }

  protected previous(): void {
    this.error.set(null);
    this.step.update((step) => Math.max(0, step - 1));
  }

  protected goTo(step: number): void {
    if (step < this.step()) {
      this.error.set(null);
      this.step.set(step);
    }
  }

  protected reset(): void {
    this.du.setValue(null);
    this.au.setValue(null);
    this.selectedUsers.set(new Set());
    this.selectedConcepts.set(new Set());
    this.error.set(null);
    this.step.set(0);
  }

  protected validate(): void {
    this.generate.emit(this.criteria());
  }
}
