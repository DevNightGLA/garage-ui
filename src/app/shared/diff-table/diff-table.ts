import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { DiffSegment, plainText, wordDiff } from './word-diff';

/** Une ligne du tableau : libellé traduit, clé technique, valeurs avant et après. */
export interface DiffRow {
  label: string;
  key: string;
  before: string | null;
  after: string | null;
  changed: boolean;
  /** Valeur masquée (mot de passe) : « modifié, valeur masquée ». */
  masked: boolean;
}

interface ShownRow {
  row: DiffRow;
  before: DiffSegment[];
  after: DiffSegment[];
}

/** Au-delà de cette longueur, un texte est comparé mot à mot. */
const LONG_TEXT = 60;

/**
 * Tableau « Champ / As is · avant / To be · après » du journal d'audit (RG-AUD-08). Les champs inchangés sont
 * masqués sauf `showUnchanged` ; une valeur vide s'affiche « (vide) » ; un texte long montre les mots ajoutés et
 * retirés.
 */
@Component({
  selector: 'app-diff-table',
  imports: [TranslatePipe],
  template: `
    <table class="dft">
      <thead>
        <tr>
          <th scope="col">{{ 'diff.champ' | translate }}</th>
          <th scope="col"><i class="fa-solid fa-circle-minus" aria-hidden="true"></i> {{ 'diff.avant' | translate }}</th>
          <th scope="col"><i class="fa-solid fa-circle-plus" aria-hidden="true"></i> {{ 'diff.apres' | translate }}</th>
        </tr>
      </thead>
      <tbody>
        @for (line of shown(); track line.row.key) {
          <tr>
            <th scope="row">
              <span class="dft__label">{{ line.row.label }}</span>
              <span class="dft__key">{{ line.row.key }}</span>
            </th>
            @if (!line.row.changed) {
              <td colspan="2" class="dft__same">
                {{ line.after[0]?.text || ('diff.vide' | translate) }} <span class="dft__tag">{{ 'diff.inchange' | translate }}</span>
              </td>
            } @else if (line.row.masked) {
              <td [attr.data-label]="'diff.avant' | translate"><span class="dft__masked">•••••••• {{ 'diff.masque' | translate }}</span></td>
              <td [attr.data-label]="'diff.apres' | translate"><span class="dft__masked">{{ 'diff.modifieMasque' | translate }}</span></td>
            } @else {
              <td [attr.data-label]="'diff.avant' | translate">
                @if (line.row.before === null) {
                  <span class="dft__empty">{{ 'diff.vide' | translate }}</span>
                } @else {
                  @for (seg of line.before; track $index) {
                    <span [class.dft__removed]="seg.kind === 'removed'">{{ seg.text }}</span>
                  }
                }
              </td>
              <td [attr.data-label]="'diff.apres' | translate">
                @if (line.row.after === null) {
                  <span class="dft__empty">{{ 'diff.vide' | translate }}</span>
                } @else {
                  @for (seg of line.after; track $index) {
                    <span [class.dft__added]="seg.kind === 'added'">{{ seg.text }}</span>
                  }
                }
              </td>
            }
          </tr>
        }
      </tbody>
    </table>
  `,
  styles: `
    .dft {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;

      th,
      td {
        padding: 8px 12px;
        border-top: 1px solid var(--surface-border);
        text-align: left;
        vertical-align: top;
        overflow-wrap: anywhere;
      }
      thead th {
        border-top: 0;
        background: var(--surface-page);
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        color: var(--text-body);
      }
      tbody th {
        width: 26%;
        font-weight: 400;
      }
      td {
        width: 37%;
        color: var(--text-heading);
      }
    }
    .dft__label {
      display: block;
      font-weight: 700;
      color: var(--text-heading);
    }
    .dft__key {
      display: block;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 11px;
      color: var(--text-body);
    }
    .dft__same {
      color: var(--text-body);
    }
    .dft__tag {
      margin-left: 6px;
      font-size: 11px;
      font-style: italic;
    }
    .dft__empty,
    .dft__masked {
      font-style: italic;
      color: var(--text-body);
    }
    .dft__removed {
      border-radius: 3px;
      background: #fdeceb;
      color: #8f0a0a;
      text-decoration: line-through;
    }
    .dft__added {
      border-radius: 3px;
      background: #e8f6ec;
      color: #14532d;
    }
    @media (max-width: 640px) {
      .dft thead {
        display: none;
      }
      .dft tr {
        display: block;
        border-top: 1px solid var(--surface-border);
      }
      .dft th,
      .dft td {
        display: block;
        width: auto;
        border-top: 0;
      }
      .dft td[data-label]::before {
        content: attr(data-label);
        display: block;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        color: var(--text-body);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiffTable {
  readonly rows = input.required<readonly DiffRow[]>();
  readonly showUnchanged = input(false);

  protected readonly shown = computed<ShownRow[]>(() =>
    this.rows()
      .filter((row) => row.changed || this.showUnchanged())
      .map((row) => {
        const before = row.before === null ? '' : plainText(row.before);
        const after = row.after === null ? '' : plainText(row.after);
        if (row.changed && !row.masked && row.before !== null && row.after !== null && Math.max(before.length, after.length) > LONG_TEXT) {
          const diff = wordDiff(before, after);
          return { row, before: diff.before, after: diff.after };
        }
        return { row, before: [{ text: before, kind: 'removed' as const }], after: [{ text: after, kind: 'added' as const }] };
      }),
  );
}
