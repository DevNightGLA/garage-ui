import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  effect,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SortSpec } from '../../core/api/list-params';
import { LanguageService } from '../../core/language-service';
import { Pagination } from '../pagination/pagination';
import { PopoverMenu, PopoverMenuItem } from '../popover-menu/popover-menu';
import { DataTableCell } from './data-table-cell';
import { nextSort } from './sort';

export interface DataTableColumn {
  /** Clé de la cellule (`appCell`) et, par défaut, de la propriété affichée. */
  key: string;
  /** Clé de traduction de l'en-tête. */
  label: string;
  /** Propriété envoyée au serveur dans `sort` (par défaut `key`). */
  sortKey?: string;
  /** Triable par défaut ; `false` pour la colonne des actions. */
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
  /** Clé de traduction d'une info-bulle sur l'en-tête. */
  title?: string;
}

/**
 * Tableau paginé à tri multi-colonnes. Il n'ordonne ni ne découpe rien : il
 * émet l'état (`page`, `sort`) que l'écran envoie au serveur.
 */
@Component({
  selector: 'app-data-table',
  imports: [NgTemplateOutlet, TranslatePipe, Pagination, PopoverMenu],
  templateUrl: './data-table.html',
  styleUrl: './data-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTable<T> {
  readonly columns = input.required<readonly DataTableColumn[]>();
  readonly rows = input.required<readonly T[]>();
  readonly total = input(0);
  readonly size = input(10);
  /** Nom des éléments comptés (« garages »), déjà traduit. */
  readonly noun = input('');
  readonly page = model(0);
  readonly sort = model<SortSpec[]>([]);

  readonly loading = input(false);
  /** Message d'erreur de chargement, affiché à la place des lignes. */
  readonly error = input<string | null>(null);
  /** Clé de traduction du message de liste vide. */
  readonly emptyMessage = input('liste.vide');
  readonly rowKey = input<(row: T, index: number) => unknown>((_row, index) => index);
  readonly rowClass = input<(row: T) => string | null>();
  readonly clickable = input(false);

  readonly rowClick = output<T>();
  readonly retry = output<void>();

  private readonly cells = contentChildren(DataTableCell);
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);
  protected readonly cellTemplates = computed(
    () => new Map(this.cells().map((cell) => [cell.key(), cell.template])),
  );

  /** Smartphone : les en-têtes disparaissent, le tri passe par ce menu (une colonne à la fois, cumulatif). */
  protected readonly sortMenu = signal<{ x: number; y: number } | null>(null);
  protected readonly sortMenuItems = computed<PopoverMenuItem[]>(() => {
    this.language.lang();
    const sort = this.sort();
    return this.columns()
      .filter((col) => this.isSortable(col))
      .map((col) => {
        const rank = sort.findIndex((s) => s.key === this.sortKeyOf(col));
        const dir = rank >= 0 ? sort[rank].dir : null;
        return {
          icon: dir === 'asc' ? 'fa-solid fa-arrow-up' : dir === 'desc' ? 'fa-solid fa-arrow-down' : 'fa-solid fa-sort',
          label: this.translate.instant(col.label),
          count: sort.length > 1 && rank >= 0 ? rank + 1 : null,
          action: () => this.toggleSort(col),
        };
      });
  });

  constructor() {
    // RG-LST-02 : une page au-delà de la dernière est ramenée à la dernière.
    effect(() => {
      const last = Math.max(0, Math.ceil(this.total() / this.size()) - 1);
      if (!this.loading() && this.page() > last) {
        this.page.set(last);
      }
    });
  }

  protected isSortable(col: DataTableColumn): boolean {
    return col.sortable !== false && col.label !== '';
  }

  protected sortKeyOf(col: DataTableColumn): string {
    return col.sortKey ?? col.key;
  }

  protected rank(col: DataTableColumn): number {
    return this.sort().findIndex((s) => s.key === this.sortKeyOf(col));
  }

  protected direction(col: DataTableColumn): 'asc' | 'desc' | null {
    return this.sort().find((s) => s.key === this.sortKeyOf(col))?.dir ?? null;
  }

  protected ariaSort(col: DataTableColumn): 'ascending' | 'descending' | 'none' | null {
    if (!this.isSortable(col)) {
      return null;
    }
    const dir = this.direction(col);
    return dir === 'asc' ? 'ascending' : dir === 'desc' ? 'descending' : 'none';
  }

  /** ▲ ou ▼ suivi du rang quand plusieurs colonnes sont triées, ↕ sinon. */
  protected indicator(col: DataTableColumn): string {
    const dir = this.direction(col);
    if (!dir) {
      return '↕';
    }
    const arrow = dir === 'asc' ? '▲' : '▼';
    return this.sort().length > 1 ? `${arrow}${this.rank(col) + 1}` : arrow;
  }

  protected toggleSort(col: DataTableColumn): void {
    this.sort.set(nextSort(this.sort(), this.sortKeyOf(col)));
    this.page.set(0);
  }

  protected openSortMenu(event: MouseEvent): void {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.sortMenu.set({ x: rect.left, y: rect.bottom + 6 });
  }

  protected clearSort(): void {
    this.sort.set([]);
    this.page.set(0);
  }

  protected cellText(row: T, key: string): string {
    const value = (row as Record<string, unknown>)[key];
    return value === null || value === undefined ? '' : String(value);
  }

  protected onRowClick(row: T): void {
    if (this.clickable()) {
      this.rowClick.emit(row);
    }
  }
}
