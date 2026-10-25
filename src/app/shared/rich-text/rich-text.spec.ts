import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import en from '../../../assets/i18n/en.json';
import { provideTestTranslations } from '../../../testing/translations';
import { RichText } from './rich-text';

@Component({
  imports: [RichText, ReactiveFormsModule],
  template: `<app-rich-text [formControl]="control" placeholder="Votre remarque" ariaLabel="Texte" />`,
})
class Host {
  control = new FormControl('<p>Porte <strong>difficile</strong>.</p>', { nonNullable: true, validators: Validators.required });
}

@Component({
  imports: [RichText, ReactiveFormsModule],
  template: `<app-rich-text [formControl]="control" />`,
})
class ReadOnlyHost {
  control = new FormControl({ value: '<p>Porte difficile.</p>', disabled: true }, { nonNullable: true });
}

const settle = () => new Promise((resolve) => setTimeout(resolve));

describe('RichText', () => {
  let fixture: ComponentFixture<Host>;
  let control: FormControl<string>;
  let root: HTMLElement;

  const editor = () => root.querySelector<HTMLElement>('.ql-editor')!;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Host, ReadOnlyHost],
      providers: [provideTestTranslations()],
    }).compileComponents();
    fixture = TestBed.createComponent(Host);
    control = fixture.componentInstance.control;
    root = fixture.nativeElement;
    await fixture.whenStable();
    await settle();
  });

  it('affiche le HTML du formulaire dans l\'éditeur avec la barre d\'outils', () => {
    expect(editor().textContent).toBe('Porte difficile.');
    expect(editor().querySelector('strong')).not.toBeNull();
    expect(root.querySelector('.ql-toolbar')).not.toBeNull();
  });

  it('propose gras, italique, souligné, listes numérotées et à puces, lien', () => {
    const toolbar = root.querySelector('.ql-toolbar')!;
    for (const selector of ['.ql-bold', '.ql-italic', '.ql-underline', '.ql-link', '.ql-list[value="ordered"]', '.ql-list[value="bullet"]']) {
      expect(toolbar.querySelector(selector), selector).not.toBeNull();
    }
  });

  it('nomme la zone de saisie et les boutons de la barre d\'outils en français', () => {
    expect(editor().getAttribute('role')).toBe('textbox');
    expect(editor().getAttribute('aria-multiline')).toBe('true');
    expect(editor().getAttribute('aria-label')).toBe('Texte');
    const names = (selector: string) => root.querySelector(selector)!.getAttribute('aria-label');
    expect(names('.ql-bold')).toBe('Gras');
    expect(names('.ql-italic')).toBe('Italique');
    expect(names('.ql-underline')).toBe('Souligné');
    expect(names('.ql-list[value="ordered"]')).toBe('Liste numérotée');
    expect(names('.ql-list[value="bullet"]')).toBe('Liste à puces');
    expect(names('.ql-link')).toBe('Lien');
    expect(root.querySelector('.ql-bold')!.getAttribute('title')).toBe('Gras');
  });

  it('renomme les boutons quand la langue change', () => {
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', en);
    translate.use('en');
    expect(root.querySelector('.ql-bold')!.getAttribute('aria-label')).toBe('Bold');
    expect(root.querySelector('.ql-list[value="bullet"]')!.getAttribute('aria-label')).toBe('Bulleted list');
    expect(root.querySelector('.ql-link')!.getAttribute('title')).toBe('Link');
  });

  it('remonte le HTML saisi, et une chaîne vide quand le texte est vide', async () => {
    editor().innerHTML = '<p>Remarque</p>';
    await settle();
    expect(control.value).toBe('<p>Remarque</p>');

    editor().innerHTML = '<p><br></p>';
    await settle();
    expect(control.value).toBe('');
    expect(control.hasError('required')).toBe(true);
  });

  it('s\'ouvre en consultation, sans barre d\'outils, quand le champ est désactivé', async () => {
    const readOnly = TestBed.createComponent(ReadOnlyHost);
    await readOnly.whenStable();
    await settle();
    const element: HTMLElement = readOnly.nativeElement;
    expect(element.querySelector('.ql-editor')!.textContent).toBe('Porte difficile.');
    expect(element.querySelector('.ql-container')!.classList.contains('ql-disabled')).toBe(true);
    expect(element.querySelector('.ql-editor')!.getAttribute('contenteditable')).toBe('false');
    expect(element.querySelector('.ql-toolbar')).toBeNull();
  });
});
