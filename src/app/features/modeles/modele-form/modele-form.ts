import { ChangeDetectionStrategy, Component, OnInit, inject, input, output, signal, viewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { toApiError } from '../../../core/api/api-error';
import { ErrorMessageService } from '../../../core/api/error-message-service';
import { FormField } from '../../../shared/form-field/form-field';
import { Modal } from '../../../shared/modal/modal';
import { RichText } from '../../../shared/rich-text/rich-text';
import { VariableChips } from '../../../shared/variable-chips/variable-chips';
import { ParametresApi } from '../../parametres/parametres-api';
import { ParametreDTO } from '../../parametres/parametres.models';
import { ModeleDef } from '../modeles';

/**
 * Fenêtre « Modèle · … » (maquette) : objet et message riche avec variables insérées au curseur ; pour la signature,
 * le message seul, facultatif. Sans droit de modification, la fenêtre s'ouvre en consultation.
 */
@Component({
  selector: 'app-modele-form',
  imports: [ReactiveFormsModule, TranslatePipe, Modal, FormField, RichText, VariableChips],
  templateUrl: './modele-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModeleForm implements OnInit {
  readonly modele = input.required<ModeleDef>();
  /** Valeurs actuelles, par clé de paramètre. */
  readonly values = input.required<Readonly<Record<string, string>>>();
  readonly readOnly = input(false);
  readonly saved = output<ParametreDTO[]>();
  readonly closed = output<void>();

  private readonly api = inject(ParametresApi);
  private readonly errors = inject(ErrorMessageService);
  private readonly editor = viewChild(RichText);

  protected readonly form = new FormGroup({
    objet: new FormControl('', { nonNullable: true }),
    texte: new FormControl('', { nonNullable: true }),
  });
  protected readonly fieldErrors = signal<Record<string, string>>({});
  protected readonly error = signal<string | null>(null);
  protected readonly pending = signal(false);

  ngOnInit(): void {
    const modele = this.modele();
    const values = this.values();
    this.form.setValue({ objet: modele.objet ? (values[modele.objet] ?? '') : '', texte: values[modele.texte] ?? '' });
    if (modele.objet) {
      this.form.controls.objet.addValidators(Validators.required);
      this.form.controls.texte.addValidators(Validators.required);
    }
    if (this.readOnly()) {
      this.form.disable();
    }
  }

  protected insertVariable(variable: string): void {
    this.editor()?.insertText(variable);
  }

  /** Erreur du back pour un champ, retrouvée par la clé de son paramètre. */
  protected fieldError(cle: string | null): string | null {
    return cle ? (this.fieldErrors()[cle] ?? null) : null;
  }

  protected submit(): void {
    if (this.readOnly() || this.pending()) {
      return;
    }
    this.fieldErrors.set({});
    this.error.set(null);
    if (this.form.invalid) {
      return;
    }
    const modele = this.modele();
    const { objet, texte } = this.form.getRawValue();
    const parametres = [{ cle: modele.texte, valeur: texte }];
    if (modele.objet) {
      parametres.unshift({ cle: modele.objet, valeur: objet.trim() });
    }
    this.pending.set(true);
    this.api
      .saveModeles(parametres)
      .pipe(finalize(() => this.pending.set(false)))
      .subscribe({
        next: (result) => this.saved.emit(result),
        error: (err: unknown) => {
          const apiError = toApiError(err);
          const fields = this.errors.fields(apiError);
          this.fieldErrors.set(fields);
          this.error.set(Object.keys(fields).length > 0 ? null : this.errors.text(apiError));
        },
      });
  }
}
