import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { toApiError } from '../../../core/api/api-error';
import { ErrorMessageService } from '../../../core/api/error-message-service';
import { safeReturnUrl } from '../../../core/auth/auth-guard';
import { AuthService } from '../../../core/auth/auth-service';
import { FormField } from '../../../shared/form-field/form-field';
import { PasswordInput } from '../../../shared/password-input/password-input';
import { AuthCard } from '../auth-card/auth-card';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, AuthCard, FormField, PasswordInput],
  templateUrl: './login.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly errors = inject(ErrorMessageService);
  private readonly query = inject(ActivatedRoute).snapshot.queryParamMap;

  protected readonly form = inject(NonNullableFormBuilder).group({
    login: ['', Validators.required],
    motDePasse: ['', Validators.required],
  });
  protected readonly pending = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly fieldErrors = signal<Record<string, string>>({});

  /** Clé du sous-titre : déconnexion volontaire, session expirée ou accueil. */
  protected readonly subtitleKey =
    this.query.get('raison') === 'deconnecte'
      ? 'auth.connexion.deconnecte'
      : this.query.get('raison') === 'expiree'
        ? 'auth.connexion.expiree'
        : 'auth.connexion.sousTitre';
  protected readonly passwordChanged = this.query.get('info') === 'mdp';

  protected submit(): void {
    this.error.set(null);
    this.fieldErrors.set({});
    if (this.form.invalid || this.pending()) {
      return;
    }
    this.pending.set(true);
    this.auth
      .login(this.form.getRawValue())
      .pipe(finalize(() => this.pending.set(false)))
      .subscribe({
        next: () => this.router.navigateByUrl(safeReturnUrl(this.query.get('retour'))),
        error: (err: unknown) => {
          const apiError = toApiError(err);
          this.fieldErrors.set(apiError.fieldErrors);
          this.error.set(Object.keys(apiError.fieldErrors).length > 0 ? null : this.errors.text(apiError));
        },
      });
  }
}
