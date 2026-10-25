import { DOCUMENT } from '@angular/common';
import { Directive, ElementRef, OnDestroy, inject, input } from '@angular/core';

/** Vrai si l'élément contient du texte que lit un lecteur d'écran (descendants `aria-hidden` exclus). */
const hasReadableText = (node: Node): boolean =>
  Array.from(node.childNodes).some((child) =>
    child.nodeType === Node.TEXT_NODE
      ? !!child.textContent?.trim()
      : child instanceof HTMLElement && child.getAttribute('aria-hidden') !== 'true' && hasReadableText(child),
  );

/**
 * Info-bulle noire au survol ou au focus : `<button [appTooltip]="'garage.modifier' | translate">`.
 * Un seul élément partagé est ajouté au `body`. Le texte sert aussi de nom accessible
 * quand l'élément n'a pas de texte lisible (un nombre `aria-hidden` ne compte pas).
 */
@Directive({
  selector: '[appTooltip]',
  host: {
    '[attr.aria-label]': 'ariaLabel()',
    '(mouseenter)': 'show()',
    '(focus)': 'show()',
    '(mouseleave)': 'hide()',
    '(blur)': 'hide()',
    '(click)': 'hide()',
  },
})
export class Tooltip implements OnDestroy {
  readonly text = input<string | null | undefined>('', { alias: 'appTooltip' });

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly document = inject(DOCUMENT);

  private static bubble: HTMLElement | null = null;

  protected ariaLabel(): string | null {
    return hasReadableText(this.host) ? null : this.text() || null;
  }

  protected show(): void {
    const text = this.text();
    if (!text) {
      return;
    }
    const bubble = this.bubbleElement();
    bubble.textContent = text;
    bubble.style.display = 'block';
    const rect = this.host.getBoundingClientRect();
    const width = bubble.offsetWidth;
    const height = bubble.offsetHeight;
    const left = Math.max(4, Math.min(rect.right + 4 - width, window.innerWidth - width - 4));
    let top = rect.top - 8 - height;
    if (top < 4) {
      top = rect.bottom + 8;
    }
    bubble.style.left = `${left}px`;
    bubble.style.top = `${top}px`;
  }

  protected hide(): void {
    if (Tooltip.bubble) {
      Tooltip.bubble.style.display = 'none';
    }
  }

  ngOnDestroy(): void {
    this.hide();
  }

  private bubbleElement(): HTMLElement {
    if (!Tooltip.bubble || !Tooltip.bubble.isConnected) {
      const bubble = this.document.createElement('div');
      bubble.setAttribute('role', 'tooltip');
      bubble.style.cssText =
        'position:fixed;z-index:1000;display:none;background:#000;color:#fff;font-size:12px;' +
        'font-weight:600;line-height:1;padding:7px 10px;border-radius:8px;white-space:nowrap;' +
        'pointer-events:none;box-shadow:0 4px 10px rgba(0,0,0,.25);font-family:var(--font-sans)';
      this.document.body.appendChild(bubble);
      Tooltip.bubble = bubble;
    }
    return Tooltip.bubble;
  }
}
