import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Modal } from '../modal/modal';

/**
 * Confirmation « Non / Oui », ou refus avec la liste des motifs et un seul bouton
 * « Fermer » dès que `reasons` n'est pas vide (suppression refusée par l'API).
 */
@Component({
  selector: 'app-confirm',
  imports: [TranslatePipe, Modal],
  templateUrl: './confirm.html',
  styleUrl: './confirm.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Confirm {
  /** Titre déjà traduit. */
  readonly title = input.required<string>();
  /** Question, ou intitulé du refus (« Ce garage ne peut pas être supprimé : »). */
  readonly message = input('');
  readonly reasons = input<readonly string[]>([]);
  readonly error = input<string | null>(null);
  readonly confirmed = output<void>();
  readonly cancelled = output<void>();
}
