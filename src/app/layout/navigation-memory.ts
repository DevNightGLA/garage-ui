import { Injectable, inject } from '@angular/core';
import { STORAGE_KEYS, StorageService } from '../core/storage';
import { RightsService } from '../core/rights/rights-service';
import { NAV_ITEMS, itemOfUrl } from './nav-items';

/** Dernière page visitée, mémorisée dans le navigateur (RG-NAV-02), et premier écran autorisé (RG-NAV-01). */
@Injectable({ providedIn: 'root' })
export class NavigationMemory {
  private readonly storage = inject(StorageService);
  private readonly rights = inject(RightsService);

  /** Premier écran du menu visible pour ce profil sur cet appareil ; `null` s'il n'y en a aucun. */
  firstAllowedPath(): string | null {
    return NAV_ITEMS.find((item) => this.rights.visible(item.ecran))?.path ?? null;
  }

  /** Dernière page visitée si elle est encore autorisée, sinon le premier écran autorisé. */
  lastPath(): string {
    const stored = this.storage.local.get(STORAGE_KEYS.page);
    const item = stored ? NAV_ITEMS.find((candidate) => candidate.path === stored) : undefined;
    if (item && this.rights.visible(item.ecran)) {
      return item.path;
    }
    return this.firstAllowedPath() ?? 'acces-refuse';
  }

  /** Mémorise l'URL si elle désigne une page du menu. */
  remember(url: string): void {
    const item = itemOfUrl(url);
    if (item) {
      this.storage.local.set(STORAGE_KEYS.page, item.path);
    }
  }
}
