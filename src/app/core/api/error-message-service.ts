import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../language-service';
import { capitalize } from '../../shared/month-picker/month-utils';
import { ApiError } from './api-error';
import { FIXED_MESSAGES, PARAMETERIZED_MESSAGES } from './message-patterns';

/** Mois du back (« septembre 2026 »), dans l'ordre de l'année. */
const FRENCH_MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

/**
 * En français, les messages du back sont affichés tels quels. En anglais, ils sont traduits : par code
 * d'erreur (`erreur.<CODE>`), puis par texte (`messagesBack.<clé>`, avec les nombres, noms et dates du
 * message en paramètres). Un message inconnu reste celui du back plutôt que d'être perdu.
 */
@Injectable({ providedIn: 'root' })
export class ErrorMessageService {
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);

  /** Message d'une erreur : à afficher dans la fenêtre ou sous la liste. */
  text(error: ApiError): string {
    if (error.message && this.language.lang() === 'fr') {
      return error.message;
    }
    const key = `erreur.${error.code}`;
    const translated = this.translate.instant(key);
    if (translated !== key) {
      return translated;
    }
    return (error.message && this.message(error.message)) || this.translate.instant('erreur.generique');
  }

  /** Erreurs de validation, champ par champ (`fieldErrors`). */
  fields(error: ApiError): Record<string, string> {
    return Object.fromEntries(Object.entries(error.fieldErrors).map(([field, message]) => [field, this.message(message)]));
  }

  /** Motifs détaillés d'un refus (`details`), par exemple celui d'une suppression. */
  details(error: ApiError): string[] {
    return error.details.map((detail) => this.message(detail));
  }

  /** Un message du back dans la langue de l'écran. */
  message(message: string): string {
    if (this.language.lang() === 'fr') {
      return message;
    }
    const fixed = FIXED_MESSAGES[message];
    if (fixed) {
      return this.template(fixed, undefined, message);
    }
    for (const { pattern, key } of PARAMETERIZED_MESSAGES) {
      const groups = pattern.exec(message)?.groups;
      if (groups) {
        const params = Object.fromEntries(
          Object.entries(groups).map(([name, value]) => [name, name === 'mois' ? this.month(value) : value]),
        );
        return this.template(key, params, message);
      }
    }
    return message;
  }

  private template(key: string, params: Record<string, string> | undefined, fallback: string): string {
    const full = `messagesBack.${key}`;
    const translated = this.translate.instant(full, params);
    return translated === full ? fallback : translated;
  }

  /** « septembre 2026 » → « September 2026 » ; un texte inattendu reste tel quel. */
  private month(text: string): string {
    const match = /^(\S+) (\d{4})$/.exec(text);
    const index = match ? FRENCH_MONTHS.indexOf(match[1].toLowerCase()) : -1;
    if (!match || index < 0) {
      return text;
    }
    const name = new Intl.DateTimeFormat(this.language.lang(), { month: 'long' }).format(new Date(Number(match[2]), index, 1));
    return `${capitalize(name)} ${match[2]}`;
  }
}
