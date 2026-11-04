import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTestTranslations } from '../../../testing/translations';
import { DiffRow, DiffTable } from './diff-table';
import { plainText, wordDiff } from './word-diff';

describe('wordDiff', () => {
  it('marque les mots retirés et ajoutés, garde les mots communs', () => {
    const diff = wordDiff('Porte du garage difficile à ouvrir', 'Porte du garage facile à ouvrir');
    expect(diff.before.filter((s) => s.kind === 'removed').map((s) => s.text.trim())).toEqual(['difficile']);
    expect(diff.after.filter((s) => s.kind === 'added').map((s) => s.text.trim())).toEqual(['facile']);
    expect(diff.before.map((s) => s.text).join('')).toBe('Porte du garage difficile à ouvrir');
    expect(diff.after.map((s) => s.text).join('')).toBe('Porte du garage facile à ouvrir');
  });

  it('plainText retire les balises et sépare les paragraphes', () => {
    expect(plainText('<p>Bonjour <b>M.</b></p><p>Merci</p>')).toBe('Bonjour M. Merci');
    expect(plainText('G05')).toBe('G05');
  });
});

@Component({
  imports: [DiffTable],
  template: `<app-diff-table [rows]="rows()" [showUnchanged]="all()" />`,
})
class Host {
  rows = signal<DiffRow[]>([
    { label: 'Montant', key: 'montant', before: '85,00 €', after: '90,00 €', changed: true, masked: false },
    { label: 'Début', key: 'date_debut', before: '01/01/2026', after: '01/01/2026', changed: false, masked: false },
    { label: 'Mot de passe', key: 'mot_de_passe', before: '1', after: '2', changed: true, masked: true },
    { label: 'Fin', key: 'date_fin', before: null, after: '31/12/2026', changed: true, masked: false },
  ]);
  all = signal(false);
}

describe('DiffTable', () => {
  let fixture: ComponentFixture<Host>;
  let root: HTMLElement;
  const text = (el: Element) => el.textContent!.replace(/\s+/g, ' ').trim();

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host], providers: [provideTestTranslations()] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    root = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('montre les champs modifiés, valeur masquée et « (vide) » ; les inchangés sur demande', async () => {
    const rows = () => Array.from(root.querySelectorAll('tbody tr'));
    expect(rows().length).toBe(3);
    expect(text(rows()[0])).toContain('85,00 €');
    expect(rows()[0].querySelector('.dft__removed')!.textContent).toBe('85,00 €');
    expect(rows()[0].querySelector('.dft__added')!.textContent).toBe('90,00 €');
    expect(text(rows()[1])).toContain('modifié, valeur masquée');
    expect(text(rows()[1])).not.toContain('1');
    expect(text(rows()[2])).toContain('(vide)');

    fixture.componentInstance.all.set(true);
    await fixture.whenStable();
    expect(rows().length).toBe(4);
    expect(text(rows()[1])).toContain('01/01/2026 inchangé');
  });
});
