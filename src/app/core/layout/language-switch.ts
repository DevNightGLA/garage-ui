import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Lang, LanguageService } from '../language-service';
import { Tooltip } from '../../shared/tooltip/tooltip';

@Component({
  selector: 'app-language-switch',
  imports: [TranslatePipe, Tooltip],
  template: `
    <div class="ls" role="group">
      @for (option of options; track option.lang) {
        <button
          type="button"
          class="ls__btn"
          [class.is-active]="language.lang() === option.lang"
          [attr.aria-pressed]="language.lang() === option.lang"
          [appTooltip]="option.title | translate"
          (click)="language.use(option.lang)"
        >
          {{ option.label }}
        </button>
      }
    </div>
  `,
  styles: `
    .ls {
      display: flex;
      gap: var(--space-1);
    }

    .ls__btn {
      width: 32px;
      height: 32px;
      padding: 0;
      border: 1px solid var(--surface-border-input);
      border-radius: var(--radius-md);
      background: var(--white);
      font-family: var(--font-sans);
      font-size: 11px;
      font-weight: 700;
      color: var(--text-heading);
      cursor: pointer;

      &.is-active {
        background: var(--gradient-brand);
        color: var(--white);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageSwitch {
  protected readonly language = inject(LanguageService);
  protected readonly options: { lang: Lang; label: string; title: string }[] = [
    { lang: 'fr', label: 'FR', title: 'langue.francais' },
    { lang: 'en', label: 'EN', title: 'langue.anglais' },
  ];
}
