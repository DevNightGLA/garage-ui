import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';

/** Données de la locale `fr`, nécessaires aux montants : `currency:'EUR':'symbol':'1.2-2':'fr'`. */
export function registerFrenchLocale(): void {
  registerLocaleData(localeFr);
}
