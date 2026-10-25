import { HttpParams } from '@angular/common/http';

export type SortDirection = 'asc' | 'desc';

export interface SortSpec {
  key: string;
  dir: SortDirection;
}

export interface ListQuery {
  page: number;
  size: number;
  sort?: SortSpec[];
  q?: string;
  /** Filtres propres à la liste (`statut`, `mois`...) ; les valeurs vides sont ignorées. */
  filters?: Record<string, string | number | boolean | null | undefined>;
}

/** `?page=0&size=10&sort=numero,asc&sort=cles,desc&q=...&statut=LIBRE` */
export function buildListParams(query: ListQuery): HttpParams {
  let params = new HttpParams().set('page', query.page).set('size', query.size);
  for (const s of query.sort ?? []) {
    params = params.append('sort', `${s.key},${s.dir}`);
  }
  const q = query.q?.trim();
  if (q) {
    params = params.set('q', q);
  }
  for (const [name, value] of Object.entries(query.filters ?? {})) {
    if (value !== null && value !== undefined && value !== '') {
      params = params.set(name, String(value));
    }
  }
  return params;
}
