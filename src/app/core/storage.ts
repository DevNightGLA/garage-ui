import { Injectable } from '@angular/core';

export const STORAGE_KEYS = {
  langue: 'gg-lang',
  page: 'gg-page',
  menuReplie: 'gg-menu-replie',
  jeton: 'gg-token',
} as const;

export class SafeStorage {
  constructor(private readonly area: () => Storage) {}

  get(key: string): string | null {
    try {
      return this.area().getItem(key);
    } catch {
      return null;
    }
  }

  set(key: string, value: string): void {
    try {
      this.area().setItem(key, value);
    } catch {
      // stockage indisponible (navigation privée, quota) : la valeur n'est pas mémorisée
    }
  }

  remove(key: string): void {
    try {
      this.area().removeItem(key);
    } catch {
      // idem
    }
  }
}

/** localStorage pour les préférences, sessionStorage pour le jeton : jamais d'exception. */
@Injectable({ providedIn: 'root' })
export class StorageService {
  readonly local = new SafeStorage(() => localStorage);
  readonly session = new SafeStorage(() => sessionStorage);
}
