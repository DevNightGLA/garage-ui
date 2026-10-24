import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, model } from '@angular/core';

export const SEARCH_DEBOUNCE_MS = 300;

/** Champ de recherche à icône ; `value` n'est mis à jour qu'après une courte pause de saisie. */
@Component({
  selector: 'app-search-input',
  templateUrl: './search-input.html',
  styleUrl: './search-input.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchInput {
  readonly value = model('');
  /** Texte d'aide, déjà traduit. */
  readonly placeholder = input('');

  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }

  protected typed(text: string): void {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.value.set(text), SEARCH_DEBOUNCE_MS);
  }

  protected submit(text: string): void {
    clearTimeout(this.timer);
    this.value.set(text);
  }
}
