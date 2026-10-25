import { ChangeDetectionStrategy, Component, OnInit, inject, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { toApiError } from '../../../core/api/api-error';
import { ErrorMessageService } from '../../../core/api/error-message-service';
import { TODAY } from '../../../core/today';
import { DateInput } from '../../../shared/date-input/date-input';
import { dateToIso } from '../../../shared/date-input/date-utils';
import { FormField } from '../../../shared/form-field/form-field';
import { Modal } from '../../../shared/modal/modal';
import { GarageApi } from '../garage-api';
import { GarageDTO, GarageStatutModifiable } from '../garage.models';

/**
 * Fenêtre « Nouveau garage », « Modifier le garage » ou, en lecture seule,
 * « Visualiser le garage » (RG-GAR-10 à 22). Les règles (numéro unique, réserve,
 * clés remises) sont celles de l'API : ses messages s'affichent dans la fenêtre.
 */
@Component({
  selector: 'app-garage-form',
  imports: [ReactiveFormsModule, TranslatePipe, Modal, FormField, DateInput],
  templateUrl: './garage-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GarageForm implements OnInit {
  /** Garage à modifier ou à visualiser ; `null` pour une création. */
  readonly garage = input<GarageDTO | null>(null);
  readonly readOnly = input(false);
  readonly saved = output<GarageDTO>();
  readonly closed = output<void>();

  private readonly api = inject(GarageApi);
  private readonly errors = inject(ErrorMessageService);
  private readonly today = inject(TODAY);

  protected readonly form = new FormGroup({
    numero: new FormControl('', { nonNullable: true, validators: Validators.required }),
    nbClesTotal: new FormControl<number | null>(2, Validators.required),
    nbClesReserve: new FormControl<number | null>(0, Validators.required),
    statutModifiable: new FormControl<GarageStatutModifiable>('LIBRE', { nonNullable: true }),
    loyerMontant: new FormControl<number | null>(null, Validators.required),
    loyerDateDebut: new FormControl<string | null>(null, Validators.required),
  });
  protected readonly pending = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly fieldErrors = signal<Record<string, string>>({});

  protected get isCreation(): boolean {
    return this.garage() === null;
  }

  /** Un garage loué garde son statut tant que la location dure (RG-GAR-03). */
  protected get isRented(): boolean {
    return this.garage()?.statut === 'LOUE';
  }

  protected titleKey(): string {
    if (this.isCreation) {
      return 'garages.form.titreNouveau';
    }
    return this.readOnly() ? 'garages.form.titreVisualiser' : 'garages.form.titreModifier';
  }

  ngOnInit(): void {
    const garage = this.garage();
    if (garage) {
      this.form.patchValue({
        numero: garage.numero,
        nbClesTotal: garage.nbClesTotal,
        nbClesReserve: garage.nbClesReserve,
        statutModifiable: garage.statutModifiable,
      });
      // Le numéro ne change pas, et le loyer se gère dans son historique (RG-GAR-20).
      this.form.controls.numero.disable();
      this.form.controls.loyerMontant.disable();
      this.form.controls.loyerDateDebut.disable();
    } else {
      const now = this.today();
      this.form.controls.loyerDateDebut.setValue(dateToIso(new Date(now.getFullYear(), now.getMonth(), 1)));
      this.api.nextNumber().subscribe({
        next: ({ numero }) => {
          if (this.form.controls.numero.pristine) {
            this.form.controls.numero.setValue(numero);
          }
        },
        error: () => undefined,
      });
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
    const value = this.form.getRawValue();
    const garage = this.garage();
    const request = garage
      ? this.api.update(garage.id, {
          nbClesTotal: value.nbClesTotal!,
          nbClesReserve: value.nbClesReserve!,
          ...(this.isRented ? {} : { statutModifiable: value.statutModifiable }),
        })
      : this.api.create({
          numero: value.numero,
          nbClesTotal: value.nbClesTotal!,
          nbClesReserve: value.nbClesReserve!,
          statutModifiable: value.statutModifiable,
          loyerMontant: value.loyerMontant!,
          loyerDateDebut: value.loyerDateDebut!,
        });

    this.pending.set(true);
    request.pipe(finalize(() => this.pending.set(false))).subscribe({
      next: (saved) => this.saved.emit(saved),
      error: (err: unknown) => {
        const apiError = toApiError(err);
        this.fieldErrors.set(apiError.fieldErrors);
        this.error.set(Object.keys(apiError.fieldErrors).length > 0 ? null : this.errors.text(apiError));
      },
    });
  }
}
