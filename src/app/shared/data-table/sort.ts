import { SortSpec } from '../../core/api/list-params';

/** Tri cumulatif d'un clic sur en-tête : aucun, ▲, ▼, puis retiré (RG-LST-05). */
export function nextSort(sort: readonly SortSpec[], key: string): SortSpec[] {
  const current = sort.find((s) => s.key === key);
  if (!current) {
    return [...sort, { key, dir: 'asc' }];
  }
  if (current.dir === 'asc') {
    return sort.map((s) => (s.key === key ? { key, dir: 'desc' } : s));
  }
  return sort.filter((s) => s.key !== key);
}
