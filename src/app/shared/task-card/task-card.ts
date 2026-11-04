import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Pagination } from '../pagination/pagination';

/**
 * Carte de liste du tableau de bord (maquette : « Impayés à relancer », « Remarques à traiter », « Avis de loyer à
 * communiquer ») : titre avec compteur, lignes projetées (`.task-row`, 84 px de haut et séparées par un trait),
 * état de chargement, d'erreur ou vide, pagination en pied quand il y a plus d'une page.
 */
@Component({
  selector: 'app-task-card',
  imports: [TranslatePipe, Pagination],
  template: `
    <div class="tc__head">
      <h2 class="tc__title">{{ title() }}</h2>
      <ng-content select="[taskHead]" />
    </div>
    @if (error(); as message) {
      <p class="tc__state tc__state--error" role="alert">
        {{ message }}
        <button type="button" class="link-muted" (click)="retry.emit()">{{ 'commun.reessayer' | translate }}</button>
      </p>
    } @else if (loading() && total() === 0) {
      <p class="tc__state">{{ 'commun.chargement' | translate }}</p>
    } @else if (total() === 0) {
      <p class="tc__state">{{ empty() }}</p>
    } @else {
      <div class="tc__rows" role="list">
        <ng-content />
      </div>
    }
    <ng-content select="[taskFoot]" />
    @if (pageable() && total() > size()) {
      <app-pagination
        class="tc__pager"
        [page]="page()"
        [size]="size()"
        [total]="total()"
        [noun]="noun()"
        (pageChange)="pageChange.emit($event)"
      />
    }
  `,
  styleUrl: './task-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'card' },
})
export class TaskCard {
  /** Titre déjà traduit, compteur compris. */
  readonly title = input.required<string>();
  readonly total = input(0);
  readonly page = input(0);
  readonly size = input(5);
  /** Faux : pas de pagination (la carte affiche un nombre fixe de lignes). */
  readonly pageable = input(true);
  readonly noun = input('');
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  /** Texte sans ligne, déjà traduit. */
  readonly empty = input('');
  readonly pageChange = output<number>();
  readonly retry = output<void>();
}
