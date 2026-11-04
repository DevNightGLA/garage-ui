import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { Appareil } from './rights/rights.models';

/**
 * Points d'arrêt (RG-APP-01) : ordinateur au-delà de 1024 px, tablette de 641 à 1024 px, smartphone jusqu'à
 * 640 px. Mêmes valeurs que `--bp-tablette` et `--bp-smartphone` de `styles/_tokens.scss`.
 */
export const BREAKPOINTS = { smartphone: 640, tablette: 1024 } as const;

/**
 * Mode d'affichage selon la largeur de la fenêtre (le sélecteur de la maquette n'est pas repris) : il décide du
 * menu en tiroir et des écrans disponibles sur l'appareil (RG-APP-02 à 04).
 */
@Injectable({ providedIn: 'root' })
export class DeviceService {
  /** Ordinateur quand le navigateur ne sait pas mesurer l'écran. */
  readonly mode = signal<Appareil>('ORDINATEUR');
  readonly isDesktop = computed(() => this.mode() === 'ORDINATEUR');

  constructor() {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }
    const phone = window.matchMedia(`(max-width: ${BREAKPOINTS.smartphone}px)`);
    const tablet = window.matchMedia(`(max-width: ${BREAKPOINTS.tablette}px)`);
    const update = () => this.mode.set(phone.matches ? 'SMARTPHONE' : tablet.matches ? 'TABLETTE' : 'ORDINATEUR');
    update();
    phone.addEventListener('change', update);
    tablet.addEventListener('change', update);
    inject(DestroyRef).onDestroy(() => {
      phone.removeEventListener('change', update);
      tablet.removeEventListener('change', update);
    });
  }
}
