import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { toApiError } from '../../../core/api/api-error';
import { ErrorMessageService } from '../../../core/api/error-message-service';
import { AuthService } from '../../../core/auth/auth-service';
import { FormField } from '../../../shared/form-field/form-field';
import { Modal } from '../../../shared/modal/modal';
import { PasswordInput } from '../../../shared/password-input/password-input';

/** Fenêtre « Modifier mon mot de passe », ouverte depuis le pied du menu. */
@Component({
  selector: 'app-change-password',
  imports: [ReactiveFormsModule, TranslatePipe, Modal, FormField, PasswordInput],
  templateUrl: './change-password.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangePassword {
  readonly closed = output<void>();

  private readonly auth = inject(AuthService);
  private readonly errors = inject(ErrorMessageService);
  private readonly translate = inject(TranslateService);

  protected readonly form = inject(NonNullableFormBuilder).group({
    actuel: ['', Validators.required],
    nouveau: ['', Validators.required],
    confirmer: ['', Validators.required],
  });
  protected readonly pending = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly fieldErrors = signal<Record<string, string>>({});
  protected readonly mismatch = signal<string | null>(null);

  protected submit(): void {
    this.error.set(null);
    this.fieldErrors.set({});
    this.mismatch.set(null);
    if (this.form.invalid || this.pending()) {
      return;
    }
    const { actuel, nouveau, confirmer } = this.form.getRawValue();
    if (nouveau !== confirmer) {
      this.mismatch.set(this.translate.instant('auth.mdp.differents'));
      return;
    }
    this.pending.set(true);
    this.auth
      .changePassword({ motDePasseActuel: actuel, nouveauMotDePasse: nouveau })
      .pipe(finalize(() => this.pending.set(false)))
      .subscribe({
        next: () => this.closed.emit(),
        error: (err: unknown) => {
          const apiError = toApiError(err);
          this.fieldErrors.set(apiError.fieldErrors);
          this.error.set(Object.keys(apiError.fieldErrors).length > 0 ? null : this.errors.text(apiError));
        },
      });
  }
}
