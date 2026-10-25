import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  contentChild,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormGroupDirective, NgControl, Validators } from '@angular/forms';

function isEmpty(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    (typeof value === 'string' && value.trim() === '') ||
    (Array.isArray(value) && value.length === 0)
  );
}

/**
 * Libellé, astérisque rouge et message d'erreur autour d'un champ de formulaire réactif.
 *
 * À l'envoi du `<form [formGroup]>`, tous les champs obligatoires vides se surlignent
 * ensemble (RG-VAL-01) ; le rouge disparaît dès que l'on saisit dans le champ. L'erreur
 * renvoyée par l'API pour ce champ (`fieldErrors`) s'affiche de la même façon.
 */
@Component({
  selector: 'app-form-field',
  templateUrl: './form-field.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.is-invalid]': 'invalid()' },
})
export class FormField implements AfterContentInit {
  /** Libellé déjà traduit. */
  readonly label = input.required<string>();
  /** Message de `fieldErrors` pour ce champ. */
  readonly error = input<string | null>(null);
  /** Astérisque rouge sur un champ obligatoire (désactivable, comme sur l'écran de connexion). */
  readonly requiredMark = input(true);

  private readonly ngControl = contentChild(NgControl);
  private readonly form = inject(FormGroupDirective, { optional: true });
  private readonly destroyRef = inject(DestroyRef);

  private readonly emptyAtSubmit = signal(false);
  private readonly edited = signal(false);

  protected readonly message = computed(() => (this.edited() ? null : this.error()));
  protected readonly invalid = computed(() => !this.edited() && (this.emptyAtSubmit() || !!this.error()));

  protected get required(): boolean {
    return this.control()?.hasValidator(Validators.required) ?? false;
  }

  ngAfterContentInit(): void {
    this.control()?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.edited.set(true));
    this.form?.ngSubmit.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.edited.set(false);
      const control = this.control();
      this.emptyAtSubmit.set(!!control && this.required && isEmpty(control.value));
    });
  }

  private control(): AbstractControl | null {
    return this.ngControl()?.control ?? null;
  }
}
