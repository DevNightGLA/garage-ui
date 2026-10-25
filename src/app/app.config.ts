import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { firstValueFrom } from 'rxjs';
import { routes } from './app.routes';
import { authInterceptor } from './core/auth/auth-interceptor';
import { AuthService } from './core/auth/auth-service';
import { LanguageService } from './core/language-service';

// Montants : `currency:'EUR':'symbol':'1.2-2':'fr'`
registerLocaleData(localeFr);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideTranslateService({
      lang: 'fr',
      fallbackLang: 'fr',
      loader: provideTranslateHttpLoader({ prefix: '/assets/i18n/', suffix: '.json' }),
    }),
    provideAppInitializer(() => {
      inject(LanguageService).init();
      return firstValueFrom(inject(AuthService).restoreSession());
    }),
  ],
};
