import { inject, provideAppInitializer } from '@angular/core';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import fr from '../assets/i18n/fr.json';

/** Traductions françaises réelles, sans appel HTTP, pour les tests de composants. */
export function provideTestTranslations() {
  return [
    provideTranslateService({ lang: 'fr', fallbackLang: 'fr' }),
    provideAppInitializer(() => {
      inject(TranslateService).setTranslation('fr', fr);
    }),
  ];
}
