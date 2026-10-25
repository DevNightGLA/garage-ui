import { NAV_ITEMS } from './core/layout/nav-items';
import { routes } from './app.routes';

describe('routes', () => {
  const shellChildren = routes.find((route) => route.path === '')?.children ?? [];

  it('chaque entrée du menu a son écran, avec la clé de traduction de son titre', () => {
    for (const item of NAV_ITEMS) {
      const route = shellChildren.find((child) => child.path === item.path);
      expect(route, item.path).toBeDefined();
      expect(typeof route?.loadComponent, item.path).toBe('function');
      expect(route?.data?.['titleKey'], item.path).toBe(item.labelKey);
    }
  });

  it('les écrans publics ont leur clé de titre', () => {
    for (const path of ['connexion', 'mot-de-passe-oublie', 'reinitialisation']) {
      expect(routes.find((route) => route.path === path)?.data?.['titleKey'], path).toEqual(expect.any(String));
    }
  });

  it('tout le reste revient à l\'accueil', () => {
    expect(routes.at(-1)).toMatchObject({ path: '**', redirectTo: '' });
  });
});
