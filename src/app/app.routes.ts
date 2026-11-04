import { Type } from '@angular/core';
import { Routes } from '@angular/router';
import { MAINTENANCE_PATH } from './core/api/session-interceptor';
import { TEMPORARY_PASSWORD_PATH, authGuard, guestGuard, temporaryPasswordGuard } from './core/auth/auth-guard';
import { ACCESS_DENIED_PATH, UNAVAILABLE_PATH, homeGuard, screenGuard } from './core/rights/screen-guard';
import { NAV_ITEMS, headingOf } from './layout/nav-items';
import { Shell } from './layout/shell';

/**
 * Écrans construits, par chemin du menu. Une page du menu absente d'ici affiche « Écran en cours de
 * construction » (`ScreenPending`) jusqu'à son étape de docs/TASKS.md ; `app.routes.spec.ts` vérifie
 * qu'aucune page n'est oubliée.
 */
const garageHistory = () =>
  import('./features/garages/garage-history-page/garage-history-page').then((m) => m.GarageHistoryPage);

export const SCREENS: Partial<Record<string, () => Promise<Type<unknown>>>> = {
  'tableau-de-bord': () =>
    import('./features/tableau-de-bord/tableau-de-bord-page/tableau-de-bord-page').then((m) => m.TableauDeBordPage),
  garages: () => import('./features/garages/garages-page/garages-page').then((m) => m.GaragesPage),
  locataires: () => import('./features/locataires/locataires-page/locataires-page').then((m) => m.LocatairesPage),
  locations: () => import('./features/locations/locations-page/locations-page').then((m) => m.LocationsPage),
  paiements: () => import('./features/paiements/paiements-page/paiements-page').then((m) => m.PaiementsPage),
  'historique-loyers': garageHistory,
  'historique-locations': garageHistory,
};

/** Données propres à certaines pages, ajoutées au titre et au groupe du fil d'Ariane. */
const SCREEN_DATA: Partial<Record<string, Record<string, unknown>>> = {
  'historique-loyers': { vue: 'loyers' },
  'historique-locations': { vue: 'locations' },
};

const pending = () => import('./layout/info-pages').then((m) => m.ScreenPending);

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
    loadComponent: () => import('./features/auth/forgot-password/forgot-password').then((m) => m.ForgotPassword),
  },
  {
    path: 'reinitialisation',
    data: { titleKey: 'auth.reinit.titre' },
    loadComponent: () => import('./features/auth/reset-password/reset-password').then((m) => m.ResetPassword),
  },
  {
    path: TEMPORARY_PASSWORD_PATH,
    canActivate: [temporaryPasswordGuard],
    data: { titleKey: 'auth.temporaire.titre' },
    loadComponent: () =>
      import('./features/auth/temporary-password/temporary-password').then((m) => m.TemporaryPassword),
  },
  {
    path: MAINTENANCE_PATH,
    data: { titleKey: 'maintenance.site.titre' },
    loadComponent: () =>
      import('./features/maintenance/site-maintenance/site-maintenance').then((m) => m.SiteMaintenance),
  },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', canActivate: [homeGuard], children: [] },
      ...NAV_ITEMS.map((item) => ({
        path: item.path,
        canActivate: [screenGuard(item.ecran)],
        data: { ...headingOf(item), ...SCREEN_DATA[item.path] },
        loadComponent: SCREENS[item.path] ?? pending,
      })),
      {
        path: UNAVAILABLE_PATH,
        data: { titleKey: 'acces.titreAppareil' },
        loadComponent: () => import('./layout/info-pages').then((m) => m.ScreenUnavailable),
      },
      {
        path: ACCESS_DENIED_PATH,
        data: { titleKey: 'acces.titre' },
        loadComponent: () => import('./layout/info-pages').then((m) => m.AccessDenied),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
