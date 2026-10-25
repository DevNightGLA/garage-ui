import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Tooltip } from '../tooltip/tooltip';

let nextId = 0;

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Fenêtre modale : titre, corps, pied (`<div modalFooter>`). Elle se place dans
 * un `@if` de l'écran et s'annonce fermée par `closed` (croix, Échap, clic sur le fond).
 * Les erreurs de l'API (`error`) s'affichent en rouge sans fermer la fenêtre (RG-VAL-02).
 */
@Component({
  selector: 'app-modal',
  imports: [TranslatePipe, Tooltip],
  templateUrl: './modal.html',
  styleUrl: './modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'escape()' },
})
export class Modal {
  /** Fenêtres ouvertes, la dernière étant au premier plan : seule elle réagit à Échap. */
  private static readonly open: Modal[] = [];

  /** Titre déjà traduit. */
  readonly title = input.required<string>();
  /** Ligne sous le titre (« Marie Dupont · G01 · Octobre 2026 »), déjà traduite. */
  readonly subtitle = input('');
  /** Largeur maximale en pixels. */
  readonly width = input(440);
  readonly error = input<string | null>(null);
  readonly closed = output<void>();

  protected readonly titleId = `modal-title-${nextId++}`;

  private readonly document = inject(DOCUMENT);
  private readonly panel = viewChild.required<ElementRef<HTMLElement>>('panel');
  private readonly previouslyFocused = this.document.activeElement as HTMLElement | null;
  private pressedOnBackdrop = false;

  constructor() {
    Modal.open.push(this);
    afterNextRender(() => {
      const panel = this.panel().nativeElement;
      const body = panel.querySelector('.modal__body');
      (body?.querySelector<HTMLElement>(FOCUSABLE) ?? panel).focus();
    });
    inject(DestroyRef).onDestroy(() => {
      Modal.open.splice(Modal.open.indexOf(this), 1);
      this.previouslyFocused?.focus?.();
    });
  }

  protected escape(): void {
    if (Modal.open.at(-1) === this) {
      this.closed.emit();
    }
  }

  protected backdropDown(event: MouseEvent): void {
    this.pressedOnBackdrop = event.target === event.currentTarget;
  }

  protected backdropClick(event: MouseEvent): void {
    if (this.pressedOnBackdrop && event.target === event.currentTarget) {
      this.closed.emit();
    }
    this.pressedOnBackdrop = false;
  }

  /** Garde le focus dans la fenêtre. */
  protected trapFocus(keyboard: KeyboardEvent): void {
    if (keyboard.key !== 'Tab') {
      return;
    }
    const items = [...this.panel().nativeElement.querySelectorAll<HTMLElement>(FOCUSABLE)];
    if (items.length === 0) {
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    const active = this.document.activeElement;
    if (keyboard.shiftKey && (active === first || active === this.panel().nativeElement)) {
      keyboard.preventDefault();
      last.focus();
    } else if (!keyboard.shiftKey && active === last) {
      keyboard.preventDefault();
      first.focus();
    }
  }
}
