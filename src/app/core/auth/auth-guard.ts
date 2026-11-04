import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { RightsService } from '../rights/rights-service';
import { AuthService } from './auth-service';

export const TEMPORARY_PASSWORD_PATH = 'mot-de-passe-temporaire';

/**
 * Routes réservées aux utilisateurs connectés. Un mot de passe temporaire impose d'abord l'écran de changement
 * (RG-AUT-05) ; les droits du compte sont chargés avant d'afficher la première page.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/connexion'], { queryParams: { retour: state.url } });
  }
  if (auth.mustChangePassword()) {
    return router.createUrlTree(['/', TEMPORARY_PASSWORD_PATH]);
  }
  const rights = inject(RightsService);
  return rights.loaded() ? true : rights.load().pipe(map(() => true));
};

/** Écran du mot de passe temporaire : seulement pour un compte connecté qui doit changer son mot de passe. */
export const temporaryPasswordGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/connexion']);
  }
  return auth.mustChangePassword() ? true : router.createUrlTree(['/']);
};

/** Pages de connexion : un utilisateur déjà connecté est renvoyé à l'application. */
export const guestGuard: CanActivateFn = () =>
  inject(AuthService).isAuthenticated() ? inject(Router).createUrlTree(['/']) : true;

/** N'accepte qu'un chemin interne (pas d'URL absolue ni `//hote`). */
export function safeReturnUrl(url: string | null | undefined): string {
  return url && url.startsWith('/') && !url.startsWith('//') ? url : '/';
}
