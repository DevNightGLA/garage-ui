import { ChangeDetectionStrategy, Component, ElementRef, inject, input, model } from '@angular/core';

export interface SegmentedOption<V extends string = string> {
  value: V;
  /** Libellé déjà traduit. */
  label: string;
}

/**
 * Choix exclusif sous forme de pastilles sur fond gris (maquette `gg-pills` : destinataires du message libre,
 * catégories des paramètres). Groupe de boutons radio : flèches gauche/droite pour changer de choix.
 */
@Component({
  selector: 'app-segmented',
  template: `
    <div class="sg" role="radiogroup" [attr.aria-label]="ariaLabel() || null">
      @for (option of options(); track option.value) {
        <button
          type="button"
          role="radio"
          class="sg__btn"
          [class.is-active]="option.value === value()"
          [attr.aria-checked]="option.value === value()"
          [attr.tabindex]="option.value === value() ? 0 : -1"
          [disabled]="disabled()"
          (click)="value.set(option.value)"
          (keydown)="key($event, $index)"
        >
          {{ option.label }}
        </button>
      }
    </div>
  `,
  styles: `
    .sg {
      display: flex;
      gap: 2px;
      width: fit-content;
      max-width: 100%;
      padding: 4px;
      box-sizing: border-box;
      border-radius: 12px;
      background: #eef1f6;
    }
    .sg__btn {
      min-height: 32px;
      padding: 6px 14px;
      border: 0;
      border-radius: 9px;
      background: transparent;
      font-family: inherit;
      font-size: 13px;
      font-weight: 700;
      color: var(--text-heading);
      cursor: pointer;
      transition: background 0.2s, color 0.2s;

      &.is-active {
        background: var(--gradient-primary);
        box-shadow: 0 3px 8px rgba(121, 40, 202, 0.35);
        color: var(--white);
      }
      &:disabled {
        cursor: not-allowed;
        opacity: 0.6;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Segmented<V extends string = string> {
  readonly options = input.required<readonly SegmentedOption<V>[]>();
  readonly value = model.required<V>();
  readonly ariaLabel = input('');
  readonly disabled = input(false);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected key(event: KeyboardEvent, index: number): void {
    const step = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0;
    if (!step) {
      return;
    }
    event.preventDefault();
    const options = this.options();
    const next = (index + step + options.length) % options.length;
    this.value.set(options[next].value);
    this.host.nativeElement.querySelectorAll<HTMLButtonElement>('.sg__btn')[next]?.focus();
  }
}
