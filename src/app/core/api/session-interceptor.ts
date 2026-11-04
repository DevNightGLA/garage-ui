import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Injector, inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth-service';
import { TEMPORARY_PASSWORD_PATH } from '../auth/auth-guard';
import { RightsService } from '../rights/rights-service';

export const MAINTENANCE_PATH = 'site-en-maintenance';

/** Code d'erreur du corps d'une réponse de l'API, s'il y en a un. */
function codeOf(err: HttpErrorResponse): string | null {
  const body = err.error as { code?: unknown } | null;
  return body && typeof body.code === 'string' ? body.code : null;
}

/**
 * États de session renvoyés par l'API (docs/api-contract.md, section 1) :
 * - 503 `MAINTENANCE` : page « Site en maintenance » (RG-MNT-02) ; le jeton est gardé pour retrouver l'accès ;
 * - 403 `MOT_DE_PASSE_TEMPORAIRE` : écran obligatoire du nouveau mot de passe (RG-AUT-05) ;
 * - 403 `ACCES_REFUSE` : un droit a pu changer (RG-DRO-14), les droits sont relus pour mettre le menu à jour.
 * L'erreur continue jusqu'à l'écran, qui affiche son message.
 */
export const sessionInterceptor: HttpInterceptorFn = (req, next) => {
  // Injection paresseuse : les traductions sont chargées par HTTP pendant la création du `Router`
  // (titre des pages), qui ne peut donc pas être demandé dès l'interception.
  const injector = inject(Injector);
  return next(req).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && req.url.startsWith('/api/')) {
        const router = injector.get(Router);
        const auth = injector.get(AuthService);
        const rights = injector.get(RightsService);
        const code = codeOf(err);
        if (err.status === 503 && code === 'MAINTENANCE') {
          if (!router.url.startsWith(`/${MAINTENANCE_PATH}`)) {
            router.navigate(['/', MAINTENANCE_PATH]);
          }
        } else if (err.status === 403 && code === 'MOT_DE_PASSE_TEMPORAIRE') {
          auth.markTemporaryPassword();
          router.navigate(['/', TEMPORARY_PASSWORD_PATH]);
        } else if (err.status === 403 && code === 'ACCES_REFUSE' && auth.isAuthenticated()) {
          rights.load().subscribe();
        }
      }
      return throwError(() => err);
    }),
  );
};
