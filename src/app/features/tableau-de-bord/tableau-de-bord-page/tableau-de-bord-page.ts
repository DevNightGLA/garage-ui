import { formatCurrency } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { EMPTY, Observable } from 'rxjs';
import { toApiError } from '../../../core/api/api-error';
import { ErrorMessageService } from '../../../core/api/error-message-service';
import { LanguageService } from '../../../core/language-service';
import { RightsService } from '../../../core/rights/rights-service';
import { SettingsService } from '../../../core/settings-service';
import { TODAY } from '../../../core/today';
import { isoToDisplay, parseIso } from '../../../shared/date-input/date-utils';
import { monthLabel } from '../../../shared/month-picker/month-utils';
import { TaskCard } from '../../../shared/task-card/task-card';
import { Tooltip } from '../../../shared/tooltip/tooltip';
import { ContactDialog, ContactManuel } from '../../messages/contact-dialog/contact-dialog';
import { MessagesApi } from '../../messages/messages-api';
import { AvisLoyerDTO, RelanceDTO } from '../../messages/messages.models';
import { TableauDeBordApi } from '../tableau-de-bord-api';
import { ImpayeARelancer, RemarqueATraiter } from '../tableau-de-bord.models';

/** Avis affichés sur la carte ; au-delà, « n autres avis » (RG-DAS-07). */
export const AVIS_SHOWN = 4;

interface Kpi {
  key: 'occupation' | 'loyers' | 'impayes' | 'libres';
  value: string;
  noteKey: string;
  /** `null` tant que les données n'ont pas répondu : la note reste vide. */
  noteParams: Record<string, number> | null;
  icon: string;
}

/** Fenêtre de contact manuel ouverte depuis une carte. */
interface ContactTarget {
  kind: 'informe' | 'relance';
  name: string;
  contact: string | null;
  save: (contact: ContactManuel) => Observable<unknown>;
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

/**
 * Tableau de bord v2 (RG-DAS-01 à 07, maquette v2) : quatre indicateurs, « Impayés à relancer » et « Remarques à
 * traiter » côte à côte, « Avis de loyer à communiquer » en pleine largeur. Les graphiques sont dans les pages
 * Statistiques (décision du 04/11/2026). Les actions des cartes suivent les droits `REL`, `AVI` et `REM`.
 */
@Component({
  selector: 'app-tableau-de-bord-page',
  imports: [TranslatePipe, TaskCard, Tooltip, ContactDialog],
  templateUrl: './tableau-de-bord-page.html',
  styleUrl: './tableau-de-bord-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableauDeBordPage {
  private readonly api = inject(TableauDeBordApi);
  private readonly messages = inject(MessagesApi);
  private readonly errors = inject(ErrorMessageService);
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);
  private readonly router = inject(Router);
  private readonly today = inject(TODAY);
  protected readonly rights = inject(RightsService);

  /** Lignes par carte : paramètre `lignes_hist` (RG-PAR-09). */
  protected readonly pageSize = inject(SettingsService).lignesHist;
  protected readonly late = signal(0);
  protected readonly todoPage = signal(0);
  protected readonly contact = signal<ContactTarget | null>(null);

  protected readonly canRemind = computed(() => this.rights.can('REL', 'a'));
  protected readonly canNotify = computed(() => this.rights.can('AVI', 'a'));

  protected readonly dashboard = rxResource({ stream: () => this.api.get() });
  protected readonly unpaid = rxResource({
    params: () => ({ page: this.late(), size: this.pageSize() }),
    stream: ({ params }) => this.api.impayes(params.page, params.size),
  });
  /** Relances à faire : elles donnent l'échéance et l'e-mail des lignes d'impayés, pour leurs actions. */
  private readonly reminders = rxResource({
    params: () => (this.rights.can('REL', 'v') ? true : undefined),
    stream: () => this.messages.relances({ page: 0, size: 100, filters: { filtre: 'A_RELANCER' } }),
  });
  protected readonly todo = rxResource({
    params: () => ({ page: this.todoPage(), size: this.pageSize() }),
    stream: ({ params }) => this.api.remarques(params.page, params.size),
  });
  protected readonly notices = rxResource({ stream: () => this.api.avis() });

  // `value()` lève une exception quand la ressource est en erreur : on le lit seulement s'il existe.
  protected readonly data = computed(() => (this.dashboard.hasValue() ? this.dashboard.value() : null));
  protected readonly unpaidRows = computed(() => (this.unpaid.hasValue() ? this.unpaid.value().content : []));
  protected readonly unpaidTotal = computed(() => (this.unpaid.hasValue() ? this.unpaid.value().totalElements : 0));
  protected readonly todoRows = computed(() => (this.todo.hasValue() ? this.todo.value().content : []));
  protected readonly todoTotal = computed(() => (this.todo.hasValue() ? this.todo.value().totalElements : 0));
  protected readonly allNotices = computed(() => (this.notices.hasValue() ? this.notices.value() : []));
  protected readonly shownNotices = computed(() => this.allNotices().slice(0, AVIS_SHOWN));
  protected readonly otherNotices = computed(() => Math.max(0, this.allNotices().length - AVIS_SHOWN));

  protected readonly dashboardError = computed(() => this.message(this.dashboard.error()));
  protected readonly unpaidError = computed(() => this.message(this.unpaid.error()));
  protected readonly todoError = computed(() => this.message(this.todo.error()));
  protected readonly noticesError = computed(() => this.message(this.notices.error()));

  private readonly reminderByLine = computed(() => {
    const map = new Map<string, RelanceDTO>();
    for (const relance of this.reminders.hasValue() ? this.reminders.value().content : []) {
      map.set(`${relance.garageId}|${relance.periode}`, relance);
    }
    return map;
  });

  /** Les quatre indicateurs ; un tiret tant que les données n'ont pas répondu. */
  protected readonly kpis = computed<Kpi[]>(() => {
    const data = this.data();
    const kpis: Kpi[] = [
      {
        key: 'occupation',
        value: data ? `${data.tauxOccupation.pourcentage} %` : '—',
        noteKey: 'tableauDeBord.kpi.occupation.note',
        noteParams: data ? { loues: data.tauxOccupation.garagesLoues, total: data.tauxOccupation.garagesTotal } : null,
        icon: 'fa-solid fa-warehouse',
      },
      {
        key: 'loyers',
        value: data ? this.eur(data.loyersMensuels) : '—',
        noteKey: 'tableauDeBord.kpi.loyers.note',
        noteParams: data ? {} : null,
        icon: 'fa-solid fa-euro-sign',
      },
      {
        key: 'impayes',
        value: data ? this.eur(data.impayes.montant) : '—',
        noteKey: 'tableauDeBord.kpi.impayes.note',
        noteParams: data ? { totaux: data.impayes.nbTotaux, partiels: data.impayes.nbPartiels } : null,
        icon: 'fa-solid fa-triangle-exclamation',
      },
      {
        key: 'libres',
        value: data ? String(data.garagesLibres.nombre) : '—',
        noteKey: 'tableauDeBord.kpi.libres.note',
        noteParams: data ? { n: data.garagesLibres.nombreIndisponibles } : null,
        icon: 'fa-solid fa-key',
      },
    ];
    return kpis;
  });

  // --- Impayés à relancer (RG-DAS-06) ---

  protected tenant(unpaid: ImpayeARelancer): string {
    return `${unpaid.locataire.prenom} ${unpaid.locataire.nom}`;
  }

  protected tenantInitials(unpaid: ImpayeARelancer): string {
    return `${unpaid.locataire.prenom.charAt(0)}${unpaid.locataire.nom.charAt(0)}`.toUpperCase();
  }

  /** « G06 · Septembre 2026 » */
  protected period(unpaid: ImpayeARelancer): string {
    return `${unpaid.garage.numero} · ${monthLabel(this.language.lang(), unpaid.periode.slice(0, 7))}`;
  }

  /** « Reçu 40,00 € sur 80,00 € » pour un impayé partiel. */
  protected received(unpaid: ImpayeARelancer): string | null {
    return unpaid.type === 'PARTIEL'
      ? this.translate.instant('tableauDeBord.impayes.recu', { recu: this.eur(unpaid.montantRecu), du: this.eur(unpaid.montantDu) })
      : null;
  }

  protected reminder(unpaid: ImpayeARelancer): RelanceDTO | null {
    return this.reminderByLine().get(`${unpaid.garage.id}|${unpaid.periode}`) ?? null;
  }

  /** E-mail de relance : préparé dans l'écran Relances d'impayés. */
  protected remindByMail(relance: RelanceDTO): void {
    this.router.navigate(['/relances'], { queryParams: { echeance: relance.echeanceId } });
  }

  protected remindManually(unpaid: ImpayeARelancer, relance: RelanceDTO): void {
    this.contact.set({
      kind: 'relance',
      name: this.tenant(unpaid),
      contact: relance.telephone,
      save: ({ moyen, date }) => this.messages.relanceManuelle({ echeanceId: relance.echeanceId, moyen, date }),
    });
  }

  // --- Remarques à traiter ---

  protected todoWho(remarque: RemarqueATraiter): string {
    return remarque.garage
      ? this.translate.instant('tableauDeBord.remarques.garage', { numero: remarque.garage })
      : (remarque.locataire ?? '');
  }

  protected todoAvatar(remarque: RemarqueATraiter): string {
    return remarque.garage ?? initialsOf(remarque.locataire ?? '');
  }

  /** Texte brut d'une remarque (sans balises), coupé à deux lignes par le style. */
  protected plain(html: string): string {
    return html
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /** « aujourd'hui » ou « depuis n j » (maquette). */
  protected since(remarque: RemarqueATraiter): string {
    this.language.lang();
    const created = parseIso(remarque.dateCreation.slice(0, 10));
    const today = this.today();
    const days = created
      ? Math.max(0, Math.round((today.getTime() - new Date(created.year, created.month - 1, created.day).getTime()) / 86_400_000))
      : 0;
    return days === 0
      ? this.translate.instant('tableauDeBord.remarques.aujourdhui')
      : this.translate.instant('tableauDeBord.remarques.depuis', { n: days });
  }

  protected canOpen(remarque: RemarqueATraiter): boolean {
    return this.rights.can('REM', 'v') && this.rights.can(remarque.garage ? 'GAR' : 'TEN', 'v');
  }

  /** Ouvre les remarques du garage ou du locataire. */
  protected openRemark(remarque: RemarqueATraiter): void {
    if (remarque.garageId !== null) {
      this.router.navigate(['/garages'], { queryParams: { remarques: remarque.garageId } });
    } else if (remarque.locataireId !== null) {
      this.router.navigate(['/locataires'], { queryParams: { remarques: remarque.locataireId } });
    }
  }

  // --- Avis de loyer à communiquer (RG-DAS-07) ---

  protected noticeName(avis: AvisLoyerDTO): string {
    return avis.locataire;
  }

  protected noticeInitials(avis: AvisLoyerDTO): string {
    return initialsOf(avis.locataire);
  }

  protected noticeDate(avis: AvisLoyerDTO): string {
    return this.translate.instant('tableauDeBord.avis.des', { date: isoToDisplay(avis.dateEffet) });
  }

  protected delta(avis: AvisLoyerDTO): { text: string; up: boolean } {
    const up = avis.ecart > 0;
    return { text: `${up ? '+' : '−'}${this.eur(Math.abs(avis.ecart))}`, up };
  }

  protected sendNotice(): void {
    this.router.navigate(['/avis-de-loyer']);
  }

  protected notifyManually(avis: AvisLoyerDTO): void {
    this.contact.set({
      kind: 'informe',
      name: avis.locataire,
      contact: avis.telephone,
      save: ({ moyen, date }) =>
        this.rights.can('AVI', 'a')
          ? this.messages.avisInforme({ locationId: avis.locationId, loyerGarageId: avis.loyerGarageId, moyen, date })
          : EMPTY,
    });
  }

  protected contactSaved(): void {
    const target = this.contact();
    this.contact.set(null);
    if (target?.kind === 'relance') {
      this.unpaid.reload();
      this.reminders.reload();
    } else {
      this.notices.reload();
    }
  }

  protected reload(): void {
    this.dashboard.reload();
    this.unpaid.reload();
    this.todo.reload();
    this.notices.reload();
  }

  protected eur(value: number): string {
    return formatCurrency(value, 'fr', '€', 'EUR', '1.2-2');
  }

  private message(error: unknown): string | null {
    return error ? this.errors.text(toApiError(error)) : null;
  }
}
