import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { toApiError } from '../../../core/api/api-error';
import { ErrorMessageService } from '../../../core/api/error-message-service';
import { AuthService } from '../../../core/auth/auth-service';
import { FormField } from '../../../shared/form-field/form-field';
import { PasswordInput } from '../../../shared/password-input/password-input';
import { AuthCard } from '../auth-card/auth-card';

/** Page ouverte par le lien reçu par e-mail : `/reinitialisation?jeton=...`. */
@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, AuthCard, FormField, PasswordInput],
  templateUrl: './reset-password.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPassword {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly errors = inject(ErrorMessageService);
  private readonly translate = inject(TranslateService);

  protected readonly token = inject(ActivatedRoute).snapshot.queryParamMap.get('jeton');
  protected readonly form = inject(NonNullableFormBuilder).group({
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
    if (this.form.invalid || this.pending() || !this.token) {
      return;
    }
    const { nouveau, confirmer } = this.form.getRawValue();
    if (nouveau !== confirmer) {
      this.mismatch.set(this.translate.instant('auth.mdp.differents'));
      return;
    }
    this.pending.set(true);
    this.auth
      .resetPassword({ jeton: this.token, nouveauMotDePasse: nouveau })
      .pipe(finalize(() => this.pending.set(false)))
      .subscribe({
        next: () => this.router.navigate(['/connexion'], { queryParams: { info: 'mdp' } }),
        error: (err: unknown) => {
          const apiError = toApiError(err);
          this.fieldErrors.set(apiError.fieldErrors);
          this.error.set(Object.keys(apiError.fieldErrors).length > 0 ? null : this.errors.text(apiError));
        },
      });
  }
}
