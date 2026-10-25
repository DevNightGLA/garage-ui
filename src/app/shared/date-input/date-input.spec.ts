import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { provideTestTranslations } from '../../../testing/translations';
import { TODAY } from '../../core/today';
import { DateInput } from './date-input';

@Component({
  imports: [DateInput, ReactiveFormsModule],
  template: `<app-date-input [formControl]="control" />`,
})
class Host {
  control = new FormControl<string | null>(null);
}

describe('DateInput', () => {
  let fixture: ComponentFixture<Host>;
  let control: FormControl<string | null>;
  let root: HTMLElement;

  const field = () => root.querySelector<HTMLInputElement>('input')!;
  const type = async (text: string) => {
    field().value = text;
    field().dispatchEvent(new Event('input'));
    await fixture.whenStable();
  };
  const openCalendar = async () => {
    root.querySelector<HTMLButtonElement>('.di__btn')!.click();
    await fixture.whenStable();
  };
  const calendar = () => root.querySelector('.cal');
  const days = () => Array.from(root.querySelectorAll<HTMLButtonElement>('.cal__day'));
  const dayButton = (n: number) => days().find((d) => d.textContent!.trim() === String(n))!;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Host],
      providers: [provideTestTranslations(), { provide: TODAY, useValue: () => new Date(2026, 9, 9) }],
    }).compileComponents();
    fixture = TestBed.createComponent(Host);
    control = fixture.componentInstance.control;
    root = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('affiche la valeur du formulaire en jj/mm/aaaa', async () => {
    control.setValue('2026-10-09');
    await fixture.whenStable();
    expect(field().value).toBe('09/10/2026');
    expect(field().placeholder).toBe('jj/mm/aaaa');
  });

  it('applique le masque et envoie yyyy-MM-dd quand la date est complète', async () => {
    await type('0910');
    expect(field().value).toBe('09/10');
    expect(control.value).toBeNull();

    await type('09/10/2026');
    expect(field().value).toBe('09/10/2026');
    expect(control.value).toBe('2026-10-09');
  });

  it('vide le champ pour une date inexistante', async () => {
    await type('31022026');
    expect(field().value).toBe('');
    expect(control.value).toBeNull();
  });

  it('repasse la valeur à null quand la date n\'est plus complète', async () => {
    await type('09102026');
    expect(control.value).toBe('2026-10-09');
    await type('0910202');
    expect(control.value).toBeNull();
  });

  it('vide une saisie incomplète en quittant le champ', async () => {
    await type('0910');
    field().dispatchEvent(new Event('blur'));
    await fixture.whenStable();
    expect(field().value).toBe('');
    expect(control.value).toBeNull();
  });

  it('garde une date complète en quittant le champ et marque le champ touché', async () => {
    await type('09102026');
    field().dispatchEvent(new Event('blur'));
    await fixture.whenStable();
    expect(field().value).toBe('09/10/2026');
    expect(control.touched).toBe(true);
  });

  it('désactive le champ et le calendrier', async () => {
    control.disable();
    await fixture.whenStable();
    expect(field().disabled).toBe(true);
    expect(root.querySelector<HTMLButtonElement>('.di__btn')!.disabled).toBe(true);
  });

  describe('calendrier', () => {
    it('s\'ouvre sur le mois du jour avec le jour du jour en évidence', async () => {
      await openCalendar();
      expect(calendar()).not.toBeNull();
      expect(root.querySelector('.cal__label')!.textContent!.toLowerCase()).toBe('octobre 2026');
      expect(days()).toHaveLength(31);
      expect(dayButton(9).classList.contains('is-today')).toBe(true);
      expect(root.querySelectorAll('.cal__weekdays span')).toHaveLength(7);
      expect(root.querySelector('.cal__weekdays')!.textContent!.replace(/\s/g, '')).toBe('LMMJVSD');
    });

    it('place le 1er octobre 2026 (un jeudi) après trois cases vides', async () => {
      await openCalendar();
      const cells = Array.from(root.querySelectorAll('.cal__grid:not(.cal__weekdays) > *'));
      expect(cells.slice(0, 3).every((c) => c.tagName === 'SPAN')).toBe(true);
      expect(cells[3].textContent!.trim()).toBe('1');
    });

    it('choisit un jour et ferme', async () => {
      await openCalendar();
      dayButton(15).click();
      await fixture.whenStable();
      expect(control.value).toBe('2026-10-15');
      expect(field().value).toBe('15/10/2026');
      expect(calendar()).toBeNull();
    });

    it('choisit la date du jour avec « Aujourd\'hui »', async () => {
      await openCalendar();
      root.querySelector<HTMLButtonElement>('.cal__today')!.click();
      await fixture.whenStable();
      expect(control.value).toBe('2026-10-09');
      expect(calendar()).toBeNull();
    });

    it('navigue entre les mois', async () => {
      await openCalendar();
      const [previous, next] = Array.from(root.querySelectorAll<HTMLButtonElement>('.cal__nav'));
      next.click();
      await fixture.whenStable();
      expect(root.querySelector('.cal__label')!.textContent!.toLowerCase()).toBe('novembre 2026');
      expect(days()).toHaveLength(30);
      previous.click();
      previous.click();
      await fixture.whenStable();
      expect(root.querySelector('.cal__label')!.textContent!.toLowerCase()).toBe('septembre 2026');
    });

    it('s\'ouvre sur le mois de la date saisie et la met en évidence', async () => {
      control.setValue('2026-02-14');
      await fixture.whenStable();
      await openCalendar();
      expect(root.querySelector('.cal__label')!.textContent!.toLowerCase()).toBe('février 2026');
      expect(days()).toHaveLength(28);
      expect(dayButton(14).classList.contains('is-selected')).toBe(true);
    });

    it('se ferme sans rien changer avec « Fermer », Échap ou un clic sur le fond', async () => {
      control.setValue('2026-10-01');
      await fixture.whenStable();

      await openCalendar();
      root.querySelector<HTMLButtonElement>('.cal__foot .btn')!.click();
      await fixture.whenStable();
      expect(calendar()).toBeNull();

      await openCalendar();
      root.querySelector('.cal')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await fixture.whenStable();
      expect(calendar()).toBeNull();

      await openCalendar();
      root.querySelector<HTMLElement>('.cal-backdrop')!.click();
      await fixture.whenStable();
      expect(calendar()).toBeNull();
      expect(control.value).toBe('2026-10-01');
    });
  });
});
