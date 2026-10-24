import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { toApiError } from '../../../core/api/api-error';
import { ErrorMessageService } from '../../../core/api/error-message-service';
import { AuthService } from '../../../core/auth/auth-service';
import { FormField } from '../../../shared/form-field/form-field';
import { AuthCard } from '../auth-card/auth-card';

@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, AuthCard, FormField],
  templateUrl: './forgot-password.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPassword {
  private readonly auth = inject(AuthService);
  private readonly errors = inject(ErrorMessageService);

  protected readonly form = inject(NonNullableFormBuilder).group({
    email: ['', Validators.required],
  });
  protected readonly pending = signal(false);
  protected readonly sent = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly fieldErrors = signal<Record<string, string>>({});

  protected submit(): void {
    this.error.set(null);
    this.fieldErrors.set({});
    if (this.form.invalid || this.pending()) {
      return;
    }
    this.pending.set(true);
    this.auth
      .forgotPassword(this.form.getRawValue().email.trim())
      .pipe(finalize(() => this.pending.set(false)))
      .subscribe({
        next: () => this.sent.set(true),
        error: (err: unknown) => {
          const apiError = toApiError(err);
          this.fieldErrors.set(apiError.fieldErrors);
          this.error.set(Object.keys(apiError.fieldErrors).length > 0 ? null : this.errors.text(apiError));
        },
      });
  }
}
