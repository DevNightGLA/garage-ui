import { Ecran } from '../core/rights/rights.models';

/** Une page du menu. */
export interface NavItem {
  /** Chemin de la route, sans `/` initial (`statistiques/loyers-encaisses`). */
  path: string;
  /** Clé de traduction du libellé (menu, fil d'Ariane et titre de page). */
  labelKey: string;
  icon: string;
  /**
   * Titre de la page s'il diffère du libellé du menu : « Liste des garages » au menu, « Garages » en titre, sans
   * groupe dans le fil d'Ariane (maquette).
   */
  titleKey?: string;
  /** Écran des droits : la page n'apparaît que si le profil a le droit « voir » et l'appareil l'autorise. */
  ecran: Ecran;
}

/** Un groupe dépliable du menu (Garages, Locataires…). */
export interface NavGroup {
  /** Identifiant stable du groupe (état déplié mémorisé). */
  id: string;
  labelKey: string;
  icon: string;
  children: readonly NavItem[];
}

export type NavEntry = NavItem | NavGroup;

export function isGroup(entry: NavEntry): entry is NavGroup {
  return 'children' in entry;
}

/** Menu de la maquette (`Gestion Garages.dc.html`, sections de RG-NAV-01, regles-de-gestion ch. 1). */
export const NAV: readonly NavEntry[] = [
  { path: 'tableau-de-bord', labelKey: 'nav.tableauDeBord', icon: 'fa-gauge', ecran: 'DASH' },
  {
    id: 'garages',
    labelKey: 'nav.garages',
    icon: 'fa-warehouse',
    children: [
      { path: 'garages', labelKey: 'nav.listeGarages', titleKey: 'nav.garages', icon: 'fa-list', ecran: 'GAR' },
      { path: 'historique-loyers', labelKey: 'nav.historiqueLoyers', icon: 'fa-coins', ecran: 'LOY' },
      { path: 'historique-locations', labelKey: 'nav.historiqueLocations', icon: 'fa-clock-rotate-left', ecran: 'HLOC' },
    ],
  },
  {
    id: 'locataires',
    labelKey: 'nav.locataires',
    icon: 'fa-users',
    children: [
      { path: 'locataires', labelKey: 'nav.listeLocataires', titleKey: 'nav.locataires', icon: 'fa-address-book', ecran: 'TEN' },
      { path: 'chronologie', labelKey: 'nav.chronologie', icon: 'fa-timeline', ecran: 'CHR' },
    ],
  },
  { path: 'locations', labelKey: 'nav.locations', icon: 'fa-file-signature', ecran: 'LOC' },
  { path: 'paiements', labelKey: 'nav.paiements', icon: 'fa-euro-sign', ecran: 'PAI' },
  {
    id: 'messages',
    labelKey: 'nav.envoiMessages',
    icon: 'fa-envelope-open-text',
    children: [
      { path: 'avis-de-loyer', labelKey: 'nav.avisLoyer', icon: 'fa-file-invoice', ecran: 'AVI' },
      { path: 'relances', labelKey: 'nav.relances', icon: 'fa-file-invoice-dollar', ecran: 'REL' },
      { path: 'message-libre', labelKey: 'nav.messageLibre', icon: 'fa-pen-to-square', ecran: 'LIB' },
    ],
  },
  {
    id: 'statistiques',
    labelKey: 'nav.statistiques',
    icon: 'fa-chart-simple',
    children: [
      { path: 'statistiques/loyers-encaisses', labelKey: 'nav.statLoyers', icon: 'fa-chart-column', ecran: 'STA' },
      { path: 'statistiques/taux-occupation', labelKey: 'nav.statOccupation', icon: 'fa-chart-line', ecran: 'STA' },
      { path: 'statistiques/repartition', labelKey: 'nav.statRepartition', icon: 'fa-chart-pie', ecran: 'STA' },
      { path: 'statistiques/remarques', labelKey: 'nav.statRemarques', icon: 'fa-comments', ecran: 'STA' },
    ],
  },
  {
    id: 'configuration',
    labelKey: 'nav.configuration',
    icon: 'fa-gear',
    children: [
      { path: 'parametres', labelKey: 'nav.parametres', icon: 'fa-sliders', ecran: 'PAR' },
      { path: 'modeles-messages', labelKey: 'nav.modelesMessages', icon: 'fa-file-lines', ecran: 'TPL' },
      { path: 'utilisateurs', labelKey: 'nav.utilisateurs', icon: 'fa-users-gear', ecran: 'USR' },
      { path: 'droits-acces', labelKey: 'nav.droitsAcces', icon: 'fa-user-lock', ecran: 'DRO' },
      { path: 'journal-audit', labelKey: 'nav.journalAudit', icon: 'fa-clipboard-list', ecran: 'AUD' },
      { path: 'maintenance', labelKey: 'nav.maintenance', icon: 'fa-screwdriver-wrench', ecran: 'MNT' },
    ],
  },
];

/** Toutes les pages du menu, dans l'ordre. */
export const NAV_ITEMS: readonly NavItem[] = NAV.flatMap((entry) => (isGroup(entry) ? entry.children : [entry]));

/** Groupe d'une page, pour le fil d'Ariane (« Pages / Garages / Historique des loyers »). */
export function groupOf(path: string): NavGroup | null {
  return NAV.find((entry): entry is NavGroup => isGroup(entry) && entry.children.some((child) => child.path === path)) ?? null;
}

/** Titre et groupe du fil d'Ariane d'une page (données de sa route). */
export function headingOf(item: NavItem): { titleKey: string; groupKey: string | null } {
  return item.titleKey
    ? { titleKey: item.titleKey, groupKey: null }
    : { titleKey: item.labelKey, groupKey: groupOf(item.path)?.labelKey ?? null };
}

/** Page du menu qui correspond à une URL (`/statistiques/repartition?x=1` → `statistiques/repartition`). */
export function itemOfUrl(url: string): NavItem | null {
  const path = url.split(/[?#]/)[0].replace(/^\/+|\/+$/g, '');
  return NAV_ITEMS.find((item) => item.path === path) ?? null;
}

