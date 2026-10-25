import { nextSort } from './sort';

describe('nextSort', () => {
  it('ajoute la colonne en croissant, puis décroissant, puis la retire', () => {
    const asc = nextSort([], 'numero');
    expect(asc).toEqual([{ key: 'numero', dir: 'asc' }]);
    const desc = nextSort(asc, 'numero');
    expect(desc).toEqual([{ key: 'numero', dir: 'desc' }]);
    expect(nextSort(desc, 'numero')).toEqual([]);
  });

  it('cumule les colonnes dans l\'ordre des clics et garde leur rang', () => {
    let sort = nextSort([], 'numero');
    sort = nextSort(sort, 'cles');
    sort = nextSort(sort, 'numero');
    expect(sort).toEqual([
      { key: 'numero', dir: 'desc' },
      { key: 'cles', dir: 'asc' },
    ]);
  });

  it('ne modifie pas le tableau reçu', () => {
    const initial = [{ key: 'numero', dir: 'asc' as const }];
    nextSort(initial, 'numero');
    expect(initial).toEqual([{ key: 'numero', dir: 'asc' }]);
  });
});
