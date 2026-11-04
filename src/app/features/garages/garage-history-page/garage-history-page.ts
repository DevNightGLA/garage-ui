import { formatCurrency } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { map } from 'rxjs';
import { toApiError } from '../../../core/api/api-error';
import { ErrorMessageService } from '../../../core/api/error-message-service';
import { LanguageService } from '../../../core/language-service';
import { PickList } from '../../../shared/pick-list/pick-list';
import { StatTile, StatTiles } from '../../../shared/stat-tiles/stat-tiles';
import { GarageApi } from '../garage-api';
import { GarageDTO, GarageStatut } from '../garage.models';
import { LocationsHistory } from '../locations-history/locations-history';
import { LoyersHistory } from '../loyers-history/loyers-history';

/** Vue de la page : historique des loyers (écran `LOY`) ou des locations (écran `HLOC`). */
export type GarageHistoryView = 'loyers' | 'locations';

/** Pastille du statut dans la liste (maquette). */
export const STATUT_DOT: Record<GarageStatut, string> = {
  LOUE: '#0f8a2a',
  LIBRE: '#17c1e8',
  INDISPONIBLE: '#f97316',
};

/** Étiquette du statut dans l'en-tête (maquette). */
export const STATUT_GRADIENT: Record<GarageStatut, string> = {
  LOUE: 'linear-gradient(310deg, #0c7a25, #62bd1d)',
  LIBRE: 'linear-gradient(310deg, #2152ff, #21d4fd)',
  INDISPONIBLE: 'linear-gradient(310deg, #f53939, #fbcf33)',
};

/** Tous les garages pour la colonne de choix (20 au plus, décision ouverte 2). */
const ALL_GARAGES = 100;

/**
 * Pages « Historique des loyers » et « Historique des locations » du menu (RG-GAR-42, 43, chapitre 6) : choix du
 * garage à gauche, en-tête du garage et historique à droite. Le garage choisi est dans l'adresse (`?garage=id`) ;
 * sans choix, le premier garage. Pour un compte Locataire, l'API ne renvoie que ses garages.
 */
@Component({
  selector: 'app-garage-history-page',
  imports: [TranslatePipe, PickList, StatTiles, LoyersHistory, LocationsHistory],
  templateUrl: './garage-history-page.html',
  styleUrl: './garage-history-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GarageHistoryPage {
  private readonly api = inject(GarageApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly errors = inject(ErrorMessageService);
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);

  protected readonly view: GarageHistoryView = this.route.snapshot.data['vue'] === 'locations' ? 'locations' : 'loyers';
  protected readonly dots = STATUT_DOT;
  protected readonly gradients = STATUT_GRADIENT;

  protected readonly garages = rxResource({
    stream: () => this.api.list({ page: 0, size: ALL_GARAGES, sort: [{ key: 'numero', dir: 'asc' }] }),
  });
  protected readonly items = computed(() => (this.garages.hasValue() ? this.garages.value().content : []));
  protected readonly loadError = computed(() => {
    const error = this.garages.error();
    return error ? this.errors.text(toApiError(error)) : null;
  });

  private readonly requested = toSignal(this.route.queryParamMap.pipe(map((params) => Number(params.get('garage')) || null)), {
    initialValue: null,
  });
  protected readonly selected = computed<GarageDTO | null>(() => {
    const items = this.items();
    return items.find((garage) => garage.id === this.requested()) ?? items[0] ?? null;
  });

  protected readonly tiles = computed<StatTile[]>(() => {
    this.language.lang();
    const garage = this.selected();
    if (!garage) {
      return [];
    }
    const t = (key: string) => this.translate.instant(key);
    const tenant = garage.locataire;
    const tiles: StatTile[] = [
      { label: t('garages.fiche.loyerActuel'), value: this.rent(garage), emptyIcon: 'fa-ban' },
      {
        label: t('garages.fiche.locataireActuel'),
        value: tenant ? `${tenant.prenom} ${tenant.nom}` : null,
        avatar: tenant ? `${tenant.prenom.charAt(0)}${tenant.nom.charAt(0)}`.toUpperCase() : null,
        emptyIcon: 'fa-user-slash',
      },
    ];
    if (this.view === 'locations') {
      tiles.push({ label: t('garages.fiche.cles'), value: `${garage.nbClesTotal} / ${garage.nbClesReserve}` });
    }
    return tiles;
  });

  /** « 90,00 € » ; `null` sans loyer en vigueur. */
  protected rent(garage: GarageDTO): string | null {
    return garage.loyerCourant === null ? null : formatCurrency(garage.loyerCourant, 'fr', '€', 'EUR', '1.2-2');
  }

  protected choose(garage: GarageDTO): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: { garage: garage.id }, replaceUrl: true });
  }

  /** Un loyer ajouté ou modifié change le loyer actuel de l'en-tête et de la liste. */
  protected refresh(): void {
    this.garages.reload();
  }
}
