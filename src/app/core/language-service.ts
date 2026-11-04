import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { STORAGE_KEYS, StorageService } from './storage';

export type Lang = 'fr' | 'en';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translate = inject(TranslateService);
  private readonly storage = inject(StorageService);

  readonly lang = signal<Lang>('fr');

  /** Langue mémorisée par le navigateur, sinon la langue par défaut du paramètre `langue_defaut` (RG-NAV-03). */
  init(defaultLang: Lang = 'fr'): void {
    const stored = this.storage.local.get(STORAGE_KEYS.langue);
    this.apply(stored === 'en' || stored === 'fr' ? stored : defaultLang);
  }

  use(lang: Lang): void {
    this.apply(lang);
    this.storage.local.set(STORAGE_KEYS.langue, lang);
  }

  private apply(lang: Lang): void {
    this.lang.set(lang);
    this.translate.use(lang);
    document.documentElement.lang = lang;
  }
}
