import { InjectionToken } from '@angular/core';

/** Date du jour du navigateur ; remplaçable dans les tests. */
export const TODAY = new InjectionToken<() => Date>('TODAY', {
  providedIn: 'root',
  factory: () => () => new Date(),
});
