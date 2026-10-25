import { CurrencyPipe, formatCurrency } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { toApiError } from '../../../core/api/api-error';
import { ErrorMessageService } from '../../../core/api/error-message-service';
import { SortSpec } from '../../../core/api/list-params';
import { LanguageService } from '../../../core/language-service';
import { RoleService } from '../../../core/role-service';
import { Confirm } from '../../../shared/confirm/confirm';
import { DataTable, DataTableColumn } from '../../../shared/data-table/data-table';
import { DataTableCell } from '../../../shared/data-table/data-table-cell';
import { FilterButtons, FilterOption } from '../../../shared/filter-buttons/filter-buttons';
import { PopoverMenu, PopoverMenuItem } from '../../../shared/popover-menu/popover-menu';
import { SearchInput } from '../../../shared/search-input/search-input';
import { SummaryCard, SummaryField } from '../../../shared/summary-card/summary-card';
import { BadgeTone, StatusBadge } from '../../../shared/status-badge/status-badge';
import { Tooltip } from '../../../shared/tooltip/tooltip';
import { RemarquesButton } from '../../remarques/remarques-button';
import { RemarquesView } from '../../remarques/remarques-view/remarques-view';
import { RemarqueCible } from '../../remarques/remarque.models';
import { GarageApi } from '../garage-api';
import { GarageForm } from '../garage-form/garage-form';
import { GarageDTO, GarageFilter, GarageStatut } from '../garage.models';
import { LocationsHistory } from '../locations-history/locations-history';
import { LoyersHistory } from '../loyers-history/loyers-history';

export const GARAGES_PAGE_SIZE = 10;

const STATUT_TONE: Record<GarageStatut, BadgeTone> = {
  LOUE: 'success',
  LIBRE: 'info',
  INDISPONIBLE: 'warning',
};

/** Colonnes triables : les clés sont les propriétés de tri acceptées par l'API (`sort=`). */
const COLUMNS: readonly DataTableColumn[] = [
  { key: 'numero', label: 'garages.col.garage', align: 'center' },
  { key: 'nbClesTotal', label: 'garages.col.cles', align: 'center' },
  { key: 'nbClesReserve', label: 'garages.col.reserve', align: 'center' },
  { key: 'loyerCourant', label: 'garages.col.loyer', title: 'garages.col.loyerTitre', align: 'center' },
  { key: 'nbRemarques', label: 'garages.col.remarques', align: 'center' },
  { key: 'locataire', label: 'garages.col.locataire' },
  { key: 'statut', label: 'garages.col.statut', align: 'center' },
  { key: 'historique', label: 'garages.col.historique', sortable: false, align: 'center' },
  { key: 'actions', label: 'garages.col.actions', sortable: false, align: 'center' },
];

interface Deletion {
  garage: GarageDTO;
  /** Refus de l'API : message et motifs détaillés (RG-GAR-30). */
  refusal: { message: string; reasons: string[] } | null;
  error: string | null;
}

/** Liste des garages (RG-GAR-40 à 42) : filtres à compteurs, recherche, tri multi-colonnes, pagination serveur. */
@Component({
  selector: 'app-garages-page',
  imports: [
    CurrencyPipe,
    TranslatePipe,
    DataTable,
    DataTableCell,
    FilterButtons,
    SearchInput,
    StatusBadge,
    Tooltip,
    PopoverMenu,
    Confirm,
    GarageForm,
    LoyersHistory,
    LocationsHistory,
    RemarquesButton,
    RemarquesView,
    SummaryCard,
  ],
  templateUrl: './garages-page.html',
  styleUrl: './garages-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GaragesPage {
  protected readonly roles = inject(RoleService);
  private readonly api = inject(GarageApi);
  private readonly errors = inject(ErrorMessageService);
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);

  protected readonly pageSize = GARAGES_PAGE_SIZE;
  protected readonly filter = signal<GarageFilter>('TOUS');
  protected readonly search = signal('');
  protected readonly page = signal(0);
  protected readonly sort = signal<SortSpec[]>([]);

  /** Garage dont on édite la fiche (`null` dans l'objet : création), historique des loyers ouvert, menu (…) et suppression. */
  protected readonly form = signal<{ garage: GarageDTO | null } | null>(null);
  protected readonly history = signal<GarageDTO | null>(null);
  protected readonly locationsHistory = signal<GarageDTO | null>(null);
  /** Garage dont on consulte les remarques : elles remplacent la liste (RG-REM-01). */
  protected readonly remarks = signal<GarageDTO | null>(null);
  /** Mémorisée : un nouvel objet à chaque rendu relancerait la requête des remarques. */
  protected readonly remarksTarget = computed<RemarqueCible | null>(() => {
    const garage = this.remarks();
    return garage ? { type: 'garage', id: garage.id, libelle: garage.numero } : null;
  });
  protected readonly menu = signal<{ garage: GarageDTO; x: number; y: number } | null>(null);
  protected readonly deletion = signal<Deletion | null>(null);

  protected readonly list = rxResource({
    params: () => ({ page: this.page(), sort: this.sort(), q: this.search(), statut: this.filter() }),
    stream: ({ params }) =>
      this.api.list({
        page: params.page,
        size: GARAGES_PAGE_SIZE,
        sort: params.sort,
        q: params.q,
        filters: { statut: params.statut === 'TOUS' ? null : params.statut },
      }),
  });
  protected readonly counters = rxResource({
    params: () => this.search(),
    stream: ({ params }) => this.api.counters(params),
  });

  // `value()` lève une exception quand la ressource est en erreur : on le lit seulement s'il existe.
  protected readonly rows = computed(() => (this.list.hasValue() ? this.list.value().content : []));
  protected readonly total = computed(() => (this.list.hasValue() ? this.list.value().totalElements : 0));
  protected readonly loadError = computed(() => {
    const error = this.list.error();
    return error ? this.errors.text(toApiError(error)) : null;
  });

  protected readonly filterOptions = computed<FilterOption<GarageFilter>[]>(() => {
    const counters = this.counters.hasValue() ? this.counters.value() : null;
    const option = (value: GarageFilter, label: string): FilterOption<GarageFilter> => ({
      value,
      label,
      count: counters ? counters[value] : null,
    });
    return [
      option('LOUE', 'garages.statut.LOUE'),
      option('LIBRE', 'garages.statut.LIBRE'),
      option('INDISPONIBLE', 'garages.statut.INDISPONIBLE'),
      option('TOUS', 'garages.tous'),
    ];
  });

  /** Un filtre par statut rend la colonne Statut inutile ; Libre et Indisponible n'ont pas de locataire. */
  protected readonly columns = computed(() => {
    const filter = this.filter();
    return COLUMNS.filter(
      (column) =>
        !(column.key === 'statut' && filter !== 'TOUS') &&
        !(column.key === 'locataire' && (filter === 'LIBRE' || filter === 'INDISPONIBLE')),
    );
  });

  protected readonly menuItems = computed<PopoverMenuItem[]>(() => {
    const garage = this.menu()?.garage;
    return garage
      ? [
          {
            icon: 'fa-solid fa-euro-sign',
            label: this.translate.instant('garages.menu.loyers'),
            action: () => this.history.set(garage),
          },
          {
            icon: 'fa-solid fa-file-signature',
            label: this.translate.instant('garages.menu.locations'),
            action: () => this.locationsHistory.set(garage),
          },
        ]
      : [];
  });

  protected readonly rowKey = (garage: GarageDTO) => garage.id;
  protected readonly rowClass = (garage: GarageDTO) => (garage.id === this.history()?.id ? 'is-selected' : null);

  protected openRemarks(garage: GarageDTO): void {
    this.remarks.set(garage);
  }

  protected closeRemarks(): void {
    this.remarks.set(null);
  }

  /** Statut, locataire actuel, clés et réserve, loyer actuel (maquette). */
  protected summaryFields(garage: GarageDTO): SummaryField[] {
    this.language.lang();
    const t = (key: string) => this.translate.instant(key);
    const tenant = garage.locataire ? `${garage.locataire.prenom} ${garage.locataire.nom}` : '—';
    const rent = garage.loyerCourant === null ? '—' : formatCurrency(garage.loyerCourant, 'fr', '€', 'EUR', '1.2-2');
    return [
      { label: t('garages.fiche.statut'), value: t(`garages.statut.${garage.statut}`) },
      { label: t('garages.fiche.locataireActuel'), value: tenant },
      { label: t('garages.fiche.cles'), value: `${garage.nbClesTotal} / ${garage.nbClesReserve}` },
      { label: t('garages.fiche.loyerActuel'), value: rent },
    ];
  }

  protected tone(statut: GarageStatut): BadgeTone {
    return STATUT_TONE[statut];
  }

  /** « Marie Dupont » → « MD ». */
  protected initials(garage: GarageDTO): string {
    const { prenom = '', nom = '' } = garage.locataire ?? {};
    return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
  }

  protected setFilter(filter: GarageFilter): void {
    this.filter.set(filter);
    this.page.set(0);
  }

  protected setSearch(search: string): void {
    this.search.set(search);
    this.page.set(0);
  }

  protected openForm(garage: GarageDTO | null): void {
    this.form.set({ garage });
  }

  protected formSaved(): void {
    this.form.set(null);
    this.refresh();
  }

  protected openMenu(garage: GarageDTO, event: MouseEvent): void {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.menu.set({ garage, x: rect.right - 230, y: rect.bottom + 6 });
  }

  protected askDelete(garage: GarageDTO): void {
    this.deletion.set({ garage, refusal: null, error: null });
  }

  protected confirmDelete(): void {
    const current = this.deletion();
    if (!current) {
      return;
    }
    this.api.delete(current.garage.id).subscribe({
      next: () => {
        this.deletion.set(null);
        this.refresh();
      },
      error: (err: unknown) => {
        const apiError = toApiError(err);
        const message = this.errors.text(apiError);
        this.deletion.set(
          apiError.code === 'GAR_SUPPRESSION_REFUSEE'
            ? { ...current, refusal: { message, reasons: apiError.details.length > 0 ? apiError.details : [message] }, error: null }
            : { ...current, error: message },
        );
      },
    });
  }

  protected refresh(): void {
    this.list.reload();
    this.counters.reload();
  }
}
