import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Tooltip } from '../tooltip/tooltip';

/**
 * Case à cocher des grilles de droits (maquette « Droits d'accès ») : coche verte ou croix, verrouillée (Admin,
 * écran réservé), désactivée (« — », accès requis), et pastille orange quand la valeur diffère de celle enregistrée.
 */
@Component({
  selector: 'app-toggle-cell',
  imports: [Tooltip],
  template: `
    <button
      type="button"
      class="tc"
      role="switch"
      [class.is-on]="on() && !disabled()"
      [class.is-locked]="locked()"
      [class.is-disabled]="disabled()"
      [class.is-changed]="changed()"
      [attr.aria-checked]="on()"
      [attr.aria-disabled]="locked() || disabled()"
      [appTooltip]="tooltip() || label()"
      (click)="!locked() && !disabled() && toggled.emit()"
    >
      <i [class]="'fa-solid ' + iconClass()" aria-hidden="true"></i>
      <!-- Nom accessible : le texte, pour que l'info-bulle (raison d'un verrou) ne le remplace pas. -->
      <span class="visually-hidden">{{ label() }}</span>
      @if (changed()) {
        <span class="tc__dot" aria-hidden="true"></span>
      }
    </button>
  `,
  styles: `
    :host {
      display: inline-flex;
    }
    .tc {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      box-sizing: border-box;
      padding: 0;
      border: 1px solid #d2d6da;
      border-radius: var(--radius-md);
      background: var(--white);
      font-size: 13px;
      color: #b4bccb;
      cursor: pointer;
      transition: background 0.15s, box-shadow 0.15s;

      &.is-on {
        border-color: transparent;
        background: var(--gradient-success);
        color: var(--white);
      }
      &.is-locked {
        opacity: 0.55;
        cursor: not-allowed;
      }
      &.is-disabled {
        border-color: #e9ecef;
        background: #f1f3f6;
        color: #c9cfd9;
        cursor: not-allowed;
      }
      &.is-changed {
        box-shadow: 0 0 0 2px var(--white), 0 0 0 4px #fb8c00;
      }
    }
    .tc__dot {
      position: absolute;
      top: -6px;
      right: -6px;
      width: 10px;
      height: 10px;
      border: 2px solid var(--white);
      border-radius: 50%;
      background: #fb8c00;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToggleCell {
  readonly on = input.required<boolean>();
  /** Valeur figée (Admin, écran réservé) : visible mais non modifiable. */
  readonly locked = input(false);
  /** Case sans objet tant qu'un prérequis manque (accès à l'écran). */
  readonly disabled = input(false);
  /** Différente de la valeur enregistrée (brouillon). */
  readonly changed = input(false);
  /** Nom accessible, déjà traduit (« Autoriser l'accès · Gestionnaire · Paiements »). */
  readonly label = input.required<string>();
  /** Info-bulle si elle diffère du nom (raison d'un verrou). */
  readonly tooltip = input<string | null>(null);
  /** Icône Font Awesome à la place de la coche (`fa-user-check` pour le Locataire). */
  readonly icon = input<string | null>(null);
  readonly toggled = output<void>();

  protected readonly iconClass = computed(() => {
    if (this.disabled()) {
      return 'fa-minus';
    }
    return this.on() ? (this.icon() ?? 'fa-check') : 'fa-xmark';
  });
}
