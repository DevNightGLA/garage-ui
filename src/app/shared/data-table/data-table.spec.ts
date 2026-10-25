import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SortSpec } from '../../core/api/list-params';
import { provideTestTranslations } from '../../../testing/translations';
import { DataTable, DataTableColumn } from './data-table';
import { DataTableCell } from './data-table-cell';

interface Row {
  numero: string;
  cles: number;
  statut: string;
}

@Component({
  imports: [DataTable, DataTableCell],
  template: `
    <app-data-table
      [columns]="columns"
      [rows]="rows()"
      [total]="total()"
      [size]="10"
      noun="garages"
      [loading]="loading()"
      [error]="error()"
      [(page)]="page"
      [(sort)]="sort"
      (retry)="retries = retries + 1"
    >
      <ng-template appCell="statut" let-row>
        <b class="statut">{{ row.statut }}</b>
      </ng-template>
    </app-data-table>
  `,
})
class Host {
  columns: DataTableColumn[] = [
    { key: 'numero', label: 'nav.garages' },
    { key: 'cles', label: 'nav.locataires' },
    { key: 'statut', label: 'nav.locations' },
    { key: 'actions', label: '', sortable: false },
  ];
  rows = signal<Row[]>([
    { numero: 'G01', cles: 3, statut: 'Loué' },
    { numero: 'G02', cles: 2, statut: 'Libre' },
  ]);
  total = signal(25);
  loading = signal(false);
  error = signal<string | null>(null);
  page = signal(0);
  sort = signal<SortSpec[]>([]);
  retries = 0;
}

describe('DataTable', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  let root: HTMLElement;

  const headerButtons = () => Array.from(root.querySelectorAll<HTMLButtonElement>('th .dt__sort'));
  const indicators = () => headerButtons().map((b) => b.querySelector('.dt__ind')!.textContent!.trim());
  const click = async (element: Element) => {
    (element as HTMLElement).click();
    await fixture.whenStable();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host], providers: [provideTestTranslations()] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    root = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('affiche les lignes, le gabarit de cellule et le compteur', () => {
    expect(root.querySelectorAll('tbody tr')).toHaveLength(2);
    expect(root.querySelector('tbody td')!.textContent).toContain('G01');
    expect(root.querySelector('.statut')!.textContent).toBe('Loué');
    expect(root.querySelector('.pg__count')!.textContent).toBe('1–10 sur 25 garages');
  });

  it('ne rend pas triable la colonne des actions', () => {
    expect(headerButtons()).toHaveLength(3);
  });

  describe('smartphone (cartes et tri par menu)', () => {
    const sortButton = () => root.querySelector<HTMLButtonElement>('.dt-sort-btn')!;
    const menuItems = () => Array.from(root.querySelectorAll<HTMLButtonElement>('.pm__item'));

    it('étiquette chaque cellule du libellé de sa colonne, pour la présentation en cartes', () => {
      const cells = Array.from(root.querySelectorAll('tbody tr:first-child td'));
      expect(cells.map((td) => td.getAttribute('data-label'))).toEqual(['Garages', 'Locataires', 'Locations', null]);
    });

    it('propose un bouton Trier qui liste les seules colonnes triables', async () => {
      expect(sortButton().textContent!.trim()).toBe('Trier');
      await click(sortButton());
      expect(menuItems().map((item) => item.querySelector('.pm__label')!.textContent)).toEqual([
        'Garages',
        'Locataires',
        'Locations',
      ]);
    });

    it('trie une colonne depuis le menu, avec l\'icône du sens, puis cumule une seconde colonne avec son rang', async () => {
      await click(sortButton());
      await click(menuItems()[0]);
      expect(host.sort()).toEqual([{ key: 'numero', dir: 'asc' }]);
      expect(root.querySelector('.pm')).toBeNull();

      await click(sortButton());
      expect(menuItems()[0].querySelector('i')!.classList.contains('fa-arrow-up')).toBe(true);
      expect(menuItems()[0].querySelector('.pm__count')).toBeNull();
      await click(menuItems()[1]);
      expect(host.sort()).toEqual([
        { key: 'numero', dir: 'asc' },
        { key: 'cles', dir: 'asc' },
      ]);

      await click(sortButton());
      expect(menuItems().map((item) => item.querySelector('.pm__count')?.textContent ?? null)).toEqual(['1', '2', null]);
      await click(menuItems()[0]);
      expect(host.sort()[0]).toEqual({ key: 'numero', dir: 'desc' });
      expect(menuItems()).toHaveLength(0);
    });

    it('revient à la page 1 quand le tri change depuis le menu', async () => {
      host.page.set(2);
      await fixture.whenStable();
      await click(sortButton());
      await click(menuItems()[2]);
      expect(host.page()).toBe(0);
    });
  });

  it('trie une colonne : ▲, ▼, puis retire le tri', async () => {
    const [numero] = headerButtons();
    expect(indicators()).toEqual(['↕', '↕', '↕']);

    await click(numero);
    expect(host.sort()).toEqual([{ key: 'numero', dir: 'asc' }]);
    expect(indicators()[0]).toBe('▲');
    expect(root.querySelector('th')!.getAttribute('aria-sort')).toBe('ascending');

    await click(numero);
    expect(host.sort()).toEqual([{ key: 'numero', dir: 'desc' }]);
    expect(indicators()[0]).toBe('▼');
    expect(root.querySelector('th')!.getAttribute('aria-sort')).toBe('descending');

    await click(numero);
    expect(host.sort()).toEqual([]);
    expect(indicators()[0]).toBe('↕');
  });

  it('affiche le rang quand plusieurs colonnes sont triées', async () => {
    const [numero, cles] = headerButtons();
    await click(cles);
    await click(numero);
    await click(cles);
    expect(host.sort()).toEqual([
      { key: 'cles', dir: 'desc' },
      { key: 'numero', dir: 'asc' },
    ]);
    expect(indicators()).toEqual(['▲2', '▼1', '↕']);
  });

  it('propose « Annuler les tris (n) » et efface tous les tris', async () => {
    expect(root.querySelector('.dt-clear')).toBeNull();
    const [numero, cles] = headerButtons();
    await click(numero);
    await click(cles);
    const clear = root.querySelector('.dt-clear')!;
    expect(clear.textContent).toContain('Annuler les tris (2)');

    host.page.set(2);
    await fixture.whenStable();
    await click(clear);
    expect(host.sort()).toEqual([]);
    expect(host.page()).toBe(0);
    expect(root.querySelector('.dt-clear')).toBeNull();
  });

  it('revient à la page 1 à chaque changement de tri', async () => {
    host.page.set(2);
    await fixture.whenStable();
    expect(host.page()).toBe(2);
    await click(headerButtons()[0]);
    expect(host.page()).toBe(0);
  });

  it('ramène une page hors limite à la dernière page', async () => {
    host.page.set(7);
    await fixture.whenStable();
    expect(host.page()).toBe(2);

    host.total.set(0);
    await fixture.whenStable();
    expect(host.page()).toBe(0);
  });

  it('change de page depuis la pagination', async () => {
    const next = root.querySelectorAll('.pg__btn')[2];
    await click(next);
    expect(host.page()).toBe(1);
    expect(root.querySelector('.pg__count')!.textContent).toBe('11–20 sur 25 garages');
  });

  it('affiche l\'état de chargement, vide et d\'erreur', async () => {
    host.rows.set([]);
    host.loading.set(true);
    await fixture.whenStable();
    expect(root.querySelector('.dt__state')!.textContent).toContain('Chargement…');

    host.loading.set(false);
    host.total.set(0);
    await fixture.whenStable();
    expect(root.querySelector('.dt__state')!.textContent).toContain('Aucun résultat.');
    expect(root.querySelector('.pg__count')!.textContent).toBe('0–0 sur 0 garages');

    host.error.set('Impossible de joindre le serveur.');
    await fixture.whenStable();
    const state = root.querySelector('.dt__state--error')!;
    expect(state.textContent).toContain('Impossible de joindre le serveur.');
    await click(state.querySelector('button')!);
    expect(host.retries).toBe(1);
  });
});
