import { CurrencyPipe, formatCurrency } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { toApiError } from '../../../core/api/api-error';
import { ErrorMessageService } from '../../../core/api/error-message-service';
import { LanguageService } from '../../../core/language-service';
import { BarChart } from '../../../shared/bar-chart/bar-chart';
import { capitalize, monthLabel } from '../../../shared/month-picker/month-utils';
import { BadgeTone, StatusBadge } from '../../../shared/status-badge/status-badge';
import { Tooltip } from '../../../shared/tooltip/tooltip';
import { TableauDeBordApi } from '../tableau-de-bord-api';
import { ImpayeARelancer } from '../tableau-de-bord.models';

/** « Impayés à relancer » : 3 par page (RG-DAS-06). */
export const IMPAYES_PAGE_SIZE = 3;

type ChartKind = 'loyers' | 'occupation';
/** Les deux graphiques, dans l'ordre de navigation (RG-DAS-05). */
const CHARTS: readonly ChartKind[] = ['loyers', 'occupation'];

interface Kpi {
  key: 'occupation' | 'loyers' | 'impayes' | 'libres';
  value: string;
  noteKey: string;
  /** `null` tant que les données n'ont pas répondu : la note reste vide. */
  noteParams: Record<string, number> | null;
  icon: string;
}

/** Tableau de bord (RG-DAS-01 à 06) : quatre indicateurs, deux graphiques sur 12 mois, impayés à relancer. */
@Component({
  selector: 'app-tableau-de-bord-page',
  imports: [CurrencyPipe, TranslatePipe, BarChart, StatusBadge, Tooltip],
  templateUrl: './tableau-de-bord-page.html',
  styleUrl: './tableau-de-bord-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableauDeBordPage {
  private readonly api = inject(TableauDeBordApi);
  private readonly errors = inject(ErrorMessageService);
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);

  protected readonly pageSize = IMPAYES_PAGE_SIZE;
  protected readonly chartIndex = signal(0);
  protected readonly late = signal(0);

  protected readonly dashboard = rxResource({ stream: () => this.api.get() });
  protected readonly unpaid = rxResource({
    params: () => this.late(),
    stream: ({ params }) => this.api.impayes(params, IMPAYES_PAGE_SIZE),
  });

  // `value()` lève une exception quand la ressource est en erreur : on le lit seulement s'il existe.
  protected readonly data = computed(() => (this.dashboard.hasValue() ? this.dashboard.value() : null));
  protected readonly unpaidRows = computed(() => (this.unpaid.hasValue() ? this.unpaid.value().content : []));
  protected readonly unpaidTotal = computed(() => (this.unpaid.hasValue() ? this.unpaid.value().totalElements : 0));
  protected readonly dashboardError = computed(() => {
    const error = this.dashboard.error();
    return error ? this.errors.text(toApiError(error)) : null;
  });
  protected readonly unpaidError = computed(() => {
    const error = this.unpaid.error();
    return error ? this.errors.text(toApiError(error)) : null;
  });

  /** Les quatre indicateurs ; un tiret tant que les données n'ont pas répondu. */
  protected readonly kpis = computed<Kpi[]>(() => {
    const data = this.data();
    const money = (value: number) => formatCurrency(value, 'fr', '€', 'EUR', '1.2-2');
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
        value: data ? money(data.loyersMensuels) : '—',
        noteKey: 'tableauDeBord.kpi.loyers.note',
        noteParams: data ? {} : null,
        icon: 'fa-solid fa-euro-sign',
      },
      {
        key: 'impayes',
        value: data ? money(data.impayes.montant) : '—',
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

  protected readonly chart = computed(() => CHARTS[this.chartIndex()]);
  protected readonly chartNumber = computed(() => this.chartIndex() + 1);
  protected readonly chartCount = CHARTS.length;

  /** Libellés (« Nov », « Déc »...), valeurs et format du graphique affiché. */
  protected readonly chartView = computed(() => {
    const data = this.data();
    if (!data) {
      return null;
    }
    const lang = this.language.lang();
    const label = (mois: string) => this.shortMonth(lang, mois);
    if (this.chart() === 'loyers') {
      return {
        labels: data.loyersEncaisses12Mois.map((point) => label(point.mois)),
        values: data.loyersEncaisses12Mois.map((point) => point.montant),
        format: (value: number) => formatCurrency(value, 'fr', '€', 'EUR', '1.0-0'),
      };
    }
    return {
      labels: data.tauxOccupation12Mois.map((point) => label(point.mois)),
      values: data.tauxOccupation12Mois.map((point) => point.pourcentage),
      format: (value: number) => `${value} %`,
    };
  });

  protected readonly unpaidFrom = computed(() => (this.unpaidTotal() === 0 ? 0 : this.late() * IMPAYES_PAGE_SIZE + 1));
  protected readonly unpaidTo = computed(() => Math.min(this.unpaidTotal(), (this.late() + 1) * IMPAYES_PAGE_SIZE));
  protected readonly hasPrevious = computed(() => this.late() > 0);
  protected readonly hasNext = computed(() => this.unpaidTo() < this.unpaidTotal());

  protected tone(unpaid: ImpayeARelancer): BadgeTone {
    return unpaid.type === 'TOTAL' ? 'danger' : 'warning';
  }

  protected tenant(unpaid: ImpayeARelancer): string {
    return `${unpaid.locataire.prenom} ${unpaid.locataire.nom}`;
  }

  /** « G06 · Septembre 2026 » */
  protected period(unpaid: ImpayeARelancer): string {
    return `${unpaid.garage.numero} · ${monthLabel(this.language.lang(), unpaid.periode.slice(0, 7))}`;
  }

  /** « Reçu 40,00 € sur 80,00 € » pour un impayé partiel. */
  protected received(unpaid: ImpayeARelancer): string | null {
    if (unpaid.type !== 'PARTIEL') {
      return null;
    }
    const money = (value: number) => formatCurrency(value, 'fr', '€', 'EUR', '1.2-2');
    return this.translate.instant('tableauDeBord.impayes.recu', {
      recu: money(unpaid.montantRecu),
      du: money(unpaid.montantDu),
    });
  }

  protected shiftChart(delta: number): void {
    this.chartIndex.update((index) => (index + delta + CHARTS.length) % CHARTS.length);
  }

  protected shiftLate(delta: number): void {
    this.late.update((page) => Math.max(0, page + delta));
  }

  protected reload(): void {
    this.dashboard.reload();
    this.unpaid.reload();
  }

  /** « Nov » pour `2025-11`, sans le point des abréviations françaises (« janv. » donne « Janv »). */
  private shortMonth(lang: string, mois: string): string {
    const name = new Intl.DateTimeFormat(lang, { month: 'short' }).format(
      new Date(Number(mois.slice(0, 4)), Number(mois.slice(5, 7)) - 1, 1),
    );
    return capitalize(name.replace(/\.$/, ''));
  }
}
