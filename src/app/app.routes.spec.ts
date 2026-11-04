import { NAV_ITEMS, headingOf } from './layout/nav-items';
import { SCREENS, routes } from './app.routes';

describe('routes', () => {
  const shellChildren = routes.find((route) => route.path === '')?.children ?? [];

  it('chaque page du menu a sa route, gardée par son écran, avec son titre et son groupe', () => {
    for (const item of NAV_ITEMS) {
      const route = shellChildren.find((child) => child.path === item.path);
      expect(route, item.path).toBeDefined();
      expect(typeof route?.loadComponent, item.path).toBe('function');
      expect(route?.canActivate, item.path).toHaveLength(1);
      expect(route?.data, item.path).toEqual(headingOf(item));
    }
  });

  it('les écrans de la v1 restent branchés sur leur composant', () => {
    for (const path of ['tableau-de-bord', 'garages', 'locataires', 'locations', 'paiements']) {
      expect(SCREENS[path], path).toEqual(expect.any(Function));
    }
  });

  it('fil d\'Ariane : « Garages » pour la liste, « Garages / Historique des loyers » pour une sous-page', () => {
    const titre = (path: string) => shellChildren.find((child) => child.path === path)?.data;
    expect(titre('garages')).toEqual({ titleKey: 'nav.garages', groupKey: null });
    expect(titre('historique-loyers')).toEqual({ titleKey: 'nav.historiqueLoyers', groupKey: 'nav.garages' });
    expect(titre('tableau-de-bord')).toEqual({ titleKey: 'nav.tableauDeBord', groupKey: null });
  });

  it('les écrans publics ont leur clé de titre', () => {
    for (const path of ['connexion', 'mot-de-passe-oublie', 'reinitialisation', 'mot-de-passe-temporaire', 'site-en-maintenance']) {
      expect(routes.find((route) => route.path === path)?.data?.['titleKey'], path).toEqual(expect.any(String));
    }
  });

  it('tout le reste revient à l\'accueil', () => {
    expect(routes.at(-1)).toMatchObject({ path: '**', redirectTo: '' });
  });
});
