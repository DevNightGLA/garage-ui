import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Tooltip } from '../../shared/tooltip/tooltip';

/**
 * Pastille « commentaire » d'un garage ou d'un locataire, avec son nombre de remarques (RG-REM-08).
 * Un clic ouvre les remarques ; il ne se propage pas à la ligne du tableau.
 */
@Component({
  selector: 'app-remarques-button',
  imports: [Tooltip],
  template: `
    <button
      type="button"
      class="remarques"
      [appTooltip]="label()"
      (click)="$event.stopPropagation(); opened.emit()"
    >
      <i class="fa-regular fa-comment" aria-hidden="true"></i>
      @if (count() > 0) {
        <b class="remarques__n" aria-hidden="true">{{ count() }}</b>
      }
    </button>
  `,
  styleUrl: './remarques-button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RemarquesButton {
  /** Nombre de remarques ; rien n'est affiché pour zéro. */
  readonly count = input.required<number>();
  /** Info-bulle et nom accessible (posé par `appTooltip`), déjà traduits : « Remarques (2) ». */
  readonly label = input.required<string>();
  readonly opened = output<void>();
}
