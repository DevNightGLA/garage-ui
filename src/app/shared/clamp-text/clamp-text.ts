import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Texte (ou HTML nettoyé par le back) limité à `lines` lignes, avec « Voir plus » / « Voir moins » quand il
 * déborde (maquette : description d'un événement de la chronologie, RG-CHR-03). Le HTML passe par la liaison
 * `[innerHTML]` d'Angular, qui l'assainit encore.
 */
@Component({
  selector: 'app-clamp-text',
  imports: [TranslatePipe],
  template: `
    <div
      #box
      class="ct__text"
      [class.is-quote]="quote()"
      [style.-webkit-line-clamp]="expanded() ? null : lines()"
      [class.is-clamped]="!expanded()"
      [innerHTML]="html()"
    ></div>
    @if (expanded() || overflowing()) {
      <button type="button" class="ct__toggle" [attr.aria-expanded]="expanded()" (click)="expanded.update((v) => !v)">
        <span>{{ (expanded() ? 'commun.voirMoins' : 'commun.voirPlus') | translate }}</span>
        <i class="fa-solid" [class.fa-chevron-up]="expanded()" [class.fa-chevron-down]="!expanded()" aria-hidden="true"></i>
      </button>
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }
    .ct__text {
      overflow-wrap: anywhere;
      font-size: 14px;
      line-height: 1.5;
      color: var(--text-heading);
    }
    .ct__text.is-clamped {
      display: -webkit-box;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .ct__text.is-quote {
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-md);
      background: var(--surface-page);
    }
    .ct__text :first-child {
      margin-top: 0;
    }
    .ct__text :last-child {
      margin-bottom: 0;
    }
    .ct__toggle {
      display: inline-flex;
      align-items: center;
      align-self: flex-start;
      gap: 6px;
      min-height: 32px;
      padding: 2px 0;
      border: 0;
      background: transparent;
      font-family: var(--font-sans);
      font-size: 14px;
      font-weight: 700;
      color: var(--text-heading);
      cursor: pointer;

      i {
        font-size: 11px;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClampText implements AfterViewChecked {
  readonly html = input.required<string>();
  readonly lines = input(5);
  /** Fond gris (texte cité : remarque). */
  readonly quote = input(false);

  protected readonly expanded = signal(false);
  protected readonly overflowing = signal(false);
  private readonly box = viewChild.required<ElementRef<HTMLElement>>('box');

  /** Mesure après rendu : le texte dépasse-t-il les lignes affichées ? */
  ngAfterViewChecked(): void {
    if (this.expanded()) {
      return;
    }
    const element = this.box().nativeElement;
    const overflowing = element.scrollHeight > element.clientHeight + 1;
    if (overflowing !== this.overflowing()) {
      queueMicrotask(() => this.overflowing.set(overflowing));
    }
  }
}
