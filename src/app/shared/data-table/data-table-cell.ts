import { Directive, TemplateRef, inject, input } from '@angular/core';

/**
 * Gabarit d'une cellule : `<ng-template appCell="statut" let-row>...</ng-template>`.
 * Sans gabarit, la colonne affiche la propriété de même nom.
 */
@Directive({ selector: 'ng-template[appCell]' })
export class DataTableCell {
  readonly key = input.required<string>({ alias: 'appCell' });
  readonly template = inject(TemplateRef);
}
