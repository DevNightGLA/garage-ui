import { ChangeDetectionStrategy, Component, OnInit, inject, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { toApiError } from '../../../core/api/api-error';
import { ErrorMessageService } from '../../../core/api/error-message-service';
import { DateInput } from '../../../shared/date-input/date-input';
import { FormField } from '../../../shared/form-field/form-field';
import { Modal } from '../../../shared/modal/modal';
import { GarageApi } from '../garage-api';
import { LoyerDTO } from '../garage.models';

/** Fenêtre « Nouveau loyer », « Modifier le loyer » ou « Visualiser le loyer » (RG-LOY-04 à 06). */
@Component({
  selector: 'app-loyer-form',
  imports: [ReactiveFormsModule, TranslatePipe, Modal, FormField, DateInput],
  templateUrl: './loyer-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoyerForm implements OnInit {
  readonly garageId = input.required<number>();
  readonly garageNumero = input.required<string>();
  /** Loyer à modifier ou à visualiser ; `null` pour un nouveau loyer. */
  readonly loyer = input<LoyerDTO | null>(null);
  readonly readOnly = input(false);
  readonly saved = output<void>();
  readonly closed = output<void>();

  private readonly api = inject(GarageApi);
  private readonly errors = inject(ErrorMessageService);

  protected readonly form = new FormGroup({
    montant: new FormControl<number | null>(null, Validators.required),
    dateDebut: new FormControl<string | null>(null, Validators.required),
  });
  protected readonly pending = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly fieldErrors = signal<Record<string, string>>({});

  protected titleKey(): string {
    if (this.loyer() === null) {
      return 'loyers.form.titreNouveau';
    }
    return this.readOnly() ? 'loyers.form.titreVisualiser' : 'loyers.form.titreModifier';
  }

  ngOnInit(): void {
    const loyer = this.loyer();
    if (loyer) {
      this.form.patchValue({ montant: loyer.montant, dateDebut: loyer.dateDebut });
    }
    if (this.readOnly()) {
      this.form.disable();
    }
  }

  protected submit(): void {
    this.error.set(null);
    this.fieldErrors.set({});
    if (this.form.invalid || this.pending()) {
      return;
    }
    const { montant, dateDebut } = this.form.getRawValue();
    const body = { montant: montant!, dateDebut: dateDebut! };
    const loyer = this.loyer();
    const request = loyer ? this.api.updateLoyer(loyer.id, body) : this.api.createLoyer(this.garageId(), body);

    this.pending.set(true);
    request.pipe(finalize(() => this.pending.set(false))).subscribe({
      next: () => this.saved.emit(),
      error: (err: unknown) => {
        const apiError = toApiError(err);
        this.fieldErrors.set(apiError.fieldErrors);
        this.error.set(Object.keys(apiError.fieldErrors).length > 0 ? null : this.errors.text(apiError));
      },
    });
  }
}
