import { DestroyRef, Injectable, inject, signal } from '@angular/core';

/** Mêmes valeurs que `--bp-md` et `--bp-lg` de `styles/_tokens.scss`. */
export const BREAKPOINTS = { md: 768, lg: 992 } as const;

/**
 * Taille de l'écran pour les comportements que le CSS seul ne décide pas, comme le
 * menu latéral : fixe et repliable sur ordinateur (≥ 992 px), en tiroir en dessous.
 */
@Injectable({ providedIn: 'root' })
export class Viewport {
  /** Ordinateur : ≥ 992 px. Vrai quand le navigateur ne sait pas mesurer l'écran. */
  readonly isDesktop = signal(true);

  constructor() {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }
    const query = window.matchMedia(`(min-width: ${BREAKPOINTS.lg}px)`);
    this.isDesktop.set(query.matches);
    const onChange = (event: MediaQueryListEvent) => this.isDesktop.set(event.matches);
    query.addEventListener('change', onChange);
    inject(DestroyRef).onDestroy(() => query.removeEventListener('change', onChange));
  }
}
