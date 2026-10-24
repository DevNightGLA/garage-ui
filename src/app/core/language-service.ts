import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { STORAGE_KEYS, StorageService } from './storage';

export type Lang = 'fr' | 'en';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translate = inject(TranslateService);
  private readonly storage = inject(StorageService);

  readonly lang = signal<Lang>('fr');

  init(): void {
    const stored = this.storage.local.get(STORAGE_KEYS.langue);
    this.apply(stored === 'en' ? 'en' : 'fr');
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
