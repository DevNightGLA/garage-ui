import { TestBed } from '@angular/core/testing';
import { BREAKPOINTS, Viewport } from './viewport';

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

describe('Viewport', () => {
  afterEach(() => {
    delete (window as { matchMedia?: unknown }).matchMedia;
  });

  it('considère l\'écran comme un ordinateur quand le navigateur ne sait pas le mesurer', () => {
    delete (window as { matchMedia?: unknown }).matchMedia;
    expect(TestBed.inject(Viewport).isDesktop()).toBe(true);
  });

  it('mesure l\'écran avec le point de rupture « ordinateur » (992 px)', () => {
    const media = mockMatchMedia(false);
    expect(TestBed.inject(Viewport).isDesktop()).toBe(false);
    expect(media.matchMedia).toHaveBeenCalledWith(`(min-width: ${BREAKPOINTS.lg}px)`);
    expect(BREAKPOINTS.lg).toBe(992);
  });

  it('suit les changements de taille (rotation, redimensionnement)', () => {
    const media = mockMatchMedia(true);
    const viewport = TestBed.inject(Viewport);
    expect(viewport.isDesktop()).toBe(true);
    media.change(false);
    expect(viewport.isDesktop()).toBe(false);
    media.change(true);
    expect(viewport.isDesktop()).toBe(true);
  });

  it('cesse d\'écouter quand il est détruit', () => {
    const media = mockMatchMedia(true);
    TestBed.inject(Viewport);
    TestBed.resetTestingModule();
    expect(media.query.removeEventListener).toHaveBeenCalledTimes(1);
  });
});
