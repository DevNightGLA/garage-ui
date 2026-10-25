import en from './en.json';
import fr from './fr.json';

type Tree = { [key: string]: string | Tree };

const flatten = (tree: Tree, prefix = ''): [string, string][] =>
  Object.entries(tree).flatMap(([key, value]) =>
    typeof value === 'string' ? [[`${prefix}${key}`, value] as [string, string]] : flatten(value, `${prefix}${key}.`),
  );

/** En français, les messages du back s'affichent tels quels : ces deux familles n'existent qu'en anglais. */
const ENGLISH_ONLY = ['erreur.', 'messagesBack.'];

const placeholders = (text: string) => [...text.matchAll(/\{\{(\w+)\}\}/g)].map((match) => match[1]).sort();

describe('Traductions FR et EN', () => {
  const french = new Map(flatten(fr as Tree));
  const english = new Map(flatten(en as Tree));
  const shared = (key: string) => !ENGLISH_ONLY.some((prefix) => key.startsWith(prefix));

  it('chaque clé française a sa traduction anglaise, et inversement', () => {
    expect([...french.keys()].filter((key) => !english.has(key))).toEqual([]);
    expect([...english.keys()].filter((key) => shared(key) && !french.has(key))).toEqual([]);
  });

  it('aucune valeur n\'est vide', () => {
    expect([...french].filter(([, value]) => value.trim() === '').map(([key]) => key)).toEqual([]);
    expect([...english].filter(([, value]) => value.trim() === '').map(([key]) => key)).toEqual([]);
  });

  it('les deux langues utilisent les mêmes paramètres {{...}}', () => {
    const different = [...french.keys()]
      .filter((key) => english.has(key))
      .filter((key) => placeholders(french.get(key)!).join() !== placeholders(english.get(key)!).join());
    expect(different).toEqual([]);
  });

  it('une valeur anglaise ne garde pas de texte français : pas de lettre accentuée hors noms de langue', () => {
    const accented = [...english]
      .filter(([key]) => key !== 'langue.francais')
      .filter(([key, value]) => key.startsWith('messagesBack.') === false && /[àâçéèêëîïôûùü]/i.test(value));
    expect(accented.map(([key]) => key)).toEqual([]);
  });
});
