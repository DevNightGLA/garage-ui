import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Observable, finalize } from 'rxjs';
import { toApiError } from '../../../core/api/api-error';
import { ErrorMessageService } from '../../../core/api/error-message-service';
import { SortSpec } from '../../../core/api/list-params';
import { ROLES, Role } from '../../../core/auth/auth.models';
import { LanguageService } from '../../../core/language-service';
import { screenRights } from '../../../core/rights/screen-rights';
import { SettingsService } from '../../../core/settings-service';
import { Confirm } from '../../../shared/confirm/confirm';
import { DataTable, DataTableColumn } from '../../../shared/data-table/data-table';
import { DataTableCell } from '../../../shared/data-table/data-table-cell';
import { isoToDisplay } from '../../../shared/date-input/date-utils';
import { FilterButtons, FilterOption } from '../../../shared/filter-buttons/filter-buttons';
import { SearchInput } from '../../../shared/search-input/search-input';
import { ToastService } from '../../../shared/toast/toast';
import { Tooltip } from '../../../shared/tooltip/tooltip';
import { TempPasswordDialog } from '../temp-password-dialog/temp-password-dialog';
import { UtilisateurForm } from '../utilisateur-form/utilisateur-form';
import { UtilisateurApi } from '../utilisateur-api';
import { MotDePasseTemporaireDTO, PROFILS, UtilisateurDTO, UtilisateurStatut } from '../utilisateur.models';

const COLUMNS: readonly DataTableColumn[] = [
  { key: 'utilisateur', label: 'utilisateurs.col.utilisateur', sortKey: 'nom' },
  { key: 'login', label: 'utilisateurs.col.login' },
  { key: 'derniereConnexion', label: 'utilisateurs.col.derniereConnexion' },
  { key: 'role', label: 'utilisateurs.col.profil' },
  { key: 'actif', label: 'utilisateurs.col.statut' },
  { key: 'actions', label: 'utilisateurs.col.actions', sortable: false, align: 'center' },
];

type Pending =
  | { kind: 'reset' | 'deactivate' | 'delete'; user: UtilisateurDTO }
  | null;

/**
 * Utilisateurs (RG-USR-01 à 11, maquette « Gestion des utilisateurs ») : cartes de profil qui filtrent, statut
 * Actifs / Désactivés / Tous, recherche, tri, création en quatre étapes, modification, réinitialisation du mot de
 * passe (affiché une fois), désactivation et réactivation, suppression d'un compte sans activité (décision du
 * 03/11/2026). Les refus (son propre compte, dernier admin actif, compte désactivé) sont signalés par l'icône
 * grisée et son info-bulle ; le back reste l'autorité.
 */
@Component({
  selector: 'app-utilisateurs-page',
  imports: [
    TranslatePipe,
    DataTable,
    DataTableCell,
    FilterButtons,
    SearchInput,
    Tooltip,
    Confirm,
    UtilisateurForm,
    TempPasswordDialog,
  ],
  templateUrl: './utilisateurs-page.html',
  styleUrl: './utilisateurs-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UtilisateursPage {
  private readonly api = inject(UtilisateurApi);
  private readonly errors = inject(ErrorMessageService);
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);
  private readonly settings = inject(SettingsService);
  private readonly toasts = inject(ToastService);

  protected readonly droits = screenRights('USR');
  protected readonly columns = COLUMNS;
  protected readonly roles = ROLES;
  protected readonly profils = PROFILS;
  protected readonly pageSize = this.settings.lignesListe;

  protected readonly statut = signal<UtilisateurStatut>('ACTIFS');
  protected readonly role = signal<Role | null>(null);
  protected readonly search = signal('');
  protected readonly page = signal(0);
  protected readonly sort = signal<SortSpec[]>([]);

  protected readonly list = rxResource({
    params: () => ({
      statut: this.statut(),
      role: this.role(),
      q: this.search(),
      page: this.page(),
      sort: this.sort(),
      size: this.pageSize(),
    }),
    stream: ({ params }) =>
      this.api.list({
        page: params.page,
        size: params.size,
        sort: params.sort,
        q: params.q,
        filters: { statut: params.statut === 'TOUS' ? null : params.statut, role: params.role },
      }),
  });
  protected readonly counters = rxResource({ stream: () => this.api.counters() });

  protected readonly rows = computed(() => (this.list.hasValue() ? this.list.value().content : []));
  protected readonly total = computed(() => (this.list.hasValue() ? this.list.value().totalElements : 0));
  protected readonly loadError = computed(() => {
    const error = this.list.error();
    return error ? this.errors.text(toApiError(error)) : null;
  });
  protected readonly statutOptions = computed<FilterOption<UtilisateurStatut>[]>(() => {
    const c = this.counters.hasValue() ? this.counters.value() : null;
    return (['ACTIFS', 'DESACTIVES', 'TOUS'] as const).map((value) => ({
      value,
      label: `utilisateurs.statut.${value}`,
      count: c?.[value] ?? null,
    }));
  });
  protected readonly roleCount = (role: Role) => (this.counters.hasValue() ? this.counters.value()[role] : null);
  /**
   * Seul compte Admin : sa désactivation est refusée d'avance (RG-USR-09). Avec plusieurs admins dont certains
   * désactivés, c'est le refus du back qui s'affiche dans la confirmation.
   */
  private readonly lastActiveAdmin = (user: UtilisateurDTO) => user.role === 'ADMIN' && user.actif && (this.roleCount('ADMIN') ?? 0) <= 1;

  protected readonly form = signal<{ user: UtilisateurDTO | null } | null>(null);
  protected readonly password = signal<{ result: MotDePasseTemporaireDTO; created: boolean } | null>(null);
  protected readonly pending = signal<Pending>(null);
  protected readonly pendingBusy = signal(false);
  protected readonly pendingError = signal<string | null>(null);

  protected readonly rowKey = (user: UtilisateurDTO) => user.id;
  protected readonly rowClass = (user: UtilisateurDTO) => (user.actif ? null : 'is-muted');

  protected setStatut(statut: UtilisateurStatut): void {
    this.statut.set(statut);
    this.page.set(0);
  }

  protected toggleRole(role: Role): void {
    this.role.update((current) => (current === role ? null : role));
    this.page.set(0);
  }

  protected setSearch(search: string): void {
    this.search.set(search);
    this.page.set(0);
  }

  // --- Affichage ---

  protected gradient(user: UtilisateurDTO): string {
    return PROFILS[user.role].gradient;
  }

  protected fullName(user: UtilisateurDTO): string {
    return `${user.nom} ${user.prenom}`;
  }

  protected initials(user: UtilisateurDTO): string {
    return `${user.nom.charAt(0)}${user.prenom.charAt(0)}`.toUpperCase();
  }

  /** « 04/11/2026 · 12:54 » et « Aujourd'hui », « Hier », « il y a n jours », « il y a n mois » (RG-USR-01). */
  protected lastLogin(user: UtilisateurDTO): { date: string; relative: string } | null {
    this.language.lang();
    const iso = user.derniereConnexion;
    if (!iso) {
      return null;
    }
    const day = new Date(`${iso.slice(0, 10)}T00:00:00`);
    const days = Math.round((this.settings.today().getTime() - day.getTime()) / 86_400_000);
    const relative =
      days <= 0
        ? this.translate.instant('utilisateurs.connexion.aujourdhui')
        : days === 1
          ? this.translate.instant('utilisateurs.connexion.hier')
          : days < 31
            ? this.translate.instant('utilisateurs.connexion.jours', { n: days })
            : this.translate.instant('utilisateurs.connexion.mois', { n: Math.floor(days / 30) });
    return { date: `${isoToDisplay(iso.slice(0, 10))} · ${iso.slice(11, 16)}`, relative };
  }

  /** Raison d'un refus de réinitialisation, ou `null` si elle est possible. */
  protected resetBlocked(user: UtilisateurDTO): string | null {
    if (user.vous) {
      return 'utilisateurs.refus.reinitSoi';
    }
    return user.actif ? null : 'utilisateurs.refus.reinitDesactive';
  }

  protected toggleBlocked(user: UtilisateurDTO): string | null {
    if (!user.actif) {
      return null;
    }
    if (user.vous) {
      return 'utilisateurs.refus.desactiverSoi';
    }
    return this.lastActiveAdmin(user) ? 'utilisateurs.refus.dernierAdmin' : null;
  }

  protected deleteBlocked(user: UtilisateurDTO): string | null {
    return user.vous ? 'utilisateurs.refus.supprimerSoi' : null;
  }

  // --- Actions ---

  protected openForm(user: UtilisateurDTO | null): void {
    this.form.set({ user });
  }

  protected created(result: MotDePasseTemporaireDTO): void {
    this.form.set(null);
    this.password.set({ result, created: true });
    this.toasts.show(this.translate.instant('utilisateurs.enregistre'));
    this.refresh();
  }

  protected saved(): void {
    this.form.set(null);
    this.toasts.show(this.translate.instant('utilisateurs.enregistre'));
    this.refresh();
  }

  protected ask(kind: 'reset' | 'deactivate' | 'delete', user: UtilisateurDTO): void {
    this.pendingError.set(null);
    this.pending.set({ kind, user });
  }

  protected reactivate(user: UtilisateurDTO): void {
    this.api.reactivate(user.id).subscribe({
      next: () => {
        this.toasts.show(this.translate.instant('utilisateurs.reactive', { nom: this.fullName(user) }));
        this.refresh();
      },
      error: (err: unknown) => this.toasts.show(this.errors.text(toApiError(err)), 'error'),
    });
  }

  protected confirmPending(): void {
    const pending = this.pending();
    if (!pending || this.pendingBusy()) {
      return;
    }
    const { kind, user } = pending;
    const name = this.fullName(user);
    const request: Observable<unknown> =
      kind === 'reset' ? this.api.resetPassword(user.id) : kind === 'deactivate' ? this.api.deactivate(user.id) : this.api.delete(user.id);
    this.pendingBusy.set(true);
    request.pipe(finalize(() => this.pendingBusy.set(false))).subscribe({
      next: (result) => {
        this.pending.set(null);
        if (kind === 'reset') {
          this.password.set({ result: result as MotDePasseTemporaireDTO, created: false });
        } else {
          this.toasts.show(this.translate.instant(kind === 'deactivate' ? 'utilisateurs.desactive' : 'utilisateurs.supprime', { nom: name }));
        }
        this.refresh();
      },
      error: (err: unknown) => this.pendingError.set(this.errors.text(toApiError(err))),
    });
  }

  protected confirmTitle(kind: 'reset' | 'deactivate' | 'delete'): string {
    return `utilisateurs.confirmer.${kind}.titre`;
  }

  protected refresh(): void {
    this.list.reload();
    this.counters.reload();
  }
}
