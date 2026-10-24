import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTestTranslations } from '../../testing/translations';
import { FilterButtons, FilterOption } from './filter-buttons/filter-buttons';
import { SEARCH_DEBOUNCE_MS, SearchInput } from './search-input/search-input';
import { BadgeTone, StatusBadge } from './status-badge/status-badge';
import { Tooltip } from './tooltip/tooltip';

type Statut = 'LOUE' | 'LIBRE' | 'TOUS';

@Component({
  imports: [FilterButtons, StatusBadge, SearchInput, Tooltip],
  template: `
    <app-filter-buttons [options]="options()" [(value)]="statut" />
    <app-status-badge [tone]="tone()" [block]="true">Loué</app-status-badge>
    <app-search-input [(value)]="query" placeholder="Filtrer par numéro" />
    <button id="icone" [appTooltip]="aide()"><i class="fa-solid fa-pen"></i></button>
  `,
})
class Host {
  options = signal<FilterOption<Statut>[]>([
    { value: 'LOUE', label: 'nav.garages', count: 4 },
    { value: 'LIBRE', label: 'nav.locataires', count: 0 },
    { value: 'TOUS', label: 'nav.locations' },
  ]);
  statut = signal<Statut>('LOUE');
  tone = signal<BadgeTone>('success');
  query = signal('');
  aide = signal('Modifier');
}

describe('composants partagés simples', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  let root: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host], providers: [provideTestTranslations()] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    root = fixture.nativeElement;
    await fixture.whenStable();
  });

  describe('FilterButtons', () => {
    const buttons = () => Array.from(root.querySelectorAll<HTMLButtonElement>('.fb__btn'));

    it('affiche le libellé traduit et le compteur, sans compteur quand il est absent', () => {
      expect(buttons().map((b) => b.textContent!.replace(/\s+/g, ' ').trim())).toEqual([
        'Garages (4)',
        'Locataires (0)',
        'Locations',
      ]);
    });

    it('met en évidence le filtre actif et change de filtre au clic', async () => {
      expect(buttons().map((b) => b.classList.contains('is-active'))).toEqual([true, false, false]);
      buttons()[1].click();
      await fixture.whenStable();
      expect(host.statut()).toBe('LIBRE');
      expect(buttons().map((b) => b.getAttribute('aria-pressed'))).toEqual(['false', 'true', 'false']);
    });
  });

  describe('StatusBadge', () => {
    it('applique la teinte et la largeur fixe des listes', async () => {
      const badge = root.querySelector('app-status-badge')!;
      expect(badge.textContent!.trim()).toBe('Loué');
      expect(badge.classList.contains('tone-success')).toBe(true);
      expect(badge.classList.contains('is-block')).toBe(true);
      host.tone.set('danger');
      await fixture.whenStable();
      expect(badge.classList.contains('tone-danger')).toBe(true);
      expect(badge.classList.contains('tone-success')).toBe(false);
    });
  });

  describe('SearchInput', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    const field = () => root.querySelector<HTMLInputElement>('app-search-input input')!;

    it('attend une pause de saisie avant de mettre à jour la recherche', () => {
      field().value = 'dup';
      field().dispatchEvent(new Event('input'));
      field().value = 'dupont';
      field().dispatchEvent(new Event('input'));
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS - 1);
      expect(host.query()).toBe('');
      vi.advanceTimersByTime(1);
      expect(host.query()).toBe('dupont');
    });

    it('applique la recherche tout de suite avec Entrée', () => {
      field().value = 'G05';
      field().dispatchEvent(new Event('input'));
      field().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      expect(host.query()).toBe('G05');
    });

    it('donne le texte d\'aide comme nom accessible', () => {
      expect(field().placeholder).toBe('Filtrer par numéro');
      expect(field().getAttribute('aria-label')).toBe('Filtrer par numéro');
    });
  });

  describe('Tooltip', () => {
    const bubble = () => document.querySelector<HTMLElement>('[role="tooltip"]');

    it('affiche le texte au survol et le masque en quittant', () => {
      const icon = root.querySelector<HTMLElement>('#icone')!;
      icon.dispatchEvent(new Event('mouseenter'));
      expect(bubble()!.textContent).toBe('Modifier');
      expect(bubble()!.style.display).toBe('block');
      icon.dispatchEvent(new Event('mouseleave'));
      expect(bubble()!.style.display).toBe('none');
    });

    it('réagit aussi au focus clavier et se masque au clic', () => {
      const icon = root.querySelector<HTMLElement>('#icone')!;
      icon.dispatchEvent(new Event('focus'));
      expect(bubble()!.style.display).toBe('block');
      icon.click();
      expect(bubble()!.style.display).toBe('none');
    });

    it('sert de nom accessible à une icône sans texte', () => {
      expect(root.querySelector('#icone')!.getAttribute('aria-label')).toBe('Modifier');
    });

    it('n\'affiche rien quand le texte est vide', async () => {
      host.aide.set('');
      await fixture.whenStable();
      const icon = root.querySelector<HTMLElement>('#icone')!;
      if (bubble()) {
        bubble()!.style.display = 'none';
      }
      icon.dispatchEvent(new Event('mouseenter'));
      expect(bubble()?.style.display ?? 'none').toBe('none');
      expect(icon.hasAttribute('aria-label')).toBe(false);
    });
  });
});
