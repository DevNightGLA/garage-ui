import { ChangeDetectionStrategy, Component, DestroyRef, forwardRef, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { QuillEditorComponent, QuillModules } from 'ngx-quill';

const EDITABLE: QuillModules = {
  toolbar: [['bold', 'italic', 'underline'], [{ list: 'ordered' }, { list: 'bullet' }], ['link']],
};
const READ_ONLY: QuillModules = { toolbar: false };
const FORMATS = ['bold', 'italic', 'underline', 'list', 'link'];

const EMPTY_HTML = /^(<p><br><\/p>|<p>\s*<\/p>)?$/;

/** Boutons de la barre d'outils de Quill, dont les noms par défaut sont en anglais (« bold », « list: ordered »). */
const TOOLBAR_LABELS: [selector: string, key: string][] = [
  ['.ql-bold', 'commun.editeur.gras'],
  ['.ql-italic', 'commun.editeur.italique'],
  ['.ql-underline', 'commun.editeur.souligne'],
  ['.ql-list[value="ordered"]', 'commun.editeur.listeNumerotee'],
  ['.ql-list[value="bullet"]', 'commun.editeur.listePuces'],
  ['.ql-link', 'commun.editeur.lien'],
];

/** Ce que l'on utilise de l'instance Quill : sa zone de saisie et sa barre d'outils. */
interface EditorInstance {
  root: HTMLElement;
  getModule(name: string): unknown;
}

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
  /** Nom de la zone de saisie pour les lecteurs d'écran, déjà traduit. */
  readonly ariaLabel = input('');

  protected readonly inner = new FormControl<string>('', { nonNullable: true });
  protected readonly readOnly = signal(false);
  protected readonly modules = () => (this.readOnly() ? READ_ONLY : EDITABLE);
  protected readonly formats = FORMATS;

  private readonly translate = inject(TranslateService);
  private editor: EditorInstance | null = null;
  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor() {
    const destroyed = inject(DestroyRef);
    this.inner.valueChanges.pipe(takeUntilDestroyed(destroyed)).subscribe((html) => {
      this.onChange(EMPTY_HTML.test(html ?? '') ? '' : html);
    });
    this.translate.onLangChange.pipe(takeUntilDestroyed(destroyed)).subscribe(() => this.nameControls());
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

  protected created(editor: EditorInstance): void {
    this.editor = editor;
    this.nameControls();
  }

  /** Donne un nom, dans la langue courante, à la zone de saisie et aux boutons de la barre d'outils. */
  private nameControls(): void {
    const editor = this.editor;
    if (!editor) {
      return;
    }
    editor.root.setAttribute('role', 'textbox');
    editor.root.setAttribute('aria-multiline', 'true');
    const label = this.ariaLabel();
    if (label) {
      editor.root.setAttribute('aria-label', label);
    }
    const toolbar = (editor.getModule('toolbar') as { container?: HTMLElement } | undefined)?.container;
    for (const [selector, key] of TOOLBAR_LABELS) {
      const name = this.translate.instant(key);
      const button = toolbar?.querySelector(selector);
      button?.setAttribute('aria-label', name);
      button?.setAttribute('title', name);
    }
  }
}
