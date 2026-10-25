import { ChangeDetectionStrategy, Component, ElementRef, forwardRef, signal, viewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { Tooltip } from '../tooltip/tooltip';
import { Calendar } from './calendar';
import { isoToDisplay, maskDate } from './date-utils';

/**
 * Saisie `jj/mm/aaaa` avec masque automatique et calendrier. La valeur du
 * formulaire est `yyyy-MM-dd`, ou `null` tant que la date n'est pas complète
 * et réelle : une date inexistante vide le champ (RG-VAL-03).
 */
@Component({
  selector: 'app-date-input',
  imports: [TranslatePipe, Tooltip, Calendar],
  templateUrl: './date-input.html',
  styleUrl: './date-input.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DateInput), multi: true }],
})
export class DateInput implements ControlValueAccessor {
  protected readonly text = signal('');
  protected readonly value = signal<string | null>(null);
  protected readonly disabled = signal(false);
  protected readonly calendarOpen = signal(false);

  private readonly field = viewChild.required<ElementRef<HTMLInputElement>>('field');

  private onChange: (value: string | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(iso: string | null): void {
    this.value.set(iso || null);
    this.text.set(isoToDisplay(iso));
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled.set(disabled);
  }

  protected typed(field: HTMLInputElement): void {
    const masked = maskDate(field.value);
    const text = masked.invalid ? '' : masked.text;
    field.value = text;
    this.text.set(text);
    this.value.set(masked.iso);
    this.onChange(masked.iso);
  }

  /** Une saisie incomplète ne vaut pas une date : le champ est vidé en quittant. */
  protected left(field: HTMLInputElement): void {
    if (this.value() === null && this.text() !== '') {
      field.value = '';
      this.text.set('');
    }
    this.onTouched();
  }

  protected pick(iso: string): void {
    this.writeValue(iso);
    this.onChange(iso);
    this.closeCalendar();
  }

  /** Rend le focus au champ, sinon Échap et Tab repartent du début de la page. */
  protected closeCalendar(): void {
    this.calendarOpen.set(false);
    this.field().nativeElement.focus();
    this.onTouched();
  }
}
