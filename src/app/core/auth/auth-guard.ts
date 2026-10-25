import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { RoleService } from '../role-service';
import { AuthService } from './auth-service';
import { Role } from './auth.models';

/** Routes réservées aux utilisateurs connectés. */
export const authGuard: CanActivateFn = (_route, state) => {
  if (inject(AuthService).isAuthenticated()) {
    return true;
  }
  return inject(Router).createUrlTree(['/connexion'], { queryParams: { retour: state.url } });
};

/** Pages de connexion : un utilisateur déjà connecté est renvoyé à l'application. */
export const guestGuard: CanActivateFn = () =>
  inject(AuthService).isAuthenticated() ? inject(Router).createUrlTree(['/']) : true;

export const roleGuard =
  (...roles: Role[]): CanActivateFn =>
  () => {
    const role = inject(RoleService).role();
    return role !== null && roles.includes(role) ? true : inject(Router).createUrlTree(['/']);
  };

/** N'accepte qu'un chemin interne (pas d'URL absolue ni `//hote`). */
export function safeReturnUrl(url: string | null | undefined): string {
  return url && url.startsWith('/') && !url.startsWith('//') ? url : '/';
}
