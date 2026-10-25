import { ChangeDetectionStrategy, Component, ElementRef, afterNextRender, computed, inject, model, signal, viewChild } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageService } from '../../core/language-service';
import { TODAY } from '../../core/today';
import { capitalize, monthLabel, monthOf } from './month-utils';

interface MonthCell {
  /** `yyyy-MM`. */
  value: string;
  label: string;
  selected: boolean;
  current: boolean;
}

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Sélecteur de mois : un bouton « Octobre 2026 » qui ouvre une fenêtre à flèches d'année et aux
 * douze mois. La valeur est `yyyy-MM` ; le mois courant est entouré (RG-PAI-01).
 */
@Component({
  selector: 'app-month-picker',
  imports: [TranslatePipe],
  templateUrl: './month-picker.html',
  styleUrl: './month-picker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(keydown.escape)': 'escape($event)' },
})
export class MonthPicker {
  /** Mois choisi, `yyyy-MM`. */
  readonly value = model.required<string>();

  private readonly language = inject(LanguageService);
  private readonly now = inject(TODAY);
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  protected readonly open = signal(false);
  /** Année affichée dans la fenêtre : celle du mois choisi à l'ouverture, puis celle de la navigation. */
  protected readonly year = signal(0);

  private readonly selectedYear = computed(() => Number(this.value().slice(0, 4)));

  protected readonly label = computed(() => monthLabel(this.language.lang(), this.value()));

  protected readonly months = computed<MonthCell[]>(() => {
    const format = new Intl.DateTimeFormat(this.language.lang(), { month: 'short' });
    const current = monthOf(this.now());
    const year = this.year();
    return Array.from({ length: 12 }, (_, index) => {
      const value = `${year}-${pad(index + 1)}`;
      return {
        value,
        label: capitalize(format.format(new Date(year, index, 1))),
        selected: value === this.value(),
        current: value === current,
      };
    });
  });

  constructor() {
    afterNextRender(() => this.panel()?.nativeElement.focus());
  }

  protected toggle(): void {
    if (!this.open()) {
      this.year.set(this.selectedYear());
    }
    this.open.update((open) => !open);
  }

  protected shift(delta: number): void {
    this.year.update((year) => year + delta);
  }

  protected pick(value: string): void {
    this.value.set(value);
    this.open.set(false);
  }

  /** Ferme la fenêtre du sélecteur seule : Échap ne ferme pas la page ou la fenêtre qui la contient. */
  protected escape(event: Event): void {
    if (this.open()) {
      event.stopPropagation();
      this.open.set(false);
    }
  }
}
