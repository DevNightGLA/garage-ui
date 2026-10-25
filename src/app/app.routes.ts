import { Type, inject } from '@angular/core';
import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth-guard';
import { NAV_ITEMS } from './core/layout/nav-items';
import { NavigationMemory } from './core/layout/navigation-memory';
import { Shell } from './core/layout/shell';

/** Un écran par entrée du menu (RG-NAV-01) : `app.routes.spec.ts` vérifie qu'aucune n'en manque. */
const SCREENS: Record<string, () => Promise<Type<unknown>>> = {
  'tableau-de-bord': () =>
    import('./features/tableau-de-bord/tableau-de-bord-page/tableau-de-bord-page').then((m) => m.TableauDeBordPage),
  garages: () => import('./features/garages/garages-page/garages-page').then((m) => m.GaragesPage),
  locataires: () =>
    import('./features/locataires/locataires-page/locataires-page').then((m) => m.LocatairesPage),
  locations: () => import('./features/locations/locations-page/locations-page').then((m) => m.LocationsPage),
  paiements: () => import('./features/paiements/paiements-page/paiements-page').then((m) => m.PaiementsPage),
};

export const routes: Routes = [
  {
    path: 'connexion',
    canActivate: [guestGuard],
    data: { titleKey: 'auth.connexion.titre' },
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'mot-de-passe-oublie',
    canActivate: [guestGuard],
    data: { titleKey: 'auth.oubli.titre' },
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password').then((m) => m.ForgotPassword),
  },
  {
    path: 'reinitialisation',
    data: { titleKey: 'auth.reinit.titre' },
    loadComponent: () =>
      import('./features/auth/reset-password/reset-password').then((m) => m.ResetPassword),
  },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: () => inject(NavigationMemory).lastPath() },
      ...NAV_ITEMS.map((item) => ({
        path: item.path,
        data: { titleKey: item.labelKey },
        loadComponent: SCREENS[item.path],
      })),
    ],
  },
  { path: '**', redirectTo: '' },
];
