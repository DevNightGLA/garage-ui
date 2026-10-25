import { ChangeDetectionStrategy, Component, DestroyRef, forwardRef, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { QuillEditorComponent, QuillModules } from 'ngx-quill';

const EDITABLE: QuillModules = {
  toolbar: [['bold', 'italic', 'underline'], [{ list: 'ordered' }, { list: 'bullet' }], ['link']],
};
const READ_ONLY: QuillModules = { toolbar: false };
const FORMATS = ['bold', 'italic', 'underline', 'list', 'link'];

const EMPTY_HTML = /^(<p><br><\/p>|<p>\s*<\/p>)?$/;

/**
 * Éditeur riche des remarques : gras, italique, souligné, listes et liens (RG-REM-02).
 * La valeur est du HTML ; un texte vide vaut `''`, ce qui déclenche `Validators.required`.
 */
@Component({
  selector: 'app-rich-text',
  imports: [ReactiveFormsModule, QuillEditorComponent],
  templateUrl: './rich-text.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => RichText), multi: true }],
})
export class RichText implements ControlValueAccessor {
  /** Texte d'aide, déjà traduit. */
  readonly placeholder = input('');

  protected readonly inner = new FormControl<string>('', { nonNullable: true });
  protected readonly readOnly = signal(false);
  protected readonly modules = () => (this.readOnly() ? READ_ONLY : EDITABLE);
  protected readonly formats = FORMATS;

  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor() {
    this.inner.valueChanges.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe((html) => {
      this.onChange(EMPTY_HTML.test(html ?? '') ? '' : html);
    });
  }

  writeValue(html: string | null): void {
    this.inner.setValue(html ?? '', { emitEvent: false });
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.readOnly.set(disabled);
    if (disabled) {
      this.inner.disable({ emitEvent: false });
    } else {
      this.inner.enable({ emitEvent: false });
    }
  }

  protected blurred(): void {
    this.onTouched();
  }
}
