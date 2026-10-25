import { vi } from 'vitest';

/** Faux `matchMedia` dont on pilote le résultat. */
export function mockMatchMedia(initial: boolean) {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const query = {
    matches: initial,
    addEventListener: vi.fn((_: string, listener: (event: MediaQueryListEvent) => void) => listeners.add(listener)),
    removeEventListener: vi.fn((_: string, listener: (event: MediaQueryListEvent) => void) => listeners.delete(listener)),
  };
  const matchMedia = vi.fn().mockReturnValue(query);
  window.matchMedia = matchMedia as unknown as typeof window.matchMedia;
  return {
    query,
    matchMedia,
    change(matches: boolean) {
      query.matches = matches;
      listeners.forEach((listener) => listener({ matches } as MediaQueryListEvent));
    },
  };
}
