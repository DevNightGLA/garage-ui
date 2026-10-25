import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService, PUBLIC_AUTH_URLS } from './auth-service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/api/') || PUBLIC_AUTH_URLS.some((url) => req.url.startsWith(url))) {
    return next(req);
  }
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.token();
  const authenticated = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authenticated).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401 && token) {
        auth.logout();
        router.navigate(['/connexion'], { queryParams: { raison: 'expiree' } });
      }
      return throwError(() => err);
    }),
  );
};
