import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ClampText } from '../clamp-text/clamp-text';

/** Un événement à afficher (déjà traduit et mis en forme par l'écran). */
export interface TimelineItem {
  /** Identifiant stable pour le suivi des lignes. */
  key: string;
  /** Classes Font Awesome complètes (`fa-solid fa-key`). */
  icon: string;
  /** Dégradé de la pastille d'icône et de la pastille de type. */
  gradient: string;
  title: string;
  /** Pastille colorée après le titre (type de remarque, garage, mode de paiement). */
  chip?: string | null;
  /** Pastille « À venir » (événement futur). */
  future?: boolean;
  /** Montant déjà mis en forme, à droite. */
  amount?: string | null;
  /** Date et heure déjà mises en forme. */
  date: string;
  /** Description (HTML nettoyé ou texte), coupée à 5 lignes. */
  description?: string | null;
  /** Description sur fond gris (remarque). */
  quote?: boolean;
}

/**
 * Chronologie verticale (maquette : chronologie d'un locataire, RG-CHR-03) : pastille d'icône reliée par un trait,
 * titre et pastilles, montant, date, description avec « Voir plus », puis « Afficher plus (n) ».
 */
@Component({
  selector: 'app-timeline',
  imports: [TranslatePipe, ClampText],
  template: `
    <ol class="tl">
      @for (item of items(); track item.key; let last = $last) {
        <li class="tl__item">
          @if (!last || remaining() > 0) {
            <span class="tl__line" aria-hidden="true"></span>
          }
          <span class="tl__icon" [style.background]="item.gradient" aria-hidden="true"><i [class]="item.icon"></i></span>
          <div class="tl__body">
            <div class="tl__top">
              <div class="tl__heading">
                <b class="tl__title">{{ item.title }}</b>
                @if (item.chip) {
                  <span class="tl__chip" [style.background]="item.gradient">{{ item.chip }}</span>
                }
                @if (item.future) {
                  <span class="tl__chip tl__chip--outline">{{ 'commun.aVenir' | translate }}</span>
                }
              </div>
              @if (item.amount) {
                <b class="tl__amount">{{ item.amount }}</b>
              }
            </div>
            <div class="tl__date">{{ item.date }}</div>
            @if (item.description) {
              <app-clamp-text [html]="item.description" [quote]="!!item.quote" />
            }
          </div>
        </li>
      }
    </ol>
    @if (items().length === 0) {
      <p class="tl__empty">{{ empty() }}</p>
    }
    @if (remaining() > 0) {
      <div class="tl__more">
        <button type="button" class="btn btn--secondary" [disabled]="loading()" (click)="more.emit()">
          {{ 'commun.afficherPlus' | translate: { n: remaining() } }}
        </button>
      </div>
    }
  `,
  styleUrl: './timeline.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Timeline {
  readonly items = input.required<readonly TimelineItem[]>();
  /** Événements pas encore affichés : bouton « Afficher plus (n) ». */
  readonly remaining = input(0);
  readonly loading = input(false);
  /** Texte sans événement, déjà traduit. */
  readonly empty = input('');
  readonly more = output<void>();
}
