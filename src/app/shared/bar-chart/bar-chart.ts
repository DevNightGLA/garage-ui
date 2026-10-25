import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { BarController, BarElement, CategoryScale, ChartConfiguration, LinearScale, Plugin, Tooltip } from 'chart.js';
import { BaseChartDirective, provideCharts } from 'ng2-charts';

/** Barres de la maquette. */
export const BAR_COLOR = '#a8b9d8';
const TEXT_COLOR = '#344767';
const MUTED_COLOR = '#67748E';
const FONT = '"Open Sans", sans-serif';

/**
 * Histogramme sur quelques mois (Chart.js via ng2-charts) : une barre par mois, sa valeur écrite
 * au-dessus, les mois en dessous, comme la maquette. Chart.js ne dessine que le canvas : le texte
 * accessible est un tableau masqué, `caption` en est le titre.
 */
@Component({
  selector: 'app-bar-chart',
  imports: [BaseChartDirective],
  // Seuls les éléments d'un histogramme sont enregistrés : le graphique reste léger.
  providers: [provideCharts({ registerables: [BarController, BarElement, CategoryScale, LinearScale, Tooltip] })],
  templateUrl: './bar-chart.html',
  styleUrl: './bar-chart.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BarChart {
  /** Libellés des barres, déjà traduits (« Nov », « Déc »...). */
  readonly labels = input.required<readonly string[]>();
  readonly values = input.required<readonly number[]>();
  /** Écrit une valeur au-dessus d'une barre et dans l'info-bulle (« 620 € », « 58 % »). */
  readonly format = input.required<(value: number) => string>();
  /** Titre du tableau accessible : ce que montre le graphique. */
  readonly caption = input.required<string>();

  protected readonly data = computed<ChartConfiguration<'bar'>['data']>(() => ({
    labels: [...this.labels()],
    datasets: [
      {
        data: [...this.values()],
        backgroundColor: BAR_COLOR,
        borderRadius: 4,
        barPercentage: 0.6,
        categoryPercentage: 1,
        maxBarThickness: 28,
      },
    ],
  }));

  protected readonly options = computed<ChartConfiguration<'bar'>['options']>(() => {
    const format = this.format();
    return {
      responsive: true,
      maintainAspectRatio: false,
      // la place des valeurs écrites au-dessus des barres
      layout: { padding: { top: 22 } },
      animation: false,
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          // les douze mois restent à plat, la police se réduit quand le graphique est étroit
          ticks: {
            color: MUTED_COLOR,
            autoSkip: false,
            maxRotation: 0,
            minRotation: 0,
            font: (context) => ({ family: FONT, size: context.chart.width < 480 ? 10 : 12 }),
          },
        },
        y: { display: false, beginAtZero: true },
      },
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (item) => format(item.parsed.y ?? 0) } },
      },
    };
  });

  /** Écrit la valeur de chaque barre au-dessus d'elle. */
  protected readonly plugins: Plugin<'bar'>[] = [
    {
      id: 'valeursDesBarres',
      afterDatasetsDraw: (chart) => {
        const { ctx } = chart;
        const format = this.format();
        ctx.save();
        ctx.font = `700 ${chart.width < 480 ? 10 : 11}px ${FONT}`;
        ctx.fillStyle = TEXT_COLOR;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        chart.getDatasetMeta(0).data.forEach((bar, index) => {
          const value = this.values()[index];
          if (value !== undefined) {
            ctx.fillText(format(value), bar.x, bar.y - 4);
          }
        });
        ctx.restore();
      },
    },
  ];

  protected readonly rows = computed(() =>
    this.labels().map((label, index) => ({ label, text: this.format()(this.values()[index] ?? 0) })),
  );
}
