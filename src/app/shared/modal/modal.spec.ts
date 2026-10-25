import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { provideTestTranslations } from '../../../testing/translations';
import { Confirm } from '../confirm/confirm';
import { DateInput } from '../date-input/date-input';
import { Modal } from './modal';

@Component({
  imports: [Modal],
  template: `
    @if (open()) {
      <app-modal title="Nouveau garage" [subtitle]="subtitle()" [error]="error()" (closed)="open.set(false)">
        <input id="premier" />
        <button id="dernier" type="button">Autre</button>
        <div modalFooter><button id="pied" type="button">Enregistrer</button></div>
      </app-modal>
    }
  `,
})
class Host {
  open = signal(true);
  error = signal<string | null>(null);
  subtitle = signal('');
}

describe('Modal', () => {
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

  it('affiche une ligne sous le titre seulement quand elle est renseignée', async () => {
    expect(root.querySelector('.modal__subtitle')).toBeNull();
    host.subtitle.set('Marie Dupont · G01 · Octobre 2026');
    await fixture.whenStable();
    expect(root.querySelector('.modal__subtitle')?.textContent?.trim()).toBe('Marie Dupont · G01 · Octobre 2026');
    expect(root.querySelector('.modal__title')?.textContent?.trim()).toBe('Nouveau garage');
  });

  it('affiche le titre, le corps et le pied dans une boîte de dialogue', () => {
    const dialog = root.querySelector('[role="dialog"]')!;
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-labelledby')).toBe(root.querySelector('.modal__title')!.id);
    expect(root.querySelector('.modal__title')!.textContent).toBe('Nouveau garage');
    expect(root.querySelector('.modal__body #premier')).not.toBeNull();
    expect(root.querySelector('.modal__foot #pied')).not.toBeNull();
  });

  it('place le focus dans la fenêtre à l\'ouverture', () => {
    expect(document.activeElement!.id).toBe('premier');
  });

  it('se ferme avec la croix, Échap ou un clic sur le fond', async () => {
    root.querySelector<HTMLButtonElement>('.modal__close')!.click();
    await fixture.whenStable();
    expect(root.querySelector('app-modal')).toBeNull();

    host.open.set(true);
    await fixture.whenStable();
    root.querySelector('.modal')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await fixture.whenStable();
    expect(root.querySelector('app-modal')).toBeNull();

    host.open.set(true);
    await fixture.whenStable();
    const backdrop = root.querySelector<HTMLElement>('.modal-backdrop')!;
    backdrop.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    backdrop.click();
    await fixture.whenStable();
    expect(root.querySelector('app-modal')).toBeNull();
  });

  it('se ferme avec Échap même quand le focus est retombé sur la page', async () => {
    (document.activeElement as HTMLElement).blur();
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await fixture.whenStable();
    expect(root.querySelector('app-modal')).toBeNull();
  });

  it('reste ouverte quand le clic part de la fenêtre et finit sur le fond', async () => {
    root.querySelector('.modal')!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    root.querySelector<HTMLElement>('.modal-backdrop')!.click();
    await fixture.whenStable();
    expect(root.querySelector('app-modal')).not.toBeNull();
  });

  it('affiche l\'erreur de l\'API en rouge sans fermer la fenêtre', async () => {
    expect(root.querySelector('.message-error')).toBeNull();
    host.error.set('Ce numéro de garage existe déjà.');
    await fixture.whenStable();
    const error = root.querySelector('.message-error')!;
    expect(error.textContent).toBe('Ce numéro de garage existe déjà.');
    expect(error.getAttribute('role')).toBe('alert');
    expect(root.querySelector('app-modal')).not.toBeNull();
  });

  it('garde le focus dans la fenêtre avec Tab et Maj+Tab', async () => {
    const first = root.querySelector<HTMLElement>('.modal__close')!;
    const last = root.querySelector<HTMLElement>('#pied')!;
    last.focus();
    const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    last.dispatchEvent(tab);
    expect(tab.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(first);

    const shiftTab = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true });
    first.dispatchEvent(shiftTab);
    expect(shiftTab.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(last);
  });
});

@Component({
  imports: [Modal],
  template: `
    @if (first()) {
      <app-modal title="Premier" (closed)="first.set(false)">
        @if (second()) {
          <app-modal title="Second" (closed)="second.set(false)">Dessus</app-modal>
        }
      </app-modal>
    }
  `,
})
class StackHost {
  first = signal(true);
  second = signal(true);
}

@Component({
  imports: [Modal, DateInput, ReactiveFormsModule],
  template: `
    @if (open()) {
      <app-modal title="Garage" (closed)="open.set(false)">
        <app-date-input [formControl]="control" />
      </app-modal>
    }
  `,
})
class DateModalHost {
  open = signal(true);
  control = new FormControl<string | null>(null);
}

describe('Modal : Échap et superposition', () => {
  const escape = () => document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StackHost, DateModalHost],
      providers: [provideTestTranslations()],
    }).compileComponents();
  });

  it('ne ferme que la fenêtre du dessus', async () => {
    const fixture = TestBed.createComponent(StackHost);
    await fixture.whenStable();
    escape();
    await fixture.whenStable();
    expect(fixture.componentInstance.second()).toBe(false);
    expect(fixture.componentInstance.first()).toBe(true);
    escape();
    await fixture.whenStable();
    expect(fixture.componentInstance.first()).toBe(false);
  });

  it('ferme le calendrier seul avec Échap, puis la fenêtre au second Échap', async () => {
    const fixture = TestBed.createComponent(DateModalHost);
    const root: HTMLElement = fixture.nativeElement;
    await fixture.whenStable();
    root.querySelector<HTMLButtonElement>('.di__btn')!.click();
    await fixture.whenStable();
    expect(root.querySelector('.cal')).not.toBeNull();

    root.querySelector('.cal')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await fixture.whenStable();
    expect(root.querySelector('.cal')).toBeNull();
    expect(fixture.componentInstance.open()).toBe(true);
    expect(document.activeElement).toBe(root.querySelector('app-date-input input'));

    escape();
    await fixture.whenStable();
    expect(fixture.componentInstance.open()).toBe(false);
  });
});

@Component({
  imports: [Confirm],
  template: `
    <app-confirm
      [title]="title"
      [message]="message"
      [reasons]="reasons()"
      (confirmed)="confirmed = confirmed + 1"
      (cancelled)="cancelled = cancelled + 1"
    />
  `,
})
class ConfirmHost {
  title = 'Supprimer le garage G05 ?';
  message = 'Ce garage n’est rattaché à aucune location. Cette action est définitive.';
  reasons = signal<string[]>([]);
  confirmed = 0;
  cancelled = 0;
}

describe('Confirm', () => {
  let fixture: ComponentFixture<ConfirmHost>;
  let host: ConfirmHost;
  let root: HTMLElement;
  const buttons = () => Array.from(root.querySelectorAll<HTMLButtonElement>('.modal__foot button'));

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ConfirmHost], providers: [provideTestTranslations()] }).compileComponents();
    fixture = TestBed.createComponent(ConfirmHost);
    host = fixture.componentInstance;
    root = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('propose Non et Oui', () => {
    expect(root.querySelector('.modal__title')!.textContent).toBe('Supprimer le garage G05 ?');
    expect(root.querySelector('.modal__body')!.textContent).toContain('Cette action est définitive.');
    expect(buttons().map((b) => b.textContent!.trim())).toEqual(['Non', 'Oui']);
  });

  it('confirme avec Oui et annule avec Non, la croix ou Échap', () => {
    buttons()[1].click();
    expect(host.confirmed).toBe(1);
    buttons()[0].click();
    root.querySelector<HTMLButtonElement>('.modal__close')!.click();
    root.querySelector('.modal')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(host.cancelled).toBe(3);
    expect(host.confirmed).toBe(1);
  });

  it('liste les motifs d\'un refus avec un seul bouton Fermer', async () => {
    host.message = 'Ce garage ne peut pas être supprimé :';
    host.reasons.set(['Le garage est actuellement loué (Marie Dupont).', 'Le garage a un historique de 2 location(s).']);
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();
    expect(Array.from(root.querySelectorAll('.confirm__motifs li')).map((li) => li.textContent!.trim())).toEqual([
      'Le garage est actuellement loué (Marie Dupont).',
      'Le garage a un historique de 2 location(s).',
    ]);
    expect(buttons().map((b) => b.textContent!.trim())).toEqual(['Fermer']);
    buttons()[0].click();
    expect(host.cancelled).toBe(1);
    expect(host.confirmed).toBe(0);
  });
});
