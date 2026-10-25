import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export interface PopoverMenuItem {
  /** Icône Font Awesome, par exemple `fa-solid fa-euro-sign`. */
  icon: string;
  /** Libellé déjà traduit. */
  label: string;
  /** Pastille de compteur à droite. */
  count?: number | null;
  action: () => void;
}

/**
 * Petit menu flottant ancré sous un bouton : `x` et `y` sont des coordonnées
 * d'écran (par exemple `getBoundingClientRect()` du bouton). Un clic ailleurs,
 * ou Échap, le ferme.
 */
@Component({
  selector: 'app-popover-menu',
  templateUrl: './popover-menu.html',
  styleUrl: './popover-menu.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'closed.emit()' },
})
export class PopoverMenu {
  readonly items = input.required<readonly PopoverMenuItem[]>();
  /** Nom accessible du menu, déjà traduit. */
  readonly label = input('');
  readonly x = input.required<number>();
  readonly y = input.required<number>();
  readonly closed = output<void>();

  /** Largeur du menu, pour le garder dans la fenêtre. */
  protected readonly width = 230;

  protected left(): number {
    return Math.max(8, Math.min(this.x(), window.innerWidth - this.width - 8));
  }

  protected choose(item: PopoverMenuItem): void {
    this.closed.emit();
    item.action();
  }
}
