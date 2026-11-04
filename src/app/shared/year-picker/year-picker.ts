import { ChangeDetectionStrategy, Component, ElementRef, afterNextRender, computed, inject, input, model, signal, viewChild } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { TODAY } from '../../core/today';

/**
 * Sélecteur d'année (maquette : pages Statistiques) : un bouton « 2026 » qui ouvre une fenêtre de douze années, avec
 * flèches de période, « Année en cours » et « Fermer ». Seules les années de `min` à `max` sont choisissables.
 * Mêmes styles que le sélecteur de mois.
 */
@Component({
  selector: 'app-year-picker',
  imports: [TranslatePipe],
  templateUrl: './year-picker.html',
  styleUrls: ['../month-picker/month-picker.scss', './year-picker.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(keydown.escape)': 'escape($event)' },
})
export class YearPicker {
  readonly value = model.required<number>();
  readonly min = input.required<number>();
  readonly max = input.required<number>();

  private readonly now = inject(TODAY);
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  protected readonly open = signal(false);
  /** Première année de la période affichée (douze années). */
  protected readonly start = signal(0);

  protected readonly years = computed(() =>
    Array.from({ length: 12 }, (_, index) => {
      const year = this.start() + index;
      return { year, enabled: year >= this.min() && year <= this.max(), selected: year === this.value() };
    }),
  );
  protected readonly canPrevious = computed(() => this.start() > this.min());
  protected readonly canNext = computed(() => this.start() + 12 <= this.max());

  constructor() {
    afterNextRender(() => this.panel()?.nativeElement.focus());
  }

  protected toggle(): void {
    if (!this.open()) {
      this.start.set(Math.floor(this.value() / 12) * 12);
    }
    this.open.update((open) => !open);
  }

  protected shift(delta: number): void {
    this.start.update((start) => start + delta * 12);
  }

  protected pick(year: number): void {
    this.value.set(year);
    this.open.set(false);
  }

  protected thisYear(): void {
    this.pick(Math.min(this.max(), Math.max(this.min(), this.now().getFullYear())));
  }

  /** Ferme la fenêtre du sélecteur seule. */
  protected escape(event: Event): void {
    if (this.open()) {
      event.stopPropagation();
      this.open.set(false);
    }
  }
}
