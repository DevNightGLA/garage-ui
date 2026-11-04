import { ChangeDetectionStrategy, Component, Injectable, inject, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

export interface ToastMessage {
  id: number;
  text: string;
  kind: 'ok' | 'error';
}

/**
 * Message de retour en haut à droite (maquette : « Droits d'accès enregistrés avec succès », « n e-mail(s)
 * envoyé(s) ») : 4,5 s pour un succès, 7 s pour une erreur, fermable à la croix.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly current = signal<ToastMessage | null>(null);
  private timer: ReturnType<typeof setTimeout> | null = null;
  private nextId = 0;

  /** Texte déjà traduit. */
  show(text: string, kind: 'ok' | 'error' = 'ok'): void {
    const message = { id: ++this.nextId, text, kind };
    this.current.set(message);
    if (this.timer !== null) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => this.dismiss(message.id), kind === 'error' ? 7000 : 4500);
  }

  dismiss(id?: number): void {
    if (id === undefined || this.current()?.id === id) {
      this.current.set(null);
    }
  }
}

/** Zone d'affichage du message, placée une fois dans le cadre de l'application. */
@Component({
  selector: 'app-toast',
  imports: [TranslatePipe],
  template: `
    @if (toasts.current(); as toast) {
      <div class="toast" [class.is-error]="toast.kind === 'error'" role="status" aria-live="polite">
        <i
          class="fa-solid toast__icon"
          [class.fa-circle-check]="toast.kind === 'ok'"
          [class.fa-circle-exclamation]="toast.kind === 'error'"
          aria-hidden="true"
        ></i>
        <span class="toast__text">{{ toast.text }}</span>
        <button type="button" class="toast__close" [attr.aria-label]="'commun.fermer' | translate" (click)="toasts.dismiss()">
          <i class="fa-solid fa-xmark" aria-hidden="true"></i>
        </button>
      </div>
    }
  `,
  styles: `
    .toast {
      position: fixed;
      top: var(--space-4);
      right: var(--space-4);
      z-index: 6000;
      display: flex;
      align-items: flex-start;
      gap: var(--space-3);
      width: max-content;
      max-width: min(400px, calc(100% - 32px));
      box-sizing: border-box;
      padding: var(--space-3) 10px var(--space-3) var(--space-4);
      border: 1px solid #bfe3c8;
      border-radius: var(--radius-lg);
      background: #e8f6ec;
      box-shadow: 0 8px 24px rgba(52, 71, 103, 0.14);
      font-size: 14px;
      font-weight: 600;
      line-height: 1.4;
      color: #14532d;
      animation: toast-in 0.22s ease-out;
    }
    .toast.is-error {
      border-color: #f4c1bf;
      background: #fdeceb;
      color: #8f0a0a;
    }
    .toast__icon {
      flex: none;
      margin-top: 1px;
      font-size: 18px;
      color: #0f8a2a;
    }
    .is-error .toast__icon {
      color: #d40505;
    }
    .toast__text {
      flex: 1;
      min-width: 0;
    }
    .toast__close {
      flex: none;
      min-width: 32px;
      min-height: 32px;
      padding: 2px 6px;
      border: 0;
      background: none;
      font-size: 14px;
      color: inherit;
      opacity: 0.7;
      cursor: pointer;
    }
    @keyframes toast-in {
      from {
        opacity: 0;
        transform: translateY(-8px);
      }
      to {
        opacity: 1;
        transform: none;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Toast {
  protected readonly toasts = inject(ToastService);
}
