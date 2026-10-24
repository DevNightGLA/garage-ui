export interface NavItem {
  path: string;
  /** Clé de traduction du libellé (menu, fil d'Ariane et titre de page). */
  labelKey: string;
  icon: string;
}

/** Cinq écrans (RG-NAV-01). */
export const NAV_ITEMS: readonly NavItem[] = [
  { path: 'tableau-de-bord', labelKey: 'nav.tableauDeBord', icon: 'fa-gauge' },
  { path: 'garages', labelKey: 'nav.garages', icon: 'fa-warehouse' },
  { path: 'locataires', labelKey: 'nav.locataires', icon: 'fa-users' },
  { path: 'locations', labelKey: 'nav.locations', icon: 'fa-file-signature' },
  { path: 'paiements', labelKey: 'nav.paiements', icon: 'fa-euro-sign' },
];

export const DEFAULT_PATH = NAV_ITEMS[0].path;
