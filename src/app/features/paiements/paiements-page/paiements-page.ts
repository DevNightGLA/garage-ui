import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';
import { toApiError } from '../../../core/api/api-error';
import { ErrorMessageService } from '../../../core/api/error-message-service';
import { SortSpec } from '../../../core/api/list-params';
import { RoleService } from '../../../core/role-service';
import { TODAY } from '../../../core/today';
import { DataTable, DataTableColumn } from '../../../shared/data-table/data-table';
import { DataTableCell } from '../../../shared/data-table/data-table-cell';
import { isoToDisplay } from '../../../shared/date-input/date-utils';
import { FilterButtons, FilterOption } from '../../../shared/filter-buttons/filter-buttons';
import { MonthPicker } from '../../../shared/month-picker/month-picker';
import { monthOf } from '../../../shared/month-picker/month-utils';
import { SearchInput } from '../../../shared/search-input/search-input';
import { BadgeTone, StatusBadge } from '../../../shared/status-badge/status-badge';
import { Tooltip } from '../../../shared/tooltip/tooltip';
import { PaiementForm } from '../paiement-form/paiement-form';
import { PaiementApi } from '../paiement-api';
import { PaiementDTO, PaiementFilter, TypePaiement } from '../paiement.models';
import { VersementsModal } from '../versements-detail/versements-detail';

export const PAIEMENTS_PAGE_SIZE = 10;

/** Colonnes triables : les clés sont les propriétés de tri acceptées par l'API (`sort=`). */
const COLUMNS: readonly DataTableColumn[] = [
  { key: 'locataire', label: 'paiements.col.locataire' },
  { key: 'garage', label: 'paiements.col.garage' },
  { key: 'montantDu', label: 'paiements.col.montant', align: 'right' },
  { key: 'dernierVersement', label: 'paiements.col.payeLe' },
  { key: 'modePaiement', label: 'paiements.col.mode', align: 'center' },
  { key: 'statut', label: 'paiements.col.statut', align: 'center' },
  { key: 'actions', label: 'paiements.col.actions', sortable: false, align: 'center' },
];

/** Écran des paiements (RG-PAI-01 à 13, 40) : un mois, ses indicateurs, ses lignes. */
@Component({
  selector: 'app-paiements-page',
  imports: [
    CurrencyPipe,
    TranslatePipe,
    DataTable,
    DataTableCell,
    FilterButtons,
    MonthPicker,
    SearchInput,
    StatusBadge,
    Tooltip,
    PaiementForm,
    VersementsModal,
  ],
  templateUrl: './paiements-page.html',
  styleUrl: './paiements-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaiementsPage {
  protected readonly roles = inject(RoleService);
  private readonly api = inject(PaiementApi);
  private readonly errors = inject(ErrorMessageService);

  protected readonly pageSize = PAIEMENTS_PAGE_SIZE;
  /** Mois affiché, `yyyy-MM` : le mois courant par défaut (RG-PAI-01). */
  protected readonly month = signal(monthOf(inject(TODAY)()));
  protected readonly filter = signal<PaiementFilter>('TOUS');
  protected readonly search = signal('');
  protected readonly page = signal(0);
  protected readonly sort = signal<SortSpec[]>([]);

  /** Paiement en cours de saisie (ligne et type) et ligne dont on regarde les versements. */
  protected readonly payment = signal<{ paiement: PaiementDTO; type: TypePaiement } | null>(null);
  protected readonly detail = signal<PaiementDTO | null>(null);

  protected readonly list = rxResource({
    params: () => ({
      mois: this.month(),
      page: this.page(),
      sort: this.sort(),
      q: this.search(),
      statut: this.filter(),
    }),
    stream: ({ params }) =>
      this.api.list({
        page: params.page,
        size: PAIEMENTS_PAGE_SIZE,
        sort: params.sort,
        q: params.q,
        filters: { mois: params.mois, statut: params.statut === 'TOUS' ? null : params.statut },
      }),
  });
  protected readonly summary = rxResource({
    params: () => ({ mois: this.month(), q: this.search() }),
    stream: ({ params }) => this.api.summary(params.mois, params.q),
  });

  // `value()` lève une exception quand la ressource est en erreur : on le lit seulement s'il existe.
  protected readonly rows = computed(() => (this.list.hasValue() ? this.list.value().content : []));
  protected readonly total = computed(() => (this.list.hasValue() ? this.list.value().totalElements : 0));
  protected readonly loadError = computed(() => {
    const error = this.list.error();
    return error ? this.errors.text(toApiError(error)) : null;
  });
  protected readonly indicators = computed(() => (this.summary.hasValue() ? this.summary.value() : null));

  protected readonly filterOptions = computed<FilterOption<PaiementFilter>[]>(() => {
    const counters = this.indicators()?.compteurs ?? null;
    const option = (value: PaiementFilter, label: string): FilterOption<PaiementFilter> => ({
      value,
      label,
      count: counters ? counters[value] : null,
    });
    return [
      option('A_PAYER', 'paiements.filtre.A_PAYER'),
      option('PARTIEL', 'paiements.filtre.PARTIEL'),
      option('PAYE', 'paiements.filtre.PAYE'),
      option('TOUS', 'paiements.filtre.TOUS'),
    ];
  });

  /** Un filtre par statut rend la colonne Statut inutile. */
  protected readonly columns = computed(() => {
    const showStatut = this.filter() === 'TOUS';
    return COLUMNS.filter((column) => column.key !== 'statut' || showStatut);
  });

  protected readonly rowKey = (paiement: PaiementDTO) => `${paiement.locationId}|${paiement.periode}`;

  /** Payé : vert. Partiel : orange. À payer : rouge en retard, orange sinon (RG-PAI-12). */
  protected tone(paiement: PaiementDTO): BadgeTone {
    if (paiement.statut === 'PAYE') {
      return 'success';
    }
    return paiement.statut === 'A_PAYER' && paiement.enRetard ? 'danger' : 'warning';
  }

  /** Les boutons de paiement n'apparaissent que sur une ligne non soldée, hors Lecture seule (RG-PAI-20). */
  protected canPay(paiement: PaiementDTO): boolean {
    return this.roles.canWrite() && paiement.statut !== 'PAYE';
  }

  /** « Marie Dupont » → « MD ». */
  protected initials(paiement: PaiementDTO): string {
    return `${paiement.locataire.prenom.charAt(0)}${paiement.locataire.nom.charAt(0)}`.toUpperCase();
  }

  protected date(iso: string | null | undefined): string {
    return isoToDisplay(iso ?? null);
  }

  protected setMonth(month: string): void {
    this.month.set(month);
    this.page.set(0);
  }

  protected setFilter(filter: PaiementFilter): void {
    this.filter.set(filter);
    this.page.set(0);
  }

  protected setSearch(search: string): void {
    this.search.set(search);
    this.page.set(0);
  }

  protected openPayment(paiement: PaiementDTO, type: TypePaiement): void {
    this.payment.set({ paiement, type });
  }

  protected paymentSaved(): void {
    this.payment.set(null);
    this.refresh();
  }

  protected refresh(): void {
    this.list.reload();
    this.summary.reload();
  }
}
