const pad = (n: number) => String(n).padStart(2, '0');

export const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** Mois d'une date, `yyyy-MM`. */
export function monthOf(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

/** « Octobre 2026 » pour `2026-10`, dans la langue demandée. */
export function monthLabel(lang: string, month: string): string {
  const year = Number(month.slice(0, 4));
  const index = Number(month.slice(5, 7)) - 1;
  const name = new Intl.DateTimeFormat(lang, { month: 'long' }).format(new Date(year, index, 1));
  return `${capitalize(name)} ${year}`;
}
