import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageService } from '../../core/language-service';
import { TODAY } from '../../core/today';
import { dateToIso, parseIso, toIso } from './date-utils';

interface Day {
  iso: string;
  day: number;
  selected: boolean;
  today: boolean;
}

/** Calendrier en fenêtre : semaine du lundi au dimanche, « Aujourd'hui » (RG-VAL-04). */
@Component({
  selector: 'app-calendar',
  imports: [TranslatePipe],
  templateUrl: './calendar.html',
  styleUrl: './calendar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(keydown.escape)': 'escape($event)' },
})
export class Calendar {
  /** Date sélectionnée, `yyyy-MM-dd`. */
  readonly selected = input<string | null>(null);
  readonly picked = output<string>();
  readonly closed = output<void>();

  private readonly language = inject(LanguageService);
  private readonly now = inject(TODAY);
  private readonly panel = viewChild.required<ElementRef<HTMLElement>>('panel');

  private readonly view = signal<{ year: number; month: number } | null>(null);

  protected readonly today = computed(() => dateToIso(this.now()));

  /** Mois affiché : celui de la date sélectionnée, sinon celui du jour, tant que l'utilisateur ne navigue pas. */
  private readonly current = computed(() => {
    const view = this.view();
    if (view) {
      return view;
    }
    const base = parseIso(this.selected()) ?? parseIso(this.today())!;
    return { year: base.year, month: base.month };
  });

  protected readonly label = computed(() => {
    const { year, month } = this.current();
    return new Intl.DateTimeFormat(this.language.lang(), { month: 'long', year: 'numeric' }).format(
      new Date(year, month - 1, 1),
    );
  });

  /** Initiales des jours, lundi en premier (le 1er janvier 2024 est un lundi). */
  protected readonly weekdays = computed(() => {
    const format = new Intl.DateTimeFormat(this.language.lang(), { weekday: 'narrow' });
    return Array.from({ length: 7 }, (_, i) => format.format(new Date(2024, 0, 1 + i)));
  });

  /** Cases vides avant le 1er du mois, puis les jours. */
  protected readonly cells = computed<(Day | null)[]>(() => {
    const { year, month } = this.current();
    const lead = (new Date(year, month - 1, 1).getDay() + 6) % 7;
    const length = new Date(year, month, 0).getDate();
    const selected = this.selected();
    const today = this.today();
    const days = Array.from({ length }, (_, i): Day => {
      const iso = toIso(year, month, i + 1);
      return { iso, day: i + 1, selected: iso === selected, today: iso === today };
    });
    return [...Array<null>(lead).fill(null), ...days];
  });

  constructor() {
    afterNextRender(() => this.panel().nativeElement.focus());
  }

  /** Ferme le calendrier seul : la fenêtre qui le contient reste ouverte. */
  protected escape(event: Event): void {
    event.stopPropagation();
    this.closed.emit();
  }

  protected shift(delta: number): void {
    const { year, month } = this.current();
    const date = new Date(year, month - 1 + delta, 1);
    this.view.set({ year: date.getFullYear(), month: date.getMonth() + 1 });
  }

  protected pick(iso: string): void {
    this.picked.emit(iso);
  }

  protected pickToday(): void {
    this.picked.emit(this.today());
  }
}
