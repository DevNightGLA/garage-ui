import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LanguageSwitch } from '../../../core/layout/language-switch';

/**
 * Carte centrée des écrans publics (connexion, déconnexion, mot de passe oublié,
 * réinitialisation), avec le choix FR/EN : l'utilisateur n'est pas encore dans
 * l'application et ne voit donc pas l'en-tête.
 */
@Component({
  selector: 'app-auth-card',
  imports: [LanguageSwitch],
  template: `
    <div class="auth">
      <div class="auth__lang"><app-language-switch /></div>
      <div class="auth__card card">
        <div class="auth__head">
          <h1 class="auth__title">{{ title() }}</h1>
          @if (subtitle(); as text) {
            <p class="auth__subtitle">{{ text }}</p>
          }
        </div>
        <ng-content />
      </div>
    </div>
  `,
  styles: `
    .auth {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: var(--space-6);
      background: var(--surface-page);
    }

    .auth__lang {
      position: absolute;
      top: var(--space-6);
      right: var(--space-6);
    }

    .auth__card {
      display: flex;
      flex-direction: column;
      gap: var(--space-6);
      width: 100%;
      max-width: 380px;
      padding: var(--space-10);
      box-shadow: 0 20px 27px rgba(0, 0, 0, 0.08);
    }

    .auth__head {
      display: flex;
      flex-direction: column;
      gap: 6px;
      text-align: center;
    }

    .auth__title {
      font-size: var(--fs-heading-sm);
      font-weight: 700;
    }

    .auth__subtitle {
      margin: 0;
      font-size: 14px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthCard {
  /** Titre et sous-titre déjà traduits. */
  readonly title = input.required<string>();
  readonly subtitle = input('');
}
