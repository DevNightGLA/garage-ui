import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

/**
 * Étapes d'un assistant (maquette : création d'un utilisateur, critères du journal d'audit) : pastille numérotée,
 * coche pour une étape franchie, barre de progression. Une étape franchie se rouvre au clic.
 */
@Component({
  selector: 'app-stepper',
  template: `
    <ol class="stp" [style.--stp-progress]="progress()">
      @for (label of labels(); track $index) {
        <li class="stp__item" [class.is-done]="$index < current()" [class.is-current]="$index === current()">
          <button
            type="button"
            class="stp__btn"
            [disabled]="$index > current()"
            [attr.aria-current]="$index === current() ? 'step' : null"
            (click)="select.emit($index)"
          >
            <span class="stp__dot">
              @if ($index < current()) {
                <i class="fa-solid fa-check" aria-hidden="true"></i>
              } @else {
                {{ $index + 1 }}
              }
            </span>
            <span class="stp__label">{{ label }}</span>
          </button>
        </li>
      }
    </ol>
  `,
  styles: `
    .stp {
      position: relative;
      display: flex;
      justify-content: space-between;
      margin: 0;
      padding: 0;
      list-style: none;

      &::before,
      &::after {
        content: '';
        position: absolute;
        top: 15px;
        left: 12%;
        height: 2px;
        background: #e9ecef;
      }
      &::before {
        right: 12%;
      }
      &::after {
        width: calc(76% * var(--stp-progress, 0));
        background: #cb0c9f;
        transition: width 0.2s;
      }
    }
    .stp__item {
      position: relative;
      z-index: 1;
      flex: 1;
      min-width: 0;
    }
    .stp__btn {
      display: flex;
      flex-direction: column;
      gap: 8px;
      align-items: center;
      width: 100%;
      padding: 0;
      border: 0;
      background: none;
      font-family: inherit;
      cursor: pointer;

      &:disabled {
        cursor: default;
      }
    }
    .stp__dot {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      box-sizing: border-box;
      border: 2px solid #e9ecef;
      border-radius: 50%;
      background: #e9ecef;
      font-size: 13px;
      font-weight: 700;
      color: var(--text-body);
      transition: all 0.2s;

      i {
        font-size: 12px;
      }
    }
    .stp__label {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.3px;
      text-align: center;
      text-transform: uppercase;
      color: #8392ab;
    }
    .is-done .stp__dot {
      border-color: #cb0c9f;
      background: var(--white);
      color: #cb0c9f;
    }
    .is-current .stp__dot {
      border-color: transparent;
      background: var(--gradient-brand);
      box-shadow: 0 3px 8px rgba(121, 40, 202, 0.35);
      color: var(--white);
      transform: scale(1.12);
    }
    .is-done .stp__label,
    .is-current .stp__label {
      color: var(--text-heading);
    }
    @media (max-width: 640px) {
      .stp__label {
        font-size: 10px;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Stepper {
  /** Libellés des étapes, déjà traduits. */
  readonly labels = input.required<readonly string[]>();
  readonly current = input.required<number>();
  /** Étape franchie choisie pour y revenir. */
  readonly select = output<number>();

  protected readonly progress = computed(() => {
    const steps = this.labels().length;
    return steps > 1 ? this.current() / (steps - 1) : 0;
  });
}
