import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { toApiError } from '../../../core/api/api-error';
import { ErrorMessageService } from '../../../core/api/error-message-service';
import { SortSpec } from '../../../core/api/list-params';
import { LanguageService } from '../../../core/language-service';
import { screenRights } from '../../../core/rights/screen-rights';
import { Confirm } from '../../../shared/confirm/confirm';
import { DataTable, DataTableColumn } from '../../../shared/data-table/data-table';
import { DataTableCell } from '../../../shared/data-table/data-table-cell';
import { FilterButtons, FilterOption } from '../../../shared/filter-buttons/filter-buttons';
import { SearchInput } from '../../../shared/search-input/search-input';
import { SummaryCard, SummaryField } from '../../../shared/summary-card/summary-card';
import { BadgeTone, StatusBadge } from '../../../shared/status-badge/status-badge';
import { LOCATAIRE_BADGE_TONE, LocataireBadgeKey, locataireBadgeKey } from '../locataire-status';
import { Tooltip } from '../../../shared/tooltip/tooltip';
import { RemarquesButton } from '../../remarques/remarques-button';
import { RemarquesView } from '../../remarques/remarques-view/remarques-view';
import { RemarqueCible } from '../../remarques/remarque.models';
import { LocataireApi } from '../locataire-api';
import { LocataireForm } from '../locataire-form/locataire-form';
import { LocataireDTO, LocataireFilter } from '../locataire.models';
import { SettingsService } from '../../../core/settings-service';

/** Colonnes triables : les clés sont les propriétés de tri acceptées par l'API (`sort=`). */
const COLUMNS: readonly DataTableColumn[] = [
  { key: 'locataire', label: 'locataires.col.locataire' },
  { key: 'nbRemarques', label: 'locataires.col.remarques', align: 'center' },
  { key: 'garages', label: 'locataires.col.garages', align: 'center' },
  { key: 'statut', label: 'locataires.col.statut', align: 'center' },
  { key: 'actions', label: 'locataires.col.actions', sortable: false, align: 'center' },
];

interface Deletion {
  locataire: LocataireDTO;
  /** Refus de l'API : message et motifs détaillés (RG-LOCT-20). */
  refusal: { message: string; reasons: string[] } | null;
  error: string | null;
}

/** Liste des locataires (RG-LOCT-11 et 12) : filtres à compteurs, recherche, tri multi-colonnes, pagination serveur. */
@Component({
  selector: 'app-locataires-page',
  imports: [
    TranslatePipe,
    DataTable,
    DataTableCell,
    FilterButtons,
    SearchInput,
    StatusBadge,
    Tooltip,
    Confirm,
    LocataireForm,
    RemarquesButton,
    RemarquesView,
    SummaryCard,
  ],
  templateUrl: './locataires-page.html',
  styleUrl: './locataires-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocatairesPage {
  protected readonly droits = screenRights('TEN');
  private readonly api = inject(LocataireApi);
  private readonly errors = inject(ErrorMessageService);
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);

  /** Lignes par page : paramètre `lignes_liste` (RG-PAR-09). */
  protected readonly pageSize = inject(SettingsService).lignesListe;
  protected readonly filter = signal<LocataireFilter>('ACTUEL');
  protected readonly search = signal('');
  protected readonly page = signal(0);
  protected readonly sort = signal<SortSpec[]>([]);

  /** Locataire dont on édite la fiche (`null` dans l'objet : création) et suppression en cours. */
  protected readonly form = signal<{ locataire: LocataireDTO | null } | null>(null);
  protected readonly deletion = signal<Deletion | null>(null);
  /** Locataire dont on consulte les remarques : elles remplacent la liste (RG-REM-01). */
  protected readonly remarks = signal<LocataireDTO | null>(null);
  /** Mémorisée : un nouvel objet à chaque rendu relancerait la requête des remarques. */
  protected readonly remarksTarget = computed<RemarqueCible | null>(() => {
    const locataire = this.remarks();
    return locataire ? { type: 'locataire', id: locataire.id, libelle: `${locataire.prenom} ${locataire.nom}` } : null;
  });

  protected readonly list = rxResource({
    params: () => ({ page: this.page(), sort: this.sort(), q: this.search(), statut: this.filter() }),
    stream: ({ params }) =>
      this.api.list({
        page: params.page,
        size: this.pageSize(),
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

  protected readonly filterOptions = computed<FilterOption<LocataireFilter>[]>(() => {
    const counters = this.counters.hasValue() ? this.counters.value() : null;
    const option = (value: LocataireFilter, label: string): FilterOption<LocataireFilter> => ({
      value,
      label,
      count: counters ? counters[value] : null,
    });
    return [
      option('ACTUEL', 'locataires.filtre.ACTUEL'),
      option('A_VENIR', 'locataires.filtre.A_VENIR'),
      option('ANCIEN', 'locataires.filtre.ANCIEN'),
      option('SANS_LOCATION', 'locataires.filtre.SANS_LOCATION'),
      option('TOUS', 'locataires.filtre.TOUS'),
    ];
  });

  /** Le statut est redondant avec le filtre sauf pour les actuels (À jour ou En retard) et dans « Tous ». */
  protected readonly columns = computed(() => {
    const filter = this.filter();
    const showStatut = filter === 'ACTUEL' || filter === 'TOUS';
    return COLUMNS.filter((column) => column.key !== 'statut' || showStatut);
  });

  protected readonly rowKey = (locataire: LocataireDTO) => locataire.id;
  /** Un ancien locataire est atténué (RG-LOCT-10). */
  protected readonly rowClass = (locataire: LocataireDTO) => (locataire.statut === 'ANCIEN' ? 'is-dimmed' : null);

  protected badgeKey(locataire: LocataireDTO): LocataireBadgeKey {
    return locataireBadgeKey(locataire);
  }

  protected tone(locataire: LocataireDTO): BadgeTone {
    return LOCATAIRE_BADGE_TONE[this.badgeKey(locataire)];
  }

  /** « Marie Dupont » → « MD ». */
  protected initials(locataire: LocataireDTO): string {
    return `${locataire.prenom.charAt(0)}${locataire.nom.charAt(0)}`.toUpperCase();
  }

  protected fullName(locataire: LocataireDTO): string {
    const civilite = locataire.civilite ? `${this.translate.instant(`locataires.civilite.${locataire.civilite}`)} ` : '';
    return `${civilite}${locataire.prenom} ${locataire.nom}`;
  }

  /** `?remarques=id` (carte « Remarques à traiter » du tableau de bord) : ouvre directement ses remarques. */
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly deepLink = (() => {
    const id = Number(this.route.snapshot.queryParamMap.get('remarques'));
    if (id) {
      this.api.get(id).subscribe({ next: (target) => this.remarks.set(target) });
    }
    return id || null;
  })();

  protected openRemarks(locataire: LocataireDTO): void {
    this.remarks.set(locataire);
  }

  protected closeRemarks(): void {
    this.remarks.set(null);
    if (this.route.snapshot.queryParamMap.has('remarques')) {
      this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
    }
  }

  /** Adresse, téléphones, e-mail, garages loués (maquette). */
  protected summaryFields(locataire: LocataireDTO): SummaryField[] {
    this.language.lang();
    const t = (key: string) => this.translate.instant(key);
    return [
      { label: t('locataires.fiche.adresse'), value: this.address(locataire) },
      { label: t('locataires.form.tel1'), value: locataire.tel1 },
      { label: t('locataires.form.tel2'), value: locataire.tel2 || '—' },
      { label: t('locataires.form.email'), value: locataire.email || '—' },
      { label: t('locataires.fiche.garages'), value: locataire.garages.join(', ') || '—' },
    ];
  }

  /** « 14 Rue de la Station, 1050 Ixelles », comme dans la maquette. */
  protected address(locataire: LocataireDTO): string {
    return `${locataire.numeroRue} ${locataire.rue}, ${locataire.codePostal} ${locataire.localite}`;
  }

  protected setFilter(filter: LocataireFilter): void {
    this.filter.set(filter);
    this.page.set(0);
  }

  protected setSearch(search: string): void {
    this.search.set(search);
    this.page.set(0);
  }

  protected openForm(locataire: LocataireDTO | null): void {
    this.form.set({ locataire });
  }

  protected formSaved(): void {
    this.form.set(null);
    this.refresh();
  }

  protected askDelete(locataire: LocataireDTO): void {
    this.deletion.set({ locataire, refusal: null, error: null });
  }

  protected confirmDelete(): void {
    const current = this.deletion();
    if (!current) {
      return;
    }
    this.api.delete(current.locataire.id).subscribe({
      next: () => {
        this.deletion.set(null);
        this.refresh();
      },
      error: (err: unknown) => {
        const apiError = toApiError(err);
        const message = this.errors.text(apiError);
        const details = this.errors.details(apiError);
        this.deletion.set(
          apiError.code === 'LOCT_SUPPRESSION_REFUSEE'
            ? { ...current, refusal: { message, reasons: details.length > 0 ? details : [message] }, error: null }
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
