import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, of } from 'rxjs';
import { NavigationMemory } from '../../layout/navigation-memory';
import { RightsService } from './rights-service';
import { Ecran } from './rights.models';

export const ACCESS_DENIED_PATH = 'acces-refuse';
export const UNAVAILABLE_PATH = 'ecran-indisponible';

/**
 * Garde d'un écran du menu (à placer après `authGuard`, qui charge les droits). Sans droit « voir », redirige
 * vers le premier écran autorisé (RG-NAV-01). Écran retiré pour cet appareil : page d'explication (RG-APP-04).
 */
export const screenGuard =
  (ecran: Ecran): CanActivateFn =>
  () => {
    const rights = inject(RightsService);
    const router = inject(Router);
    if (!rights.can(ecran, 'v')) {
      const first = inject(NavigationMemory).firstAllowedPath();
      return router.createUrlTree(['/', first ?? ACCESS_DENIED_PATH]);
    }
    if (!rights.allowedOnDevice(ecran)) {
      return router.createUrlTree(['/', UNAVAILABLE_PATH], { queryParams: { ecran } });
    }
    return true;
  };

/**
 * Accueil (`/`) : dernière page visitée si elle est encore autorisée, sinon le premier écran autorisé. C'est une
 * garde et non une redirection, pour attendre les droits du compte (une redirection est décidée avant les gardes).
 */
export const homeGuard: CanActivateFn = () => {
  const rights = inject(RightsService);
  const router = inject(Router);
  const memory = inject(NavigationMemory);
  const ready = rights.loaded() ? of(true) : rights.load();
  return ready.pipe(map(() => router.createUrlTree(['/', ...memory.lastPath().split('/')])));
};
