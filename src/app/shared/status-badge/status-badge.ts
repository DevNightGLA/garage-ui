import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type BadgeTone = 'primary' | 'info' | 'success' | 'warning' | 'danger' | 'dark' | 'ancien';

/**
 * Badge de statut. L'écran choisit la teinte d'après le statut renvoyé par
 * l'API (Loué → success, Libre → info, Indisponible → warning...).
 */
@Component({
  selector: 'app-status-badge',
  templateUrl: './status-badge.html',
  styleUrl: './status-badge.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': '"tone-" + tone()',
    '[class.is-block]': 'block()',
  },
})
export class StatusBadge {
  readonly tone = input<BadgeTone>('primary');
  /** Largeur fixe (106 px) et texte centré, comme dans les listes de la maquette. */
  readonly block = input(false);
}
