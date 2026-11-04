import { ChangeDetectionStrategy, Component, OnInit, inject, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { Observable, finalize } from 'rxjs';
import { toApiError } from '../../../core/api/api-error';
import { ErrorMessageService } from '../../../core/api/error-message-service';
import { TODAY } from '../../../core/today';
import { DateInput } from '../../../shared/date-input/date-input';
import { dateToIso } from '../../../shared/date-input/date-utils';
import { FormField } from '../../../shared/form-field/form-field';
import { Modal } from '../../../shared/modal/modal';
import { MOYENS_MANUELS, MoyenManuel } from '../messages.models';

/** Contact saisi : moyen et date (`yyyy-MM-dd`). */
export interface ContactManuel {
  moyen: MoyenManuel;
  date: string;
}

/**
 * « Marquer comme informé » (avis de loyer sans e-mail) ou « Marquer comme relancé » (relance d'impayé) : moyen
 * (téléphone, courrier postal, oralement) et date du contact, proposée au jour (maquette). L'enregistrement
 * (`save`) est fait par l'appelant ; son erreur s'affiche dans la fenêtre. Le back ajoute une remarque sur la fiche.
 */
@Component({
  selector: 'app-contact-dialog',
  imports: [ReactiveFormsModule, TranslatePipe, Modal, FormField, DateInput],
  templateUrl: './contact-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactDialog implements OnInit {
  /** `informe` : avis de loyer ; `relance` : impayé. */
  readonly kind = input.required<'informe' | 'relance'>();
  /** Nom du locataire, sous le titre. */
  readonly name = input.required<string>();
  /** Téléphone et adresse affichés pour le contact. */
  readonly contact = input<string | null>(null);
  readonly save = input.required<(contact: ContactManuel) => Observable<unknown>>();
  readonly saved = output<void>();
  readonly closed = output<void>();

  private readonly errors = inject(ErrorMessageService);
  private readonly today = inject(TODAY);

  protected readonly moyens = MOYENS_MANUELS;
  protected readonly form = new FormGroup({
    moyen: new FormControl<MoyenManuel>('TELEPHONE', { nonNullable: true, validators: Validators.required }),
    date: new FormControl<string | null>(null, Validators.required),
  });
  protected readonly pending = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly fieldErrors = signal<Record<string, string>>({});

  ngOnInit(): void {
    this.form.controls.date.setValue(dateToIso(this.today()));
  }

  protected submit(): void {
    this.error.set(null);
    this.fieldErrors.set({});
    if (this.form.invalid || this.pending()) {
      return;
    }
    const { moyen, date } = this.form.getRawValue();
    this.pending.set(true);
    this.save()({ moyen, date: date! })
      .pipe(finalize(() => this.pending.set(false)))
      .subscribe({
        next: () => this.saved.emit(),
        error: (err: unknown) => {
          const apiError = toApiError(err);
          this.fieldErrors.set(this.errors.fields(apiError));
          this.error.set(Object.keys(apiError.fieldErrors).length > 0 ? null : this.errors.text(apiError));
        },
      });
  }
}
