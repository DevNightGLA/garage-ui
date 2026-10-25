import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export interface SummaryField {
  /** Libellé déjà traduit. */
  label: string;
  value: string;
}

/**
 * Carte de résumé d'un garage ou d'un locataire, au-dessus de ses remarques : pastille (initiales
 * ou numéro), intitulé, puis une grille de champs.
 */
@Component({
  selector: 'app-summary-card',
  templateUrl: './summary-card.html',
  styleUrl: './summary-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummaryCard {
  /** Texte de la pastille. */
  readonly avatar = input.required<string>();
  /** Pastille ronde pour une personne, carrée pour un garage. */
  readonly shape = input<'round' | 'square'>('round');
  /** Petit libellé au-dessus du titre (« Garage », « Locataire »). */
  readonly kicker = input.required<string>();
  readonly title = input.required<string>();
  readonly fields = input.required<readonly SummaryField[]>();
}
