import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { TitleStrategy, provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { firstValueFrom } from 'rxjs';
import { sessionInterceptor } from './core/api/session-interceptor';
import { routes } from './app.routes';
import { authInterceptor } from './core/auth/auth-interceptor';
import { AuthService } from './core/auth/auth-service';
import { LanguageService } from './core/language-service';
import { PageTitleStrategy } from './layout/page-title-strategy';
import { registerFrenchLocale } from './core/locale';
import { SettingsService } from './core/settings-service';

registerFrenchLocale();

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    { provide: TitleStrategy, useExisting: PageTitleStrategy },
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, sessionInterceptor])),
    provideTranslateService({
      lang: 'fr',
      fallbackLang: 'fr',
      loader: provideTranslateHttpLoader({ prefix: '/assets/i18n/', suffix: '.json' }),
    }),
    // Contexte public (date du jour, réglages par défaut), puis langue, puis session mémorisée.
    provideAppInitializer(async () => {
      const settings = inject(SettingsService);
      const language = inject(LanguageService);
      const auth = inject(AuthService);
      await firstValueFrom(settings.load());
      language.init(settings.langueDefaut());
      await firstValueFrom(auth.restoreSession());
    }),
  ],
};
