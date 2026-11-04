import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Modal } from '../../../shared/modal/modal';

/**
 * Mot de passe temporaire d'un compte créé ou réinitialisé (RG-USR-07) : affiché une seule fois, avec un bouton de
 * copie. Il n'est gardé nulle part après la fermeture.
 */
@Component({
  selector: 'app-temp-password-dialog',
  imports: [TranslatePipe, Modal],
  template: `
    <app-modal [title]="(created() ? 'utilisateurs.mdp.cree' : 'utilisateurs.mdp.reinitialise') | translate" [width]="460" (closed)="closed.emit()">
      <div class="tp">
        <p class="tp__intro">{{ 'utilisateurs.mdp.de' | translate: { nom: name() } }}</p>
        <div class="tp__box">
          <span class="tp__value">{{ password() }}</span>
          <button type="button" class="btn btn--secondary tp__copy" (click)="copy()">
            <i class="fa-solid" [class.fa-check]="copied()" [class.fa-copy]="!copied()" aria-hidden="true"></i>
            {{ (copied() ? 'utilisateurs.mdp.copie' : 'utilisateurs.mdp.copier') | translate }}
          </button>
        </div>
        <p class="page-note" role="note">
          <i class="fa-solid fa-circle-info" aria-hidden="true"></i><span>{{ 'utilisateurs.mdp.note' | translate }}</span>
        </p>
      </div>
      <div modalFooter>
        <button type="button" class="btn btn--primary" (click)="closed.emit()">{{ 'commun.fermer' | translate }}</button>
      </div>
    </app-modal>
  `,
  styles: `
    .tp {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }
    .tp__intro {
      margin: 0;
    }
    .tp__box {
      display: flex;
      gap: var(--space-2);
      align-items: center;
      padding: 6px 6px 6px var(--space-4);
      border: 1px solid #e9ecef;
      border-radius: var(--radius-md);
      background: #f8f9fa;
    }
    .tp__value {
      flex: 1;
      min-width: 0;
      overflow-wrap: anywhere;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 19px;
      font-weight: 700;
      letter-spacing: 1px;
      color: var(--text-heading);
      user-select: all;
    }
    .tp__copy {
      flex: none;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TempPasswordDialog {
  readonly name = input.required<string>();
  readonly password = input.required<string>();
  /** Compte créé (sinon : mot de passe réinitialisé). */
  readonly created = input(false);
  readonly closed = output<void>();

  protected readonly copied = signal(false);
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }

  protected copy(): void {
    void navigator.clipboard?.writeText(this.password()).catch(() => undefined);
    this.copied.set(true);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.copied.set(false), 2000);
  }
}
