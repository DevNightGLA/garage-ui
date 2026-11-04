import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, of, tap } from 'rxjs';

/** `GET /api/contexte` (public) : date du jour du serveur et réglages utiles au front. */
export interface Contexte {
  dateDuJour: string;
  lignesListe: number;
  lignesHist: number;
  graphMois: number;
  langueDefaut: 'fr' | 'en';
  menuReplie: boolean;
  /** Minutes d'inactivité avant déconnexion ; 0 = désactivée (RG-AUT-06). */
  inactiviteMin: number;
  /** Longueur minimale d'un mot de passe (RG-PAR-10). */
  mdpMin: number;
  maintenance: boolean;
}

/** Valeurs de départ de la table PARAMETRE, utilisées tant que l'API n'a pas répondu. */
export const CONTEXTE_PAR_DEFAUT: Omit<Contexte, 'dateDuJour'> = {
  lignesListe: 10,
  lignesHist: 5,
  graphMois: 12,
  langueDefaut: 'fr',
  menuReplie: false,
  inactiviteMin: 0,
  mdpMin: 8,
  maintenance: false,
};

/** « 2026-10-09 » → date locale du 9 octobre 2026 à minuit. */
export function parseIsoDate(iso: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : null;
}

/**
 * Paramètres de l'application lus au démarrage (`GET /api/contexte`). La date du jour est celle du serveur,
 * pour rester cohérente avec les statuts calculés par le back (le `Clock` du back).
 */
@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly http = inject(HttpClient);
  private readonly contexte = signal<Contexte | null>(null);

  readonly lignesListe = computed(() => this.contexte()?.lignesListe ?? CONTEXTE_PAR_DEFAUT.lignesListe);
  readonly lignesHist = computed(() => this.contexte()?.lignesHist ?? CONTEXTE_PAR_DEFAUT.lignesHist);
  readonly graphMois = computed(() => this.contexte()?.graphMois ?? CONTEXTE_PAR_DEFAUT.graphMois);
  readonly langueDefaut = computed(() => this.contexte()?.langueDefaut ?? CONTEXTE_PAR_DEFAUT.langueDefaut);
  readonly menuReplie = computed(() => this.contexte()?.menuReplie ?? CONTEXTE_PAR_DEFAUT.menuReplie);
  readonly inactiviteMin = computed(() => this.contexte()?.inactiviteMin ?? CONTEXTE_PAR_DEFAUT.inactiviteMin);
  readonly mdpMin = computed(() => this.contexte()?.mdpMin ?? CONTEXTE_PAR_DEFAUT.mdpMin);

  /** Date du jour du serveur ; celle du navigateur tant que le contexte n'est pas chargé. */
  today(): Date {
    const iso = this.contexte()?.dateDuJour;
    const date = iso ? parseIsoDate(iso) : null;
    if (date) {
      return date;
    }
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  /** Charge le contexte ; en cas d'échec (API injoignable), garde les valeurs par défaut. */
  load(): Observable<Contexte | null> {
    return this.http.get<Contexte>('/api/contexte').pipe(
      tap((contexte) => this.contexte.set(contexte)),
      catchError(() => of(null)),
    );
  }
}
