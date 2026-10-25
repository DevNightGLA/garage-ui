import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChartConfiguration } from 'chart.js';
import { BAR_COLOR, BarChart } from './bar-chart';

/** Le gabarit réel dessine un canvas, que jsdom ne sait pas faire : on teste la configuration et le texte accessible. */
describe('BarChart', () => {
  let fixture: ComponentFixture<BarChart>;
  let root: HTMLElement;

  const text = (element: Element | null) => (element?.textContent ?? '').replace(/\s+/g, ' ').trim();
  const internals = () =>
    fixture.componentInstance as unknown as {
      data: () => ChartConfiguration<'bar'>['data'];
      options: () => NonNullable<ChartConfiguration<'bar'>['options']>;
      rows: () => { label: string; text: string }[];
    };

  beforeEach(async () => {
    TestBed.configureTestingModule({ imports: [BarChart] }).overrideComponent(BarChart, {
      set: {
        providers: [],
        imports: [],
        template: `
          <table class="sr-only">
            <caption>{{ caption() }}</caption>
            <tbody>
              @for (row of rows(); track $index) {
                <tr><th>{{ row.label }}</th><td>{{ row.text }}</td></tr>
              }
            </tbody>
          </table>`,
      },
    });
    fixture = TestBed.createComponent(BarChart);
    fixture.componentRef.setInput('labels', ['Sept', 'Oct']);
    fixture.componentRef.setInput('values', [120, 340]);
    fixture.componentRef.setInput('format', (value: number) => `${value} €`);
    fixture.componentRef.setInput('caption', 'Loyers encaissés, 12 derniers mois, en euros');
    root = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('donne une barre par mois, aux couleurs de la maquette', () => {
    const data = internals().data();
    expect(data.labels).toEqual(['Sept', 'Oct']);
    expect(data.datasets).toHaveLength(1);
    expect(data.datasets[0].data).toEqual([120, 340]);
    expect(data.datasets[0].backgroundColor).toBe(BAR_COLOR);
  });

  it('suit les valeurs quand elles changent', async () => {
    fixture.componentRef.setInput('values', [10, 20]);
    await fixture.whenStable();
    expect(internals().data().datasets[0].data).toEqual([10, 20]);
  });

  it('affiche les valeurs formatées dans l\'info-bulle et masque légende et axe vertical', () => {
    const options = internals().options();
    expect(options.plugins?.legend?.display).toBe(false);
    expect(options.scales?.['y']?.display).toBe(false);
    const label = options.plugins?.tooltip?.callbacks?.label as (item: { parsed: { y: number } }) => string;
    expect(label({ parsed: { y: 340 } })).toBe('340 €');
  });

  it('garde les mois à plat et réduit la police d\'un graphique étroit', () => {
    const ticks = internals().options().scales?.['x']?.ticks as {
      maxRotation: number;
      autoSkip: boolean;
      font: (context: { chart: { width: number } }) => { size: number };
    };
    expect(ticks.maxRotation).toBe(0);
    expect(ticks.autoSkip).toBe(false);
    expect(ticks.font({ chart: { width: 320 } }).size).toBe(10);
    expect(ticks.font({ chart: { width: 600 } }).size).toBe(12);
  });

  it('propose une alternative texte : un tableau des mois et de leurs valeurs, titré', () => {
    expect(text(root.querySelector('caption'))).toBe('Loyers encaissés, 12 derniers mois, en euros');
    expect(Array.from(root.querySelectorAll('tbody tr')).map((row) => text(row))).toEqual(['Sept120 €', 'Oct340 €']);
  });
});
