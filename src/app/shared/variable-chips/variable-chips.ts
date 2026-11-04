import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Tooltip } from '../tooltip/tooltip';

/** Variables des messages, groupées comme dans la maquette (`varGroups`). Libellés : `variables.<nom>`. */
export const MESSAGE_VARIABLES: Record<string, string> = {
  civilite: 'locataire',
  nom: 'locataire',
  prenom: 'locataire',
  garage: 'garage',
  ancien_loyer: 'loyer',
  nouveau_loyer: 'loyer',
  date_effet: 'loyer',
  periode: 'impaye',
  montant_du: 'impaye',
  montant_recu: 'impaye',
  reste_du: 'impaye',
  expediteur: 'expediteur',
  entreprise: 'organisation',
  coordonnees: 'organisation',
  iban: 'organisation',
};

/** Variables de l'organisation, ajoutées avec `{expediteur}` (maquette). */
const ORGANISATION = ['entreprise', 'coordonnees', 'iban'];

/**
 * « Variables disponibles » : boutons `{nom}` groupés (Locataire, Garage, Loyer…), info-bulle avec la description.
 * Le clic émet `{nom}` ; le bouton ne prend pas le focus, pour que l'éditeur garde la position du curseur.
 */
@Component({
  selector: 'app-variable-chips',
  imports: [TranslatePipe, Tooltip],
  template: `
    <div class="vc">
      <div class="vc__head">
        <span class="vc__title">{{ 'variables.titre' | translate }}</span>
        <span class="vc__hint">{{ 'variables.aide' | translate }}</span>
      </div>
      @for (group of groups(); track group.key) {
        <div class="vc__group">
          <span class="vc__label">{{ 'variables.groupe.' + group.key | translate }}</span>
          <div class="vc__items">
            @for (name of group.items; track name) {
              <button
                type="button"
                class="vc__chip"
                [disabled]="disabled()"
                [appTooltip]="'variables.' + name | translate"
                (mousedown)="$event.preventDefault()"
                (click)="insert.emit('{' + name + '}')"
              >
                <i class="fa-solid fa-plus" aria-hidden="true"></i>{{ '{' + name + '}' }}
              </button>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    .vc {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-md);
      background: #f8f9fa;
    }
    .vc__head {
      display: flex;
      flex-wrap: wrap;
      gap: 4px var(--space-3);
      align-items: baseline;
    }
    .vc__title {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      color: var(--text-heading);
    }
    .vc__hint {
      font-size: 12px;
      font-style: italic;
    }
    .vc__group {
      display: flex;
      flex-wrap: wrap;
      gap: 6px var(--space-3);
      align-items: center;
    }
    .vc__label {
      min-width: 92px;
      font-size: 12px;
      font-weight: 600;
    }
    .vc__items {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .vc__chip {
      display: inline-flex;
      gap: 6px;
      align-items: center;
      min-height: 32px;
      padding: 0 10px;
      border: 1px solid #d2d6da;
      border-radius: 16px;
      background: var(--white);
      font-family: inherit;
      font-size: 12px;
      font-weight: 600;
      color: var(--text-heading);
      cursor: pointer;

      i {
        font-size: 10px;
        opacity: 0.6;
      }
      &:hover:not(:disabled),
      &:focus-visible {
        border-color: #a8b9d8;
        background: #a8b9d8;
      }
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VariableChips {
  /** Noms des variables proposées, sans accolades. `expediteur` ajoute les variables de l'organisation. */
  readonly variables = input.required<readonly string[]>();
  readonly disabled = input(false);
  /** Variable à insérer, avec ses accolades (`{nom}`). */
  readonly insert = output<string>();

  protected readonly groups = computed(() => {
    const names = [...this.variables()];
    if (names.includes('expediteur')) {
      names.push(...ORGANISATION.filter((name) => !names.includes(name)));
    }
    const groups: { key: string; items: string[] }[] = [];
    for (const name of names) {
      const key = MESSAGE_VARIABLES[name] ?? 'autre';
      let group = groups.find((candidate) => candidate.key === key);
      if (!group) {
        groups.push((group = { key, items: [] }));
      }
      group.items.push(name);
    }
    return groups;
  });
}
