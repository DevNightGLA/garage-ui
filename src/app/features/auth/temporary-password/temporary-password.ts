import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { toApiError } from '../../../core/api/api-error';
import { ErrorMessageService } from '../../../core/api/error-message-service';
import { AuthService } from '../../../core/auth/auth-service';
import { SettingsService } from '../../../core/settings-service';
import { FormField } from '../../../shared/form-field/form-field';
import { PasswordInput } from '../../../shared/password-input/password-input';
import { AuthCard } from '../auth-card/auth-card';

/**
 * Écran obligatoire après la connexion d'un compte au mot de passe temporaire (RG-AUT-05) : le compte choisit
 * un nouveau mot de passe avant tout autre écran. Le mot de passe temporaire est le mot de passe actuel.
 */
@Component({
  selector: 'app-temporary-password',
  imports: [ReactiveFormsModule, TranslatePipe, AuthCard, FormField, PasswordInput],
  templateUrl: './temporary-password.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemporaryPassword {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly errors = inject(ErrorMessageService);
  private readonly translate = inject(TranslateService);
  protected readonly settings = inject(SettingsService);

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
        next: () => this.router.navigateByUrl('/'),
        error: (err: unknown) => {
          const apiError = toApiError(err);
          this.fieldErrors.set(this.errors.fields(apiError));
          this.error.set(Object.keys(apiError.fieldErrors).length > 0 ? null : this.errors.text(apiError));
        },
      });
  }

  protected logout(): void {
    this.auth.logout();
    this.router.navigate(['/connexion']);
  }
}
