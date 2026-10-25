import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTestTranslations } from '../../../testing/translations';
import { TODAY } from '../../core/today';
import { MonthPicker } from './month-picker';
import { monthLabel, monthOf } from './month-utils';

@Component({
  imports: [MonthPicker],
  template: `<app-month-picker [(value)]="month" />`,
})
class Host {
  readonly month = signal('2026-10');
}

describe('MonthPicker', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  let root: HTMLElement;

  const text = (element: Element | null) => (element?.textContent ?? '').replace(/\s+/g, ' ').trim();
  const button = () => root.querySelector<HTMLButtonElement>('.mp__btn')!;
  const months = () => Array.from(root.querySelectorAll<HTMLButtonElement>('.mp__month'));
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Host],
      providers: [provideTestTranslations(), { provide: TODAY, useValue: () => new Date(2026, 9, 25) }],
    }).compileComponents();
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    root = fixture.nativeElement;
    await settle();
  });

  it('affiche le mois choisi en toutes lettres avec son année', () => {
    expect(text(button())).toBe('Octobre 2026');
  });

  it('ouvre une fenêtre à l\'année du mois choisi, avec les douze mois', async () => {
    button().click();
    await settle();
    expect(text(root.querySelector('.mp__year'))).toBe('2026');
    expect(months().map((m) => text(m))).toEqual([
      'Janv.', 'Févr.', 'Mars', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.',
    ]);
    expect(months().map((m) => m.classList.contains('is-selected'))).toEqual([
      false, false, false, false, false, false, false, false, false, true, false, false,
    ]);
    expect(button().getAttribute('aria-expanded')).toBe('true');
  });

  it('entoure le mois courant quand il n\'est pas le mois choisi', async () => {
    host.month.set('2026-09');
    await settle();
    button().click();
    await settle();
    expect(months().map((m) => m.classList.contains('is-current')).indexOf(true)).toBe(9);
    expect(months()[8].classList.contains('is-selected')).toBe(true);
  });

  it('change d\'année avec les flèches, sans changer le mois choisi', async () => {
    button().click();
    await settle();
    (root.querySelectorAll('.mp__nav')[0] as HTMLElement).click();
    await settle();
    expect(text(root.querySelector('.mp__year'))).toBe('2025');
    expect(months().some((m) => m.classList.contains('is-selected'))).toBe(false);
    expect(host.month()).toBe('2026-10');
    (root.querySelectorAll('.mp__nav')[1] as HTMLElement).click();
    (root.querySelectorAll('.mp__nav')[1] as HTMLElement).click();
    await settle();
    expect(text(root.querySelector('.mp__year'))).toBe('2027');
  });

  it('choisit un mois d\'une autre année et ferme la fenêtre', async () => {
    button().click();
    await settle();
    (root.querySelectorAll('.mp__nav')[0] as HTMLElement).click();
    await settle();
    months()[2].click();
    await settle();
    expect(host.month()).toBe('2025-03');
    expect(text(button())).toBe('Mars 2025');
    expect(root.querySelector('.mp__panel')).toBeNull();
  });

  it('se ferme au clic à côté et avec Échap, et rouvre sur l\'année du mois choisi', async () => {
    button().click();
    await settle();
    (root.querySelector('.mp__backdrop') as HTMLElement).click();
    await settle();
    expect(root.querySelector('.mp__panel')).toBeNull();

    button().click();
    await settle();
    (root.querySelectorAll('.mp__nav')[1] as HTMLElement).click();
    await settle();
    root.querySelector('app-month-picker')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await settle();
    expect(root.querySelector('.mp__panel')).toBeNull();

    button().click();
    await settle();
    expect(text(root.querySelector('.mp__year'))).toBe('2026');
  });
});

describe('month-utils', () => {
  it('formate un mois en toutes lettres selon la langue', () => {
    expect(monthLabel('fr', '2026-10')).toBe('Octobre 2026');
    expect(monthLabel('fr', '2026-08')).toBe('Août 2026');
    expect(monthLabel('en', '2026-10')).toBe('October 2026');
  });

  it('donne le mois d\'une date', () => {
    expect(monthOf(new Date(2026, 0, 31))).toBe('2026-01');
    expect(monthOf(new Date(2026, 11, 1))).toBe('2026-12');
  });
});
