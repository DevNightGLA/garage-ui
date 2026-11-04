import { formatCurrency } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { map } from 'rxjs';
import { toApiError } from '../../../core/api/api-error';
import { ErrorMessageService } from '../../../core/api/error-message-service';
import { LanguageService } from '../../../core/language-service';
import { TODAY } from '../../../core/today';
import { BarChart } from '../../../shared/bar-chart/bar-chart';
import { isoToDisplay } from '../../../shared/date-input/date-utils';
import { capitalize } from '../../../shared/month-picker/month-utils';
import { PieChart, PieSlice } from '../../../shared/pie-chart/pie-chart';
import { YearPicker } from '../../../shared/year-picker/year-picker';
import { StatistiquesApi } from '../statistiques-api';

/** Page de Statistiques (RG-STA-01 à 04), d'après la route. */
export type StatistiquesView = 'loyers' | 'occupation' | 'repartition' | 'remarques';

const VIEW_ICON: Record<StatistiquesView, string> = {
  loyers: 'fa-chart-column',
  occupation: 'fa-chart-line',
  repartition: 'fa-warehouse',
  remarques: 'fa-comment',
};

/** Couleurs de la maquette. */
const STATUT_COLOR = { loues: '#0f8a2a', libres: '#17c1e8', indisponibles: '#f97316' };
const REMARQUE_COLOR = { probleme: '#d40505', information: '#17c1e8', autre: '#344767' };

/**
 * Pages Statistiques (RG-STA-01 à 04, complements-maquette § 9) : une carte par page, avec le sélecteur d'année.
 * L'année est dans l'adresse (`?annee=2025`), l'année en cours par défaut ; les données viennent du back.
 */
@Component({
  selector: 'app-statistiques-page',
  imports: [TranslatePipe, BarChart, PieChart, YearPicker],
  templateUrl: './statistiques-page.html',
  styleUrl: './statistiques-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatistiquesPage {
  private readonly api = inject(StatistiquesApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly errors = inject(ErrorMessageService);
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);
  private readonly today = inject(TODAY);

  protected readonly view: StatistiquesView = (this.route.snapshot.data['vue'] as StatistiquesView) ?? 'loyers';
  protected readonly icon = VIEW_ICON[this.view];
  protected readonly currentYear = this.today().getFullYear();

  protected readonly year = toSignal(
    this.route.queryParamMap.pipe(map((params) => Number(params.get('annee')) || this.currentYear)),
    { initialValue: this.currentYear },
  );

  protected readonly stats = rxResource({
    params: () => this.year(),
    stream: ({ params }) => this.api.get(params),
  });
  protected readonly data = computed(() => (this.stats.hasValue() ? this.stats.value() : null));
  protected readonly loadError = computed(() => {
    const error = this.stats.error();
    return error ? this.errors.text(toApiError(error)) : null;
  });

  protected readonly minYear = computed(() => Math.min(this.currentYear, ...(this.data()?.anneesDisponibles ?? [])));
  protected readonly maxYear = computed(() => Math.max(this.currentYear, ...(this.data()?.anneesDisponibles ?? [])));

  /** Histogramme des pages Loyers encaissés et Taux d'occupation. */
  protected readonly chart = computed(() => {
    const data = this.data();
    if (!data) {
      return null;
    }
    const lang = this.language.lang();
    const label = (mois: string) =>
      capitalize(
        new Intl.DateTimeFormat(lang, { month: 'short' })
          .format(new Date(Number(mois.slice(0, 4)), Number(mois.slice(5, 7)) - 1, 1))
          .replace(/\.$/, ''),
      );
    if (this.view === 'loyers') {
      return {
        labels: data.loyersEncaisses.map((point) => label(point.mois)),
        values: data.loyersEncaisses.map((point) => point.montant),
        format: (value: number) => formatCurrency(value, 'fr', '€', 'EUR', '1.0-0'),
        caption: this.translate.instant('statistiques.loyers.legende', {
          total: formatCurrency(data.totalEncaisse, 'fr', '€', 'EUR', '1.2-2'),
        }),
      };
    }
    return {
      labels: data.tauxOccupation.map((point) => label(point.mois)),
      values: data.tauxOccupation.map((point) => point.pourcentage),
      format: (value: number) => `${value} %`,
      caption: this.translate.instant('statistiques.occupation.legende'),
    };
  });

  protected readonly statusSlices = computed<PieSlice[]>(() => {
    this.language.lang();
    const r = this.data()?.repartition;
    if (!r) {
      return [];
    }
    const t = (key: string) => this.translate.instant(key);
    return [
      { label: t('garages.statut.LOUE'), color: STATUT_COLOR.loues, value: r.loues },
      { label: t('garages.statut.LIBRE'), color: STATUT_COLOR.libres, value: r.libres },
      { label: t('garages.statut.INDISPONIBLE'), color: STATUT_COLOR.indisponibles, value: r.indisponibles },
    ];
  });

  protected readonly remarkSlices = computed<PieSlice[]>(() => {
    this.language.lang();
    const r = this.data()?.remarques;
    if (!r) {
      return [];
    }
    const t = (key: string) => this.translate.instant(key);
    return [
      { label: t('remarques.type.PROBLEME'), color: REMARQUE_COLOR.probleme, value: r.probleme },
      { label: t('remarques.type.INFORMATION'), color: REMARQUE_COLOR.information, value: r.information },
      { label: t('remarques.type.AUTRE'), color: REMARQUE_COLOR.autre, value: r.autre },
    ];
  });

  protected readonly remarkTotal = computed(() => {
    const r = this.data()?.remarques;
    return r ? r.information + r.probleme + r.autre : 0;
  });

  protected date(iso: string): string {
    return isoToDisplay(iso);
  }

  protected setYear(year: number): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { annee: year === this.currentYear ? null : year },
      replaceUrl: true,
    });
  }
}
