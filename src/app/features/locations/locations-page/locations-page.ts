import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { toApiError } from '../../../core/api/api-error';
import { ErrorMessageService } from '../../../core/api/error-message-service';
import { SortSpec } from '../../../core/api/list-params';
import { RoleService } from '../../../core/role-service';
import { Confirm } from '../../../shared/confirm/confirm';
import { DataTable, DataTableColumn } from '../../../shared/data-table/data-table';
import { DataTableCell } from '../../../shared/data-table/data-table-cell';
import { DateInput } from '../../../shared/date-input/date-input';
import { isoToDisplay } from '../../../shared/date-input/date-utils';
import { FilterButtons, FilterOption } from '../../../shared/filter-buttons/filter-buttons';
import { SearchInput } from '../../../shared/search-input/search-input';
import { Tooltip } from '../../../shared/tooltip/tooltip';
import { LocationApi } from '../location-api';
import { LocationForm } from '../location-form/location-form';
import { LocationDTO, LocationStatut } from '../location.models';

export const LOCATIONS_PAGE_SIZE = 10;

/** Colonnes triables : les clés sont les propriétés de tri acceptées par l'API (`sort=`). */
const COLUMNS: readonly DataTableColumn[] = [
  { key: 'locataire', label: 'locations.col.locataire' },
  { key: 'garage', label: 'locations.col.garage' },
  { key: 'dateDebut', label: 'locations.col.debut' },
  { key: 'dateFin', label: 'locations.col.fin' },
  { key: 'loyer', label: 'locations.col.loyer', align: 'right' },
  { key: 'nbClesRemises', label: 'locations.col.cles' },
  { key: 'actions', label: 'locations.col.actions', sortable: false, align: 'center' },
];

interface Deletion {
  location: LocationDTO;
  /** Refus de l'API : motifs détaillés (RG-LOC-32 et 33). */
  refusal: string[] | null;
  error: string | null;
}

/** Liste des locations (RG-LOC-04 et 05) : filtres à compteurs, période de fin, recherche, tri multi-colonnes, pagination serveur. */
@Component({
  selector: 'app-locations-page',
  imports: [
    CurrencyPipe,
    ReactiveFormsModule,
    TranslatePipe,
    DataTable,
    DataTableCell,
    DateInput,
    FilterButtons,
    SearchInput,
    Tooltip,
    Confirm,
    LocationForm,
  ],
  templateUrl: './locations-page.html',
  styleUrl: './locations-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocationsPage {
  protected readonly roles = inject(RoleService);
  private readonly api = inject(LocationApi);
  private readonly errors = inject(ErrorMessageService);

  protected readonly pageSize = LOCATIONS_PAGE_SIZE;
  protected readonly filter = signal<LocationStatut>('ACTIVE');
  protected readonly search = signal('');
  protected readonly page = signal(0);
  protected readonly sort = signal<SortSpec[]>([]);

  /** Période de fin (RG-LOC-05) : bornes facultatives et inclusives, `yyyy-MM-dd`, pour les locations terminées seulement. */
  protected readonly finDu = new FormControl<string | null>(null);
  protected readonly finAu = new FormControl<string | null>(null);
  private readonly finDuValue = signal<string | null>(null);
  private readonly finAuValue = signal<string | null>(null);
  protected readonly hasPeriod = computed(() => this.finDuValue() !== null || this.finAuValue() !== null);

  /** Location dont on édite la fiche (`null` dans l'objet : création) et suppression en cours. */
  protected readonly form = signal<{ location: LocationDTO | null } | null>(null);
  protected readonly deletion = signal<Deletion | null>(null);

  protected readonly list = rxResource({
    params: () => ({
      page: this.page(),
      sort: this.sort(),
      q: this.search(),
      statut: this.filter(),
      finDu: this.filter() === 'TERMINEE' ? this.finDuValue() : null,
      finAu: this.filter() === 'TERMINEE' ? this.finAuValue() : null,
    }),
    stream: ({ params }) =>
      this.api.list({
        page: params.page,
        size: LOCATIONS_PAGE_SIZE,
        sort: params.sort,
        q: params.q,
        filters: { statut: params.statut, finDu: params.finDu, finAu: params.finAu },
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

  protected readonly filterOptions = computed<FilterOption<LocationStatut>[]>(() => {
    const counters = this.counters.hasValue() ? this.counters.value() : null;
    const option = (value: LocationStatut, label: string): FilterOption<LocationStatut> => ({
      value,
      label,
      count: counters ? counters[value] : null,
    });
    return [
      option('ACTIVE', 'locations.filtre.ACTIVE'),
      option('A_VENIR', 'locations.filtre.A_VENIR'),
      option('TERMINEE', 'locations.filtre.TERMINEE'),
    ];
  });

  protected readonly columns = COLUMNS;
  protected readonly rowKey = (location: LocationDTO) => location.id;

  constructor() {
    const destroyRef = inject(DestroyRef);
    // Tout changement de borne revient à la page 1 (RG-LOC-05).
    this.finDu.valueChanges.pipe(takeUntilDestroyed(destroyRef)).subscribe((value) => this.setPeriod(this.finDuValue, value));
    this.finAu.valueChanges.pipe(takeUntilDestroyed(destroyRef)).subscribe((value) => this.setPeriod(this.finAuValue, value));
  }

  /** Actions de modification et de suppression : seulement pour une location active ou à venir (RG-LOC-27 et 30). */
  protected isOpen(location: LocationDTO): boolean {
    return location.statut !== 'TERMINEE';
  }

  /** « Marie Dupont » → « MD ». */
  protected initials(location: LocationDTO): string {
    return `${location.locataire.prenom.charAt(0)}${location.locataire.nom.charAt(0)}`.toUpperCase();
  }

  protected date(iso: string | null): string {
    return isoToDisplay(iso);
  }

  protected setFilter(filter: LocationStatut): void {
    this.filter.set(filter);
    this.page.set(0);
  }

  protected setSearch(search: string): void {
    this.search.set(search);
    this.page.set(0);
  }

  /** Efface les deux bornes de la période de fin. */
  protected clearPeriod(): void {
    this.finDu.setValue(null);
    this.finAu.setValue(null);
  }

  protected openForm(location: LocationDTO | null): void {
    this.form.set({ location });
  }

  /**
   * Une location créée, ou une location à venir dont le début change, peut changer de statut :
   * la liste bascule alors sur le filtre correspondant (RG-LOC-15 et 25).
   */
  protected formSaved(saved: LocationDTO): void {
    const previous = this.form()?.location ?? null;
    this.form.set(null);
    if ((previous === null || previous.statut === 'A_VENIR') && saved.statut !== this.filter()) {
      this.setFilter(saved.statut);
      this.counters.reload();
    } else {
      this.refresh();
    }
  }

  protected askDelete(location: LocationDTO): void {
    this.deletion.set({ location, refusal: null, error: null });
  }

  protected confirmDelete(): void {
    const current = this.deletion();
    if (!current) {
      return;
    }
    this.api.delete(current.location.id).subscribe({
      next: () => {
        this.deletion.set(null);
        this.refresh();
      },
      error: (err: unknown) => {
        const apiError = toApiError(err);
        const message = this.errors.text(apiError);
        this.deletion.set(
          apiError.code === 'LOC_SUPPRESSION_REFUSEE' || apiError.code === 'LOC_TERMINEE_NON_SUPPRIMABLE'
            ? { ...current, refusal: apiError.details.length > 0 ? apiError.details : [message], error: null }
            : { ...current, error: message },
        );
      },
    });
  }

  protected refresh(): void {
    this.list.reload();
    this.counters.reload();
  }

  private setPeriod(bound: { set(value: string | null): void }, value: string | null): void {
    bound.set(value);
    this.page.set(0);
  }
}
