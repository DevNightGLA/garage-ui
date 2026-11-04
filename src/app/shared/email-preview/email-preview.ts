import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Modal } from '../modal/modal';

/** Message à prévisualiser, tel que renvoyé par l'API (`ApercuMessageDTO`). */
export interface EmailPreviewData {
  de: string;
  reponseA?: string | null;
  cci?: string | null;
  a: string;
  objet: string;
  /** HTML (signature comprise), nettoyé par le back. */
  texte: string;
}

/**
 * Aperçu d'un e-mail (maquette : avis de loyer, relances, message libre) : De, Répondre à, Cci, À, Objet, corps HTML
 * et, si besoin, une note sous le message (« Envoyé le … »). `preview` vaut `null` pendant le chargement.
 */
@Component({
  selector: 'app-email-preview',
  imports: [TranslatePipe, Modal],
  template: `
    <app-modal [title]="title()" [subtitle]="subtitle()" [width]="600" [error]="error()" (closed)="closed.emit()">
      @if (preview(); as mail) {
        <div class="ep">
          <dl class="ep__head">
            <dt>{{ 'messages.apercu.de' | translate }}</dt>
            <dd>{{ mail.de }}</dd>
            @if (mail.reponseA) {
              <dt>{{ 'messages.apercu.reponseA' | translate }}</dt>
              <dd>{{ mail.reponseA }}</dd>
            }
            @if (mail.cci) {
              <dt>{{ 'messages.apercu.cci' | translate }}</dt>
              <dd>{{ mail.cci }}</dd>
            }
            <dt>{{ 'messages.apercu.a' | translate }}</dt>
            <dd>{{ mail.a }}</dd>
            <dt>{{ 'messages.apercu.objet' | translate }}</dt>
            <dd><b>{{ mail.objet }}</b></dd>
          </dl>
          <div class="ep__body" [innerHTML]="mail.texte"></div>
        </div>
        @if (note()) {
          <p class="ep__note"><i class="fa-solid fa-circle-check" aria-hidden="true"></i> {{ note() }}</p>
        }
      } @else if (!error()) {
        <p class="ep__note">{{ 'commun.chargement' | translate }}</p>
      }
      <div modalFooter>
        <button type="button" class="btn btn--primary" (click)="closed.emit()">{{ 'commun.fermer' | translate }}</button>
      </div>
    </app-modal>
  `,
  styles: `
    .ep {
      overflow: hidden;
      border: 1px solid var(--surface-border);
      border-radius: var(--radius-lg);
    }
    .ep__head {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      gap: 6px var(--space-3);
      align-items: baseline;
      margin: 0;
      padding: var(--space-3) var(--space-4);
      border-bottom: 1px solid var(--surface-border);
      background: var(--surface-page);
      font-size: 14px;

      dt {
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        opacity: 0.7;
      }
      dd {
        margin: 0;
        overflow-wrap: anywhere;
        color: var(--text-heading);
      }
    }
    .ep__body {
      padding: var(--space-4);
      overflow-wrap: anywhere;
      font-size: 15px;
      line-height: 1.55;
      color: var(--text-heading);

      :first-child {
        margin-top: 0;
      }
    }
    .ep__note {
      margin: 0;
      font-size: 14px;

      i {
        color: var(--color-success);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmailPreview {
  readonly title = input.required<string>();
  readonly subtitle = input('');
  readonly preview = input<EmailPreviewData | null>(null);
  readonly note = input<string | null>(null);
  readonly error = input<string | null>(null);
  readonly closed = output<void>();
}
