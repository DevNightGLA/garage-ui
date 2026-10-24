import { Injectable, inject } from '@angular/core';
import { STORAGE_KEYS, StorageService } from '../storage';
import { DEFAULT_PATH, NAV_ITEMS } from './nav-items';

/** Dernière page visitée, mémorisée dans le navigateur (RG-NAV-02). */
@Injectable({ providedIn: 'root' })
export class NavigationMemory {
  private readonly storage = inject(StorageService);

  lastPath(): string {
    const stored = this.storage.local.get(STORAGE_KEYS.page);
    return NAV_ITEMS.some((item) => item.path === stored) ? stored! : DEFAULT_PATH;
  }

  /** Mémorise le premier segment de l'URL s'il désigne un écran du menu. */
  remember(url: string): void {
    const path = url.split(/[?#]/)[0].split('/').filter(Boolean)[0];
    if (NAV_ITEMS.some((item) => item.path === path)) {
      this.storage.local.set(STORAGE_KEYS.page, path);
    }
  }
}
