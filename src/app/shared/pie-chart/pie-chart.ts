import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Une part : libellé traduit, couleur et nombre. */
export interface PieSlice {
  label: string;
  color: string;
  value: number;
}

/**
 * Camembert de la maquette (Statistiques : répartition par statut, remarques par type) : disque en
 * `conic-gradient`, total dessous, légende avec nombre et pourcentage arrondi. Le texte accessible est la légende ;
 * du contenu peut être projeté sous la légende (taux de résolution).
 */
@Component({
  selector: 'app-pie-chart',
  template: `
    <figure class="pie">
      <div class="pie__disk-wrap">
        <div class="pie__disk" [style.background]="background()" aria-hidden="true"></div>
        <figcaption class="pie__total">{{ caption() }}</figcaption>
      </div>
      <div class="pie__side">
        <ul class="pie__legend">
          @for (row of rows(); track row.label) {
            <li class="pie__row">
              <span class="pie__swatch" [style.background]="row.color" aria-hidden="true"></span>
              <span class="pie__label">{{ row.label }}</span>
              <b class="pie__value">{{ row.value }}</b>
              <span class="pie__pct">{{ row.pct }} %</span>
            </li>
          }
        </ul>
        <ng-content />
      </div>
    </figure>
  `,
  styles: `
    .pie {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      gap: var(--space-12);
      margin: 0;
      padding: var(--space-2) 0 var(--space-4);
    }
    .pie__disk-wrap {
      display: flex;
      flex: none;
      flex-direction: column;
      align-items: center;
      gap: 14px;
      max-width: 100%;
    }
    .pie__disk {
      width: 260px;
      max-width: 100%;
      aspect-ratio: 1;
      border-radius: var(--radius-circle);
      box-shadow: 0 8px 20px rgba(52, 71, 103, 0.15);
    }
    .pie__total {
      font-size: 14px;
      text-align: center;
      color: var(--text-body);
    }
    .pie__side {
      display: flex;
      flex: 0 1 340px;
      flex-direction: column;
      gap: var(--space-6);
      min-width: 240px;
    }
    .pie__legend {
      display: flex;
      flex-direction: column;
      gap: 14px;
      margin: 0;
      padding: var(--space-4) var(--space-5);
      border-radius: var(--radius-lg);
      background: var(--surface-page);
      list-style: none;
    }
    .pie__row {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }
    .pie__swatch {
      flex: none;
      width: 14px;
      height: 14px;
      border-radius: var(--radius-sm);
    }
    .pie__label,
    .pie__value {
      font-size: 15px;
      color: var(--text-heading);
    }
    .pie__label {
      flex: 1;
    }
    .pie__value {
      min-width: 28px;
      text-align: right;
    }
    .pie__pct {
      min-width: 48px;
      font-size: 14px;
      text-align: right;
      color: var(--text-body);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PieChart {
  readonly slices = input.required<readonly PieSlice[]>();
  /** Ligne sous le disque, déjà traduite (« 12 garages au total »). */
  readonly caption = input('');

  private readonly total = computed(() => this.slices().reduce((sum, slice) => sum + slice.value, 0));

  protected readonly rows = computed(() => {
    const total = this.total();
    return this.slices().map((slice) => ({ ...slice, pct: total ? Math.round((slice.value / total) * 100) : 0 }));
  });

  /** Parts successives ; un disque gris quand il n'y a rien. */
  protected readonly background = computed(() => {
    const total = this.total();
    if (!total) {
      return '#e9ecef';
    }
    let from = 0;
    const stops = this.slices()
      .filter((slice) => slice.value > 0)
      .map((slice) => {
        const to = from + (slice.value / total) * 100;
        const stop = `${slice.color} ${from}% ${to}%`;
        from = to;
        return stop;
      });
    return `conic-gradient(${stops.join(', ')})`;
  });
}
