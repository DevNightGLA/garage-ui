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
import { RemarqueApi } from '../remarque-api';
import { RemarqueDTO } from '../remarque.models';

/**
 * Fenêtre « Marquer résolu » (RG-REM-05) : la date de résolution est obligatoire et proposée à la
 * date du jour. L'API refuse une date future ou antérieure à la création : son message s'affiche ici.
 */
@Component({
  selector: 'app-resolution-form',
  imports: [ReactiveFormsModule, TranslatePipe, Modal, FormField, DateInput],
  templateUrl: './resolution-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResolutionForm implements OnInit {
  readonly remarque = input.required<RemarqueDTO>();
  readonly saved = output<RemarqueDTO>();
  readonly closed = output<void>();

  private readonly api = inject(RemarqueApi);
  private readonly errors = inject(ErrorMessageService);
  private readonly today = inject(TODAY);

  protected readonly form = new FormGroup({
    dateResolution: new FormControl<string | null>(null, Validators.required),
  });
  protected readonly pending = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly fieldErrors = signal<Record<string, string>>({});

  ngOnInit(): void {
    this.form.controls.dateResolution.setValue(dateToIso(this.today()));
  }

  protected submit(): void {
    this.error.set(null);
    this.fieldErrors.set({});
    if (this.form.invalid || this.pending()) {
      return;
    }
    this.pending.set(true);
    this.api
      .resolve(this.remarque().id, this.form.getRawValue().dateResolution!)
      .pipe(finalize(() => this.pending.set(false)))
      .subscribe({
        next: (saved) => this.saved.emit(saved),
        error: (err: unknown) => {
          const apiError = toApiError(err);
          this.fieldErrors.set(apiError.fieldErrors);
          this.error.set(Object.keys(apiError.fieldErrors).length > 0 ? null : this.errors.text(apiError));
        },
      });
  }
}
