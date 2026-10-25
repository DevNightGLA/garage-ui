import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DateInput } from '../date-input/date-input';
import { provideTestTranslations } from '../../../testing/translations';
import { FormField } from './form-field';

@Component({
  imports: [ReactiveFormsModule, FormField, DateInput],
  template: `
    <form [formGroup]="form" (ngSubmit)="submitted = submitted + 1">
      <app-form-field label="Nom" [error]="errors()['nom']">
        <input class="input" formControlName="nom" />
      </app-form-field>
      <app-form-field label="Téléphone 2">
        <input class="input" formControlName="tel2" />
      </app-form-field>
      <app-form-field label="Début">
        <app-date-input formControlName="debut" />
      </app-form-field>
      <button type="submit">Enregistrer</button>
    </form>
  `,
})
class Host {
  form = new FormGroup({
    nom: new FormControl('', { nonNullable: true, validators: Validators.required }),
    tel2: new FormControl('', { nonNullable: true }),
    debut: new FormControl<string | null>(null, Validators.required),
  });
  errors = signal<Record<string, string>>({});
  submitted = 0;
}

describe('FormField', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  let root: HTMLElement;

  const fields = () => Array.from(root.querySelectorAll<HTMLElement>('app-form-field'));
  const invalid = () => fields().map((f) => f.classList.contains('is-invalid'));
  const submit = async () => {
    root.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  };
  const type = async (input: HTMLInputElement, text: string) => {
    input.value = text;
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host], providers: [provideTestTranslations()] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    root = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('affiche le libellé et l\'astérisque rouge des seuls champs obligatoires', () => {
    const labels = fields().map((f) => f.querySelector('.ff__label')!.textContent!.trim());
    expect(labels).toEqual(['Nom *', 'Téléphone 2', 'Début *']);
    expect(fields()[0].querySelector('.ff__star')).not.toBeNull();
    expect(fields()[1].querySelector('.ff__star')).toBeNull();
  });

  it('ne surligne rien avant l\'envoi', () => {
    expect(invalid()).toEqual([false, false, false]);
  });

  it('surligne ensemble tous les champs obligatoires vides à l\'envoi', async () => {
    await submit();
    expect(invalid()).toEqual([true, false, true]);
  });

  it('retire le rouge d\'un champ dès la saisie, sans toucher aux autres', async () => {
    await submit();
    await type(root.querySelector<HTMLInputElement>('input[formControlName="nom"]')!, 'D');
    expect(invalid()).toEqual([false, false, true]);
  });

  it('retire le rouge d\'un champ date dès la saisie, même incomplète', async () => {
    await submit();
    await type(root.querySelector<HTMLInputElement>('app-date-input input')!, '09');
    expect(invalid()).toEqual([true, false, false]);
  });

  it('surligne de nouveau à chaque envoi', async () => {
    await submit();
    await type(root.querySelector<HTMLInputElement>('input[formControlName="nom"]')!, 'D');
    await type(root.querySelector<HTMLInputElement>('input[formControlName="nom"]')!, '');
    await submit();
    expect(invalid()).toEqual([true, false, true]);
    expect(host.submitted).toBe(2);
  });

  it('ne surligne pas un champ obligatoire déjà rempli', async () => {
    host.form.patchValue({ nom: 'Dupont' });
    await submit();
    expect(invalid()).toEqual([false, false, true]);
  });

  it('affiche l\'erreur du back sous le champ jusqu\'à la prochaine saisie', async () => {
    host.form.patchValue({ nom: 'Dupont' });
    host.errors.set({ nom: 'Le nom est trop long.' });
    await submit();
    expect(fields()[0].querySelector('.ff__error')!.textContent).toBe('Le nom est trop long.');
    expect(invalid()[0]).toBe(true);

    await type(root.querySelector<HTMLInputElement>('input[formControlName="nom"]')!, 'Dupond');
    expect(fields()[0].querySelector('.ff__error')).toBeNull();
    expect(invalid()[0]).toBe(false);
  });
});
