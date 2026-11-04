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

/**
 * Gabarit d'un en-tête : `<ng-template appHeader="choix">…</ng-template>` remplace le libellé de la colonne
 * (case « Tout sélectionner », par exemple). Une colonne à gabarit d'en-tête n'est pas triable.
 */
@Directive({ selector: 'ng-template[appHeader]' })
export class DataTableHeader {
  readonly key = input.required<string>({ alias: 'appHeader' });
  readonly template = inject(TemplateRef);
}
