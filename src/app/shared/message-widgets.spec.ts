import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTestTranslations } from '../../testing/translations';
import { EmailPreview, EmailPreviewData } from './email-preview/email-preview';
import { Segmented, SegmentedOption } from './segmented/segmented';
import { Toast, ToastService } from './toast/toast';
import { VariableChips } from './variable-chips/variable-chips';

type Mode = 'UN' | 'TOUS';

@Component({
  imports: [Segmented, VariableChips, Toast, EmailPreview],
  template: `
    <app-segmented [options]="options" [(value)]="mode" ariaLabel="Destinataires" />
    <app-variable-chips [variables]="variables()" (insert)="inserted.set($event)" />
    <app-toast />
    @if (preview(); as mail) {
      <app-email-preview title="Aperçu" subtitle="Dubois Pierre" [preview]="mail" note="Envoyé le 05/10/2026" (closed)="preview.set(null)" />
    }
  `,
})
class Host {
  options: SegmentedOption<Mode>[] = [
    { value: 'UN', label: 'Un locataire' },
    { value: 'TOUS', label: 'Tous' },
  ];
  mode = signal<Mode>('UN');
  variables = signal(['civilite', 'nom', 'garage', 'expediteur']);
  inserted = signal<string | null>(null);
  preview = signal<EmailPreviewData | null>(null);
}

describe('composants des messages', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  let root: HTMLElement;
  const text = (el: Element) => el.textContent!.replace(/\s+/g, ' ').trim();

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host], providers: [provideTestTranslations()] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    root = fixture.nativeElement;
    await fixture.whenStable();
  });

  describe('Segmented', () => {
    const buttons = () => Array.from(root.querySelectorAll<HTMLButtonElement>('.sg__btn'));

    it('est un groupe radio : choix actif coché, clic et flèches pour changer', async () => {
      expect(root.querySelector('.sg')!.getAttribute('role')).toBe('radiogroup');
      expect(buttons().map((b) => b.getAttribute('aria-checked'))).toEqual(['true', 'false']);
      buttons()[1].click();
      await fixture.whenStable();
      expect(host.mode()).toBe('TOUS');
      buttons()[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
      await fixture.whenStable();
      expect(host.mode()).toBe('UN');
      expect(document.activeElement).toBe(buttons()[0]);
    });
  });

  describe('VariableChips', () => {
    it('groupe les variables, ajoute celles de l\'organisation avec {expediteur}, émet la variable au clic', async () => {
      const groups = Array.from(root.querySelectorAll('.vc__group')).map((g) => [
        text(g.querySelector('.vc__label')!),
        Array.from(g.querySelectorAll('.vc__chip')).map(text),
      ]);
      expect(groups).toEqual([
        ['Locataire', ['{civilite}', '{nom}']],
        ['Garage', ['{garage}']],
        ['Expéditeur', ['{expediteur}']],
        ['Organisation', ['{entreprise}', '{coordonnees}', '{iban}']],
      ]);
      const chip = root.querySelector<HTMLButtonElement>('.vc__chip')!;
      const down = new MouseEvent('mousedown', { cancelable: true });
      chip.dispatchEvent(down);
      expect(down.defaultPrevented).toBe(true); // l'éditeur garde le focus
      chip.click();
      expect(host.inserted()).toBe('{civilite}');
    });
  });

  describe('Toast', () => {
    it('affiche le message, puis le ferme à la croix', async () => {
      const toasts = TestBed.inject(ToastService);
      toasts.show('2 avis envoyés avec succès');
      await fixture.whenStable();
      expect(text(root.querySelector('.toast')!)).toBe('2 avis envoyés avec succès');
      root.querySelector<HTMLButtonElement>('.toast__close')!.click();
      await fixture.whenStable();
      expect(root.querySelector('.toast')).toBeNull();
    });

    it('un message d\'erreur a son propre style', async () => {
      TestBed.inject(ToastService).show('Échec', 'error');
      await fixture.whenStable();
      expect(root.querySelector('.toast')!.classList.contains('is-error')).toBe(true);
    });
  });

  describe('EmailPreview', () => {
    it('affiche l\'en-tête (sans Cci vide), le corps HTML et la note', async () => {
      host.preview.set({ de: 'Gestion <g@x.be>', reponseA: 'g@x.be', cci: null, a: 'p@x.be', objet: 'Solde', texte: '<p>Bonjour <b>M.</b></p>' });
      await fixture.whenStable();
      const head = Array.from(root.querySelectorAll('.ep__head dt')).map(text);
      expect(head).toEqual(['De', 'Répondre à', 'À', 'Objet']);
      expect(root.querySelector('.ep__body b')!.textContent).toBe('M.');
      expect(text(root.querySelector('.ep__note')!)).toBe('Envoyé le 05/10/2026');
    });
  });
});
