import { buildListParams } from './list-params';

describe('buildListParams', () => {
  it('envoie la page et la taille', () => {
    const params = buildListParams({ page: 2, size: 10 });
    expect(params.get('page')).toBe('2');
    expect(params.get('size')).toBe('10');
    expect(params.has('sort')).toBe(false);
  });

  it('répète sort dans l\'ordre des colonnes triées', () => {
    const params = buildListParams({
      page: 0,
      size: 10,
      sort: [
        { key: 'numero', dir: 'asc' },
        { key: 'cles', dir: 'desc' },
      ],
    });
    expect(params.getAll('sort')).toEqual(['numero,asc', 'cles,desc']);
  });

  it('envoie la recherche sans espaces superflus et ignore une recherche vide', () => {
    expect(buildListParams({ page: 0, size: 10, q: '  dupont ' }).get('q')).toBe('dupont');
    expect(buildListParams({ page: 0, size: 10, q: '   ' }).has('q')).toBe(false);
  });

  it('envoie les filtres renseignés et ignore les valeurs vides', () => {
    const params = buildListParams({
      page: 0,
      size: 5,
      filters: { statut: 'LIBRE', mois: '2026-10', vide: '', absent: null, indefini: undefined, zero: 0 },
    });
    expect(params.get('statut')).toBe('LIBRE');
    expect(params.get('mois')).toBe('2026-10');
    expect(params.get('zero')).toBe('0');
    expect(params.has('vide')).toBe(false);
    expect(params.has('absent')).toBe(false);
    expect(params.has('indefini')).toBe(false);
  });
});
