import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

/** Remplace un écran tant que son module n'est pas construit (étape 5 de TASKS.md). */
@Component({
  selector: 'app-placeholder',
  imports: [TranslatePipe],
  template: `<div class="card placeholder">{{ 'nav.enConstruction' | translate }}</div>`,
  styles: `
    .placeholder {
      padding: var(--space-8) var(--space-6);
      text-align: center;
      color: var(--text-muted);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Placeholder {}
