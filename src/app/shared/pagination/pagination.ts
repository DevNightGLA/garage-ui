import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

/** Numéros de page (0-based) à afficher ; `null` marque une coupure « … ». */
export function pageItems(current: number, count: number): (number | null)[] {
  if (count <= 7) {
    return Array.from({ length: count }, (_, i) => i);
  }
  const pages = [...new Set([0, count - 1, current - 1, current, current + 1])]
    .filter((p) => p >= 0 && p < count)
    .sort((a, b) => a - b);
  const items: (number | null)[] = [];
  pages.forEach((p, i) => {
    if (i > 0 && p - pages[i - 1] > 1) {
      items.push(null);
    }
    items.push(p);
  });
  return items;
}

@Component({
  selector: 'app-pagination',
  imports: [TranslatePipe],
  templateUrl: './pagination.html',
  styleUrl: './pagination.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Pagination {
  /** Page affichée, à partir de 0. */
  readonly page = input.required<number>();
  readonly size = input.required<number>();
  readonly total = input.required<number>();
  /** Nom des éléments comptés (« garages »), déjà traduit. */
  readonly noun = input('');
  readonly pageChange = output<number>();

  protected readonly pageCount = computed(() => Math.max(1, Math.ceil(this.total() / this.size())));
  protected readonly current = computed(() => Math.min(this.page(), this.pageCount() - 1));
  protected readonly from = computed(() => (this.total() === 0 ? 0 : this.current() * this.size() + 1));
  protected readonly to = computed(() => Math.min(this.total(), (this.current() + 1) * this.size()));
  protected readonly items = computed(() => pageItems(this.current(), this.pageCount()));

  protected go(page: number): void {
    if (page >= 0 && page < this.pageCount() && page !== this.current()) {
      this.pageChange.emit(page);
    }
  }
}
