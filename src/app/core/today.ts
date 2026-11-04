import { InjectionToken, inject } from '@angular/core';
import { SettingsService } from './settings-service';

/** Date du jour : celle du serveur (`GET /api/contexte`), à défaut celle du navigateur ; remplaçable dans les tests. */
export const TODAY = new InjectionToken<() => Date>('TODAY', {
  providedIn: 'root',
  factory: () => {
    const settings = inject(SettingsService);
    return () => settings.today();
  },
});
