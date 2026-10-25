import { Type, inject } from '@angular/core';
import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth-guard';
import { NAV_ITEMS } from './core/layout/nav-items';
import { NavigationMemory } from './core/layout/navigation-memory';
import { Shell } from './core/layout/shell';

/** Écrans construits ; les autres entrées du menu restent sur le gabarit provisoire. */
const SCREENS: Record<string, () => Promise<Type<unknown>>> = {
  garages: () => import('./features/garages/garages-page/garages-page').then((m) => m.GaragesPage),
  locataires: () =>
    import('./features/locataires/locataires-page/locataires-page').then((m) => m.LocatairesPage),
  locations: () => import('./features/locations/locations-page/locations-page').then((m) => m.LocationsPage),
};

export const routes: Routes = [
  {
    path: 'connexion',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'mot-de-passe-oublie',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password').then((m) => m.ForgotPassword),
  },
  {
    path: 'reinitialisation',
    loadComponent: () =>
      import('./features/auth/reset-password/reset-password').then((m) => m.ResetPassword),
  },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: () => inject(NavigationMemory).lastPath() },
      // Les écrans remplacent ces gabarits un par un (étape 5 de TASKS.md).
      ...NAV_ITEMS.map((item) => ({
        path: item.path,
        data: { titleKey: item.labelKey },
        loadComponent:
          SCREENS[item.path] ?? (() => import('./features/placeholder/placeholder').then((m) => m.Placeholder)),
      })),
    ],
  },
  { path: '**', redirectTo: '' },
];
