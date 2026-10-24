export interface MaskedDate {
  /** Texte `jj/mm/aaaa` (partiel pendant la saisie). */
  text: string;
  /** `yyyy-MM-dd` si les 8 chiffres forment une date qui existe, sinon `null`. */
  iso: string | null;
  /** Les 8 chiffres sont saisis mais ne forment pas une date réelle (RG-VAL-03). */
  invalid: boolean;
}

const pad = (n: number, length = 2) => String(n).padStart(length, '0');

/** Une date existe réellement (31/02 ou 29/02 d'une année non bissextile n'existent pas). */
export function isRealDate(year: number, month: number, day: number): boolean {
  if (year < 1000 || month < 1 || month > 12 || day < 1) {
    return false;
  }
  const date = new Date(2000, month - 1, day);
  date.setFullYear(year);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export function toIso(year: number, month: number, day: number): string {
  return `${pad(year, 4)}-${pad(month)}-${pad(day)}`;
}

/** Masque de saisie : garde les chiffres, insère les « / » et valide à 8 chiffres. */
export function maskDate(raw: string): MaskedDate {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  let text = digits;
  if (digits.length > 4) {
    text = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  } else if (digits.length > 2) {
    text = `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  if (digits.length < 8) {
    return { text, iso: null, invalid: false };
  }
  const day = Number(digits.slice(0, 2));
  const month = Number(digits.slice(2, 4));
  const year = Number(digits.slice(4));
  return isRealDate(year, month, day)
    ? { text, iso: toIso(year, month, day), invalid: false }
    : { text, iso: null, invalid: true };
}

/** `2026-10-09` → `09/10/2026` ; toute autre valeur donne une chaîne vide. */
export function isoToDisplay(iso: string | null | undefined): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
  return match ? `${match[3]}/${match[2]}/${match[1]}` : '';
}

export function parseIso(iso: string | null | undefined): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
  return match ? { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) } : null;
}

export function dateToIso(date: Date): string {
  return toIso(date.getFullYear(), date.getMonth() + 1, date.getDate());
}
