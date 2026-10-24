import { dateToIso, isRealDate, isoToDisplay, maskDate, parseIso } from './date-utils';

describe('isRealDate', () => {
  it('accepte les dates qui existent', () => {
    expect(isRealDate(2026, 10, 9)).toBe(true);
    expect(isRealDate(2024, 2, 29)).toBe(true);
    expect(isRealDate(2026, 12, 31)).toBe(true);
  });

  it('refuse les dates qui n\'existent pas', () => {
    expect(isRealDate(2025, 2, 29)).toBe(false);
    expect(isRealDate(2026, 2, 31)).toBe(false);
    expect(isRealDate(2026, 4, 31)).toBe(false);
    expect(isRealDate(2026, 13, 1)).toBe(false);
    expect(isRealDate(2026, 0, 10)).toBe(false);
    expect(isRealDate(2026, 5, 0)).toBe(false);
    expect(isRealDate(26, 5, 10)).toBe(false);
  });
});

describe('maskDate', () => {
  it('insère les « / » au fil de la saisie', () => {
    expect(maskDate('0')).toEqual({ text: '0', iso: null, invalid: false });
    expect(maskDate('091').text).toBe('09/1');
    expect(maskDate('0910').text).toBe('09/10');
    expect(maskDate('09102').text).toBe('09/10/2');
  });

  it('ne garde que les chiffres, au plus huit', () => {
    expect(maskDate('09/10/2026').text).toBe('09/10/2026');
    expect(maskDate('a0b9c1d0e2f0g2h6').text).toBe('09/10/2026');
    expect(maskDate('abc').text).toBe('');
  });

  it('donne la date ISO quand les huit chiffres forment une date réelle', () => {
    expect(maskDate('09102026')).toEqual({ text: '09/10/2026', iso: '2026-10-09', invalid: false });
    expect(maskDate('29022024').iso).toBe('2024-02-29');
  });

  it('signale une date inexistante sans la convertir', () => {
    expect(maskDate('31022026')).toEqual({ text: '31/02/2026', iso: null, invalid: true });
    expect(maskDate('29022025').invalid).toBe(true);
    expect(maskDate('00102026').invalid).toBe(true);
    expect(maskDate('09132026').invalid).toBe(true);
  });
});

describe('conversions', () => {
  it('affiche une date ISO en jj/mm/aaaa', () => {
    expect(isoToDisplay('2026-10-09')).toBe('09/10/2026');
    expect(isoToDisplay('2026-10-09T10:30:00')).toBe('09/10/2026');
    expect(isoToDisplay(null)).toBe('');
    expect(isoToDisplay('')).toBe('');
    expect(isoToDisplay('pas une date')).toBe('');
  });

  it('découpe une date ISO', () => {
    expect(parseIso('2026-10-09')).toEqual({ year: 2026, month: 10, day: 9 });
    expect(parseIso(undefined)).toBeNull();
  });

  it('convertit une Date en ISO sans décalage de fuseau', () => {
    expect(dateToIso(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});
