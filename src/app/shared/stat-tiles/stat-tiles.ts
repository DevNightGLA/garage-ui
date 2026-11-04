import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Une tuile : libellé, valeur, et au choix un avatar d'initiales ou une icône « vide » (valeur absente). */
export interface StatTile {
  label: string;
  /** `null` : rien à afficher, l'icône `emptyIcon` remplace la valeur. */
  value: string | null;
  /** Initiales d'un avatar placé avant la valeur (locataire actuel). */
  avatar?: string | null;
  /** Icône Font Awesome affichée quand `value` est `null` (`fa-ban`, `fa-user-slash`). */
  emptyIcon?: string;
}

/**
 * Tuiles grises d'indicateurs (maquette : en-tête des historiques « Loyer actuel », « Locataire actuel »,
 * « Clés / réserve » ; indicateurs de la chronologie). Grille qui passe à la ligne selon la largeur.
 */
@Component({
  selector: 'app-stat-tiles',
  template: `
    @for (tile of tiles(); track tile.label) {
      <div class="st">
        <div class="st__label">{{ tile.label }}</div>
        <div class="st__value">
          @if (tile.value !== null) {
            @if (tile.avatar) {
              <span class="st__avatar" aria-hidden="true">{{ tile.avatar }}</span>
            }
            {{ tile.value }}
          } @else {
            <i class="fa-solid st__empty" [class]="tile.emptyIcon ?? 'fa-minus'" aria-hidden="true"></i>
            <span class="visually-hidden">—</span>
          }
        </div>
      </div>
    }
  `,
  styles: `
    :host {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: var(--space-4);
    }
    .st {
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-lg);
      background: var(--surface-page);
      text-align: center;
    }
    .st__label {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      color: var(--text-body);
    }
    .st__value {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
      min-height: 26px;
      margin-top: 2px;
      font-size: 19px;
      font-weight: 700;
      color: var(--text-heading);
    }
    .st__avatar {
      display: flex;
      flex: none;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: var(--radius-circle);
      background: var(--gradient-dark);
      font-size: 11px;
      color: var(--white);
    }
    .st__empty {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 26px;
      height: 26px;
      border-radius: var(--radius-circle);
      background: #e4e9f0;
      font-size: 12px;
      color: #8a96a8;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatTiles {
  readonly tiles = input.required<readonly StatTile[]>();
}
