import { ChangeDetectionStrategy, Component, OnInit, inject, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { toApiError } from '../../../core/api/api-error';
import { ErrorMessageService } from '../../../core/api/error-message-service';
import { FormField } from '../../../shared/form-field/form-field';
import { Modal } from '../../../shared/modal/modal';
import { RichText } from '../../../shared/rich-text/rich-text';
import { RemarqueApi } from '../remarque-api';
import { RemarqueCible, RemarqueDTO, RemarqueType } from '../remarque.models';

/**
 * Fenêtre « Nouvelle remarque », « Modifier la remarque » ou, en lecture seule, « Visualiser la
 * remarque » (RG-REM-02 à 04). Le texte est de l'HTML limité que l'API nettoie ; la date de création
 * est ajoutée par l'API et n'est pas modifiable (RG-REM-03).
 */
@Component({
  selector: 'app-remarque-form',
  imports: [ReactiveFormsModule, TranslatePipe, Modal, FormField, RichText],
  templateUrl: './remarque-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RemarqueForm implements OnInit {
  readonly cible = input.required<RemarqueCible>();
  /** Remarque à modifier ou à visualiser ; `null` pour une création. */
  readonly remarque = input<RemarqueDTO | null>(null);
  readonly readOnly = input(false);
  readonly saved = output<RemarqueDTO>();
  readonly closed = output<void>();

  private readonly api = inject(RemarqueApi);
  private readonly errors = inject(ErrorMessageService);

  protected readonly form = new FormGroup({
    type: new FormControl<RemarqueType>('INFORMATION', { nonNullable: true, validators: Validators.required }),
    texte: new FormControl('', { nonNullable: true, validators: Validators.required }),
  });
  protected readonly pending = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly fieldErrors = signal<Record<string, string>>({});

  protected titleKey(): string {
    if (this.remarque() === null) {
      return 'remarques.form.titreNouvelle';
    }
    return this.readOnly() ? 'remarques.form.titreVisualiser' : 'remarques.form.titreModifier';
  }

  ngOnInit(): void {
    const remarque = this.remarque();
    if (remarque) {
      this.form.patchValue({ type: remarque.type, texte: remarque.texte });
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
    const body = this.form.getRawValue();
    const remarque = this.remarque();
    const request = remarque ? this.api.update(remarque.id, body) : this.api.create(this.cible(), body);

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
