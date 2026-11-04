/** Morceau d'un texte comparé : commun, retiré (avant) ou ajouté (après). */
export interface DiffSegment {
  text: string;
  kind: 'same' | 'removed' | 'added';
}

/** Au-delà, la comparaison mot à mot coûterait trop (matrice n × m) : on montre le texte entier. */
const MAX_WORDS = 400;

/**
 * Compare deux textes mot à mot (plus longue sous-suite commune) et renvoie, pour chacun, ses morceaux avec les mots
 * retirés ou ajoutés mis en évidence (RG-AUD-08). Les espaces restent attachés aux mots.
 */
export function wordDiff(before: string, after: string): { before: DiffSegment[]; after: DiffSegment[] } {
  const a = before.split(/(\s+)/).filter(Boolean);
  const b = after.split(/(\s+)/).filter(Boolean);
  if (a.length > MAX_WORDS || b.length > MAX_WORDS) {
    return { before: [{ text: before, kind: 'removed' }], after: [{ text: after, kind: 'added' }] };
  }
  const lcs: number[][] = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }
  const left: DiffSegment[] = [];
  const right: DiffSegment[] = [];
  const push = (list: DiffSegment[], text: string, kind: DiffSegment['kind']) => {
    const last = list[list.length - 1];
    if (last && last.kind === kind) {
      last.text += text;
    } else {
      list.push({ text, kind });
    }
  };
  let i = 0;
  let j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      push(left, a[i], 'same');
      push(right, b[j], 'same');
      i++;
      j++;
    } else if (j < b.length && (i === a.length || lcs[i][j + 1] >= lcs[i + 1][j])) {
      push(right, b[j++], 'added');
    } else {
      push(left, a[i++], 'removed');
    }
  }
  return { before: left, after: right };
}

/** Texte lisible d'une valeur HTML (remarque, modèle) : balises retirées, paragraphes séparés. */
export function plainText(value: string): string {
  if (!/<[a-z][\s\S]*>/i.test(value)) {
    return value;
  }
  const doc = new DOMParser().parseFromString(value.replace(/<\/(p|div|li)>|<br\s*\/?>/gi, '$& '), 'text/html');
  return (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim();
}
