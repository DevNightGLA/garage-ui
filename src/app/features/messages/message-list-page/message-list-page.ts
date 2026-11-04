import { formatCurrency } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Observable, finalize, forkJoin, map, of, switchMap } from 'rxjs';
import { toApiError } from '../../../core/api/api-error';
import { ErrorMessageService } from '../../../core/api/error-message-service';
import { SortSpec } from '../../../core/api/list-params';
import { PageResponse } from '../../../core/api/page-response';
import { LanguageService } from '../../../core/language-service';
import { RightsService } from '../../../core/rights/rights-service';
import { SettingsService } from '../../../core/settings-service';
import { DataTable, DataTableColumn } from '../../../shared/data-table/data-table';
import { DataTableCell, DataTableHeader } from '../../../shared/data-table/data-table-cell';
import { isoToDisplay } from '../../../shared/date-input/date-utils';
import { EmailPreview, EmailPreviewData } from '../../../shared/email-preview/email-preview';
import { FilterButtons, FilterOption } from '../../../shared/filter-buttons/filter-buttons';
import { Modal } from '../../../shared/modal/modal';
import { monthLabel } from '../../../shared/month-picker/month-utils';
import { SearchInput } from '../../../shared/search-input/search-input';
import { ToastService } from '../../../shared/toast/toast';
import { Tooltip } from '../../../shared/tooltip/tooltip';
import { ContactDialog, ContactManuel } from '../contact-dialog/contact-dialog';
import { MessagesApi } from '../messages-api';
import { AvisLoyerDTO, EnvoiResultat, Moyen, RelanceDTO } from '../messages.models';

/** Écran : avis de changement de loyer (`AVI`) ou relances d'impayés (`REL`). */
export type MessageListView = 'avis' | 'relances';
/** Onglet : à envoyer / à relancer, ou envoyés / relancés. */
export type MessageTab = 'A_FAIRE' | 'FAITS';

/** Une ligne, quelle que soit la vue. */
export interface MessageRow {
  key: string;
  name: string;
  initials: string;
  email: string | null;
  telephone: string | null;
  garage: string;
  date: string;
  sent: boolean;
  moyen: Moyen | null;
  sentDate: string | null;
  /** Avis : ancien → nouveau loyer. */
  change?: { old: number; new: number; ecart: number };
  /** Relance : cas et montants. */
  due?: { cas: 'TOTAL' | 'PARTIEL'; reste: number; recu: number; du: number };
  avis?: AvisLoyerDTO;
  relance?: RelanceDTO;
}

/** « Dubois Pierre » → « DP ». */
function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();
}

const COLUMNS: Record<MessageListView, readonly DataTableColumn[]> = {
  avis: [
    { key: 'choix', label: '', sortable: false, width: '64px', align: 'center' },
    { key: 'locataire', label: 'messages.col.locataire' },
    { key: 'garage', label: 'messages.col.garage' },
    { key: 'montant', label: 'messages.col.loyer', sortKey: 'loyer' },
    { key: 'date', label: 'messages.col.aPartirDu', sortKey: 'dateEffet' },
    { key: 'actions', label: 'messages.col.action', sortable: false, align: 'center' },
  ],
  relances: [
    { key: 'choix', label: '', sortable: false, width: '64px', align: 'center' },
    { key: 'locataire', label: 'messages.col.locataire' },
    { key: 'garage', label: 'messages.col.garage' },
    { key: 'montant', label: 'messages.col.resteDu', sortKey: 'resteDu' },
    { key: 'date', label: 'messages.col.periode', sortKey: 'periode' },
    { key: 'actions', label: 'messages.col.action', sortable: false, align: 'center' },
  ],
};

/** Destinataires listés dans la confirmation avant « n autres » (maquette). */
const CONFIRM_SHOWN = 6;
/** Taille de page maximale acceptée par l'API. */
const API_MAX_SIZE = 100;

/**
 * Avis de loyer et Relances d'impayés (RG chapitre 13, maquette « Envoi de messages ») : onglets avec compteurs,
 * recherche, tri, aperçu de l'e-mail, « Envoyer (n) » avec confirmation, contact manuel (téléphone, courrier, oral).
 * Comme dans la maquette, toutes les lignes avec e-mail sont cochées d'office (sur toutes les pages) ; on décoche
 * celles à ne pas envoyer. `?echeance=id` (tableau de bord) ne coche que la relance de cette échéance.
 * Chaque envoi ajoute une remarque « Information » à la fiche du locataire (back).
 */
@Component({
  selector: 'app-message-list-page',
  imports: [
    TranslatePipe,
    DataTable,
    DataTableCell,
    DataTableHeader,
    FilterButtons,
    SearchInput,
    Tooltip,
    Modal,
    EmailPreview,
    ContactDialog,
  ],
  templateUrl: './message-list-page.html',
  styleUrl: './message-list-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageListPage {
  private readonly api = inject(MessagesApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly errors = inject(ErrorMessageService);
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);
  private readonly toasts = inject(ToastService);
  private readonly rights = inject(RightsService);

  protected readonly view: MessageListView = this.route.snapshot.data['vue'] === 'relances' ? 'relances' : 'avis';
  protected readonly columns = COLUMNS[this.view];
  protected readonly pageSize = inject(SettingsService).lignesListe;
  /** Droit d'ajout : envoyer, enregistrer un contact. */
  protected readonly canSend = computed(() => this.rights.can(this.view === 'avis' ? 'AVI' : 'REL', 'a'));
  protected readonly canEditTenant = computed(() => this.rights.can('TEN', 'm'));

  protected readonly tab = signal<MessageTab>('A_FAIRE');
  protected readonly search = signal('');
  protected readonly page = signal(0);
  protected readonly sort = signal<SortSpec[]>([]);

  /** Lignes décochées (cas général) ou, si non nul, seules lignes cochées (lien du tableau de bord, « tout décocher »). */
  private readonly excluded = signal<ReadonlySet<string>>(new Set());
  private readonly included = signal<ReadonlySet<string> | null>(this.deepLinkKeys());

  protected readonly confirming = signal(false);
  protected readonly sending = signal(false);
  protected readonly sendError = signal<string | null>(null);
  protected readonly preview = signal<{ row: MessageRow; data: EmailPreviewData | null; error: string | null } | null>(null);
  protected readonly contact = signal<MessageRow | null>(null);

  protected readonly list = rxResource({
    params: () => ({ tab: this.tab(), q: this.search(), page: this.page(), sort: this.sort(), size: this.pageSize() }),
    stream: ({ params }) => this.load(params.tab, params.q, params.page, params.size, params.sort),
  });
  protected readonly counters = rxResource({
    params: () => this.search(),
    stream: ({ params }) => this.loadCounters(params),
  });
  /** Toutes les lignes à envoyer pour la recherche en cours : base de la sélection et de l'envoi. */
  private readonly todo = rxResource({
    params: () => (this.canSend() ? { q: this.search() } : undefined),
    stream: ({ params }) => this.loadAll(params.q),
  });

  protected readonly rows = computed(() => (this.list.hasValue() ? this.list.value().content : []));
  protected readonly total = computed(() => (this.list.hasValue() ? this.list.value().totalElements : 0));
  protected readonly loadError = computed(() => {
    const error = this.list.error();
    return error ? this.errors.text(toApiError(error)) : null;
  });

  protected readonly tabOptions = computed<FilterOption<MessageTab>[]>(() => {
    const counters = this.counters.hasValue() ? this.counters.value() : null;
    return [
      { value: 'A_FAIRE', label: `messages.${this.view}.onglet.A_FAIRE`, count: counters?.todo ?? null },
      { value: 'FAITS', label: `messages.${this.view}.onglet.FAITS`, count: counters?.done ?? null },
    ];
  });

  /** Cases affichées : onglet à envoyer, avec le droit d'envoi. */
  protected readonly selecting = computed(() => this.canSend() && this.tab() === 'A_FAIRE');
  private readonly eligible = computed(() => (this.todo.hasValue() ? this.todo.value().filter((row) => !!row.email) : []));
  protected readonly selection = computed(() => {
    const included = this.included();
    const excluded = this.excluded();
    return this.eligible().filter((row) => (included ? included.has(row.key) : !excluded.has(row.key)));
  });
  protected readonly selectedKeys = computed(() => new Set(this.selection().map((row) => row.key)));
  protected readonly selectedCount = computed(() => this.selection().length);
  protected readonly allChecked = computed(() => this.eligible().length > 0 && this.selectedCount() === this.eligible().length);
  protected readonly someChecked = computed(() => this.selectedCount() > 0 && !this.allChecked());
  protected readonly noneEligible = computed(() => this.eligible().length === 0);
  protected readonly confirmList = computed(() => this.selection().slice(0, CONFIRM_SHOWN));
  protected readonly confirmMore = computed(() => Math.max(0, this.selectedCount() - CONFIRM_SHOWN));

  constructor() {
    // Le lien du tableau de bord ne sert qu'une fois : l'URL est nettoyée.
    if (this.route.snapshot.queryParamMap.has('echeance')) {
      this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
    }
  }

  protected readonly rowKey = (row: MessageRow) => row.key;

  protected toggle(row: MessageRow, checked: boolean): void {
    const update = (set: ReadonlySet<string>, add: boolean) => {
      const next = new Set(set);
      if (add) {
        next.add(row.key);
      } else {
        next.delete(row.key);
      }
      return next;
    };
    const included = this.included();
    if (included) {
      this.included.set(update(included, checked));
    } else {
      this.excluded.update((set) => update(set, !checked));
    }
  }

  /** « Tout sélectionner » porte sur toutes les pages (maquette). */
  protected toggleAll(checked: boolean): void {
    this.excluded.set(new Set());
    this.included.set(checked ? null : new Set());
  }

  protected setTab(tab: MessageTab): void {
    this.tab.set(tab);
    this.page.set(0);
  }

  protected setSearch(search: string): void {
    this.search.set(search);
    this.page.set(0);
  }

  // --- Affichage ---

  protected eur(value: number): string {
    return formatCurrency(value, 'fr', '€', 'EUR', '1.2-2');
  }

  protected delta(row: MessageRow): { text: string; up: boolean } {
    const ecart = row.change?.ecart ?? 0;
    return { text: `${ecart > 0 ? '+' : '−'}${this.eur(Math.abs(ecart))}`, up: ecart > 0 };
  }

  /** Ligne sous le montant d'une relance : « Reçu x sur y », « Aucun versement » ou le contact enregistré. */
  protected dueDetail(row: MessageRow): string {
    this.language.lang();
    const due = row.due!;
    if (row.sent) {
      return this.sentLabel(row);
    }
    return due.cas === 'PARTIEL'
      ? this.translate.instant('tableauDeBord.impayes.recu', { recu: this.eur(due.recu), du: this.eur(due.du) })
      : this.translate.instant('messages.relances.aucunVersement');
  }

  /** « par e-mail · le 05/10/2026 », « par téléphone · le 05/10/2026 ». */
  protected sentLabel(row: MessageRow): string {
    this.language.lang();
    return this.translate.instant('messages.fait', {
      moyen: this.translate.instant(`messages.moyenPar.${row.moyen ?? 'EMAIL'}`),
      date: isoToDisplay(row.sentDate ?? ''),
    });
  }

  /** Coordonnées sous le nom : e-mail, ou « Aucun e-mail · téléphone ». */
  protected contactLine(row: MessageRow): string {
    this.language.lang();
    if (row.email) {
      return row.email;
    }
    const none = this.translate.instant('messages.sansEmail');
    return row.telephone ? `${none} · ${row.telephone}` : none;
  }

  protected canPreview(row: MessageRow): boolean {
    return row.sent ? row.moyen === 'EMAIL' : !!row.email;
  }

  /** Avis : contact manuel pour un locataire sans e-mail ; relance : toujours possible tant qu'elle est à faire. */
  protected canContact(row: MessageRow): boolean {
    return this.canSend() && !row.sent && (this.view === 'relances' || !row.email);
  }

  protected canFixEmail(row: MessageRow): boolean {
    return this.canEditTenant() && !row.sent && !row.email;
  }

  protected fixEmail(row: MessageRow): void {
    this.router.navigate(['/locataires'], { queryParams: { q: row.name } });
  }

  // --- Aperçu ---

  protected openPreview(row: MessageRow): void {
    this.preview.set({ row, data: null, error: null });
    const request: Observable<EmailPreviewData> = row.avis ? this.api.avisPreview(row.avis) : this.api.relancePreview(row.relance!);
    request.subscribe({
      next: (data) => this.preview.update((current) => (current?.row === row ? { ...current, data } : current)),
      error: (err: unknown) =>
        this.preview.update((current) =>
          current?.row === row ? { ...current, error: this.errors.text(toApiError(err)) } : current,
        ),
    });
  }

  // --- Envoi ---

  protected askSend(): void {
    if (this.selectedCount() > 0) {
      this.sendError.set(null);
      this.confirming.set(true);
    }
  }

  protected confirmSend(): void {
    const rows = this.selection();
    if (rows.length === 0 || this.sending()) {
      return;
    }
    this.sending.set(true);
    this.sendError.set(null);
    const request: Observable<EnvoiResultat> =
      this.view === 'avis'
        ? this.api.sendAvis(rows.map((row) => ({ locationId: row.avis!.locationId, loyerGarageId: row.avis!.loyerGarageId })))
        : this.api.sendRelances(rows.map((row) => ({ echeanceId: row.relance!.echeanceId })));
    request.pipe(finalize(() => this.sending.set(false))).subscribe({
      next: (result) => {
        this.confirming.set(false);
        this.excluded.set(new Set());
        this.included.set(null);
        const n = result.envoyes;
        this.toasts.show(this.translate.instant(`messages.${this.view}.envoyes.${n > 1 ? 'n' : 'un'}`, { n }));
        this.refresh();
      },
      error: (err: unknown) => this.sendError.set(this.errors.text(toApiError(err))),
    });
  }

  /** Contact manuel (téléphone, courrier, oral). */
  protected readonly saveContact = ({ moyen, date }: ContactManuel): Observable<unknown> => {
    const row = this.contact()!;
    return row.avis
      ? this.api.avisInforme({ locationId: row.avis.locationId, loyerGarageId: row.avis.loyerGarageId, moyen, date })
      : this.api.relanceManuelle({ echeanceId: row.relance!.echeanceId, moyen, date });
  };

  protected contactSaved(): void {
    this.contact.set(null);
    this.toasts.show(this.translate.instant(`messages.${this.view}.contactEnregistre`));
    this.refresh();
  }

  protected refresh(): void {
    this.list.reload();
    this.counters.reload();
    this.todo.reload();
  }

  // --- Chargement ---

  private deepLinkKeys(): ReadonlySet<string> | null {
    const echeance = Number(this.route.snapshot.queryParamMap.get('echeance'));
    return this.view === 'relances' && echeance ? new Set([`R${echeance}`]) : null;
  }

  private load(tab: MessageTab, q: string, page: number, size: number, sort: SortSpec[]): Observable<PageResponse<MessageRow>> {
    const query = { page, size, sort, q };
    if (this.view === 'avis') {
      return this.api
        .avis({ ...query, filters: { filtre: tab === 'A_FAIRE' ? 'A_ENVOYER' : 'ENVOYES' } })
        .pipe(map((result) => ({ ...result, content: result.content.map((avis) => this.fromAvis(avis)) })));
    }
    return this.api
      .relances({ ...query, filters: { filtre: tab === 'A_FAIRE' ? 'A_RELANCER' : 'RELANCES' } })
      .pipe(map((result) => ({ ...result, content: result.content.map((relance) => this.fromRelance(relance)) })));
  }

  /** Toutes les pages de l'onglet « à envoyer » (100 lignes par appel, maximum de l'API). */
  private loadAll(q: string): Observable<MessageRow[]> {
    const pageOf = (page: number) => this.load('A_FAIRE', q, page, API_MAX_SIZE, []);
    return pageOf(0).pipe(
      switchMap((first) => {
        const pages = Math.ceil(first.totalElements / API_MAX_SIZE);
        if (pages <= 1) {
          return of(first.content);
        }
        const rest = Array.from({ length: pages - 1 }, (_, i) => pageOf(i + 1));
        return forkJoin(rest).pipe(map((others) => [first, ...others].flatMap((result) => result.content)));
      }),
    );
  }

  private loadCounters(q: string): Observable<{ todo: number; done: number }> {
    return this.view === 'avis'
      ? this.api.avisCounters(q).pipe(map((c) => ({ todo: c.A_ENVOYER, done: c.ENVOYES })))
      : this.api.relanceCounters(q).pipe(map((c) => ({ todo: c.A_RELANCER, done: c.RELANCES })));
  }

  private fromAvis(avis: AvisLoyerDTO): MessageRow {
    return {
      key: `A${avis.locationId}-${avis.loyerGarageId}`,
      name: avis.locataire,
      initials: initialsOf(avis.locataire),
      email: avis.email,
      telephone: avis.telephone,
      garage: avis.garage,
      date: isoToDisplay(avis.dateEffet),
      sent: avis.statut === 'ENVOYE' || avis.statut === 'INFORME',
      moyen: avis.moyen,
      sentDate: avis.dateEnvoi,
      change: { old: avis.ancienMontant, new: avis.nouveauMontant, ecart: avis.ecart },
      avis,
    };
  }

  private fromRelance(relance: RelanceDTO): MessageRow {
    return {
      key: relance.relanceId !== null ? `S${relance.relanceId}` : `R${relance.echeanceId}`,
      name: relance.locataire,
      initials: initialsOf(relance.locataire),
      email: relance.email,
      telephone: relance.telephone,
      garage: relance.garage,
      date: monthLabel(this.language.lang(), relance.periode.slice(0, 7)),
      sent: relance.statut === 'RELANCE',
      moyen: relance.moyen,
      sentDate: relance.dateRelance,
      due: { cas: relance.cas, reste: relance.resteDu, recu: relance.montantRecu, du: relance.montantDu },
      relance,
    };
  }
}
