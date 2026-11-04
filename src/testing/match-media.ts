import { vi } from 'vitest';

/**
 * Faux `matchMedia` piloté par une largeur d'écran : il répond aux requêtes `(max-width: Npx)` et
 * `(min-width: Npx)` comme le navigateur, et prévient les écouteurs quand la largeur change.
 */
export function mockViewport(initialWidth: number) {
  let width = initialWidth;
  const queries: { media: string; matches: boolean; listeners: Set<(event: MediaQueryListEvent) => void> }[] = [];
  const evaluate = (media: string) => {
    const max = /max-width:\s*(\d+)px/.exec(media);
    const min = /min-width:\s*(\d+)px/.exec(media);
    return (!max || width <= Number(max[1])) && (!min || width >= Number(min[1]));
  };
  const matchMedia = vi.fn((media: string) => {
    const entry = { media, matches: evaluate(media), listeners: new Set<(event: MediaQueryListEvent) => void>() };
    queries.push(entry);
    return {
      get matches() {
        return entry.matches;
      },
      media,
      addEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) => entry.listeners.add(listener),
      removeEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) => entry.listeners.delete(listener),
    };
  });
  window.matchMedia = matchMedia as unknown as typeof window.matchMedia;
  return {
    matchMedia,
    resize(next: number) {
      width = next;
      for (const entry of queries) {
        const matches = evaluate(entry.media);
        if (matches !== entry.matches) {
          entry.matches = matches;
          entry.listeners.forEach((listener) => listener({ matches, media: entry.media } as MediaQueryListEvent));
        }
      }
    },
  };
}

/** Largeurs types (RG-APP-01). */
export const WIDTH = { smartphone: 375, tablette: 800, ordinateur: 1280 } as const;
