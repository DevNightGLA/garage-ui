import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

export interface FilterOption<V extends string = string> {
  value: V;
  /** Clé de traduction du libellé. */
  label: string;
  /** Compteur affiché entre parenthèses (tient compte de la recherche, RG-LST-03). */
  count?: number | null;
}

/** Filtre par statut sous forme de boutons avec compteur. */
@Component({
  selector: 'app-filter-buttons',
  imports: [TranslatePipe],
  templateUrl: './filter-buttons.html',
  styleUrl: './filter-buttons.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterButtons<V extends string = string> {
  readonly options = input.required<readonly FilterOption<V>[]>();
  readonly value = model.required<V>();
}
