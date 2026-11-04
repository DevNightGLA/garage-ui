import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Colonne de sélection à gauche d'une page maître-détail (maquette : choix du garage des historiques, liste des
 * locataires de la chronologie). Titre en capitales, contenu projeté (boutons `.pick`), défilement propre ; sur
 * tablette et smartphone la liste se replie par le chevron du titre.
 *
 * Contenu attendu : des `<button type="button" class="pick" [class.is-selected]="…">` (styles globaux dans
 * `styles/_ui.scss`), et éventuellement un champ de recherche ou des filtres avant la liste (`[pickTools]`).
 */
@Component({
  selector: 'app-pick-list',
  imports: [TranslatePipe],
  template: `
    <div class="pl__head">
      <h2 class="pl__title">{{ title() }}</h2>
      <button
        type="button"
        class="pl__toggle"
        [attr.aria-expanded]="!collapsed()"
        [attr.aria-label]="(collapsed() ? 'commun.deplier' : 'commun.replier') | translate"
        (click)="collapsed.update((value) => !value)"
      >
        <i class="fa-solid fa-chevron-down" [class.is-up]="!collapsed()" aria-hidden="true"></i>
      </button>
    </div>
    <ng-content select="[pickTools]" />
    <div class="pl__list" role="list" [class.is-collapsed]="collapsed()">
      <ng-content />
    </div>
  `,
  styleUrl: './pick-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'card' },
})
export class PickList {
  readonly title = input.required<string>();
  /** Replié (petits écrans seulement : sur ordinateur la liste reste visible). */
  protected readonly collapsed = signal(false);
}
