import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../language-service';
import { ApiError } from './api-error';

/**
 * En français, le message du back est affiché tel quel. En anglais, on cherche
 * une traduction `erreur.<CODE>` et on retombe sur le message du back.
 */
@Injectable({ providedIn: 'root' })
export class ErrorMessageService {
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);

  text(error: ApiError): string {
    if (error.message && this.language.lang() === 'fr') {
      return error.message;
    }
    const key = `erreur.${error.code}`;
    const translated = this.translate.instant(key);
    if (translated !== key) {
      return translated;
    }
    return error.message || this.translate.instant('erreur.generique');
  }
}
