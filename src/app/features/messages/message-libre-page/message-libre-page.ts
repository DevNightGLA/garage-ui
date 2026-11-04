import { ChangeDetectionStrategy, Component, computed, inject, signal, viewChild } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, FormGroupDirective, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { finalize, startWith } from 'rxjs';
import { toApiError } from '../../../core/api/api-error';
import { ErrorMessageService } from '../../../core/api/error-message-service';
import { LanguageService } from '../../../core/language-service';
import { RightsService } from '../../../core/rights/rights-service';
import { EmailPreview, EmailPreviewData } from '../../../shared/email-preview/email-preview';
import { FormField } from '../../../shared/form-field/form-field';
import { Modal } from '../../../shared/modal/modal';
import { RichText } from '../../../shared/rich-text/rich-text';
import { Segmented, SegmentedOption } from '../../../shared/segmented/segmented';
import { ToastService } from '../../../shared/toast/toast';
import { Tooltip } from '../../../shared/tooltip/tooltip';
import { VariableChips } from '../../../shared/variable-chips/variable-chips';
import { MessagesApi } from '../messages-api';
import { DestinataireMode, MessageLibre } from '../messages.models';

/** Variables du message libre (maquette : `varGroups([civilite, nom, prenom, garage, expediteur])`). */
const VARIABLES = ['civilite', 'nom', 'prenom', 'garage', 'expediteur'];
const CONFIRM_SHOWN = 6;

/**
 * Message libre (RG chapitre 14, maquette « Message libre ») : un locataire (actuel ou ancien) ou tous les locataires
 * actuels, objet, message riche avec variables insérées au curseur, aperçu, puis envoi après confirmation.
 * Les locataires sans e-mail sont signalés et ne reçoivent rien. Chaque envoi ajoute une remarque « Information ».
 */
@Component({
  selector: 'app-message-libre-page',
  imports: [ReactiveFormsModule, TranslatePipe, FormField, RichText, Segmented, VariableChips, Modal, EmailPreview, Tooltip],
  templateUrl: './message-libre-page.html',
  styleUrl: './message-libre-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageLibrePage {
  private readonly api = inject(MessagesApi);
  private readonly errors = inject(ErrorMessageService);
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);
  private readonly toasts = inject(ToastService);

  private readonly rights = inject(RightsService);
  protected readonly canSend = computed(() => this.rights.can('LIB', 'a'));
  /** Bouton qui a soumis le formulaire : « Aperçu » ou « Envoyer ». */
  protected intent: 'preview' | 'send' = 'send';
  protected readonly variables = VARIABLES;

  protected readonly form = new FormGroup({
    destinataires: new FormControl<DestinataireMode>('UN', { nonNullable: true }),
    locataireId: new FormControl<number | null>(null, Validators.required),
    objet: new FormControl('', { nonNullable: true, validators: Validators.required }),
    texte: new FormControl('', { nonNullable: true, validators: Validators.required }),
  });
  private readonly formDirective = viewChild(FormGroupDirective);
  private readonly editor = viewChild(RichText);

  protected readonly recipients = rxResource({ stream: () => this.api.libreRecipients() });
  private readonly value = toSignal(this.form.valueChanges.pipe(startWith(this.form.getRawValue())), {
    initialValue: this.form.getRawValue(),
  });
  protected readonly mode = computed(() => this.value().destinataires ?? 'UN');

  protected readonly fieldErrors = signal<Record<string, string>>({});
  protected readonly error = signal<string | null>(null);
  protected readonly confirming = signal(false);
  protected readonly sending = signal(false);
  protected readonly sendError = signal<string | null>(null);
  protected readonly preview = signal<{ data: EmailPreviewData | null; error: string | null } | null>(null);

  protected readonly modeOptions = computed<SegmentedOption<DestinataireMode>[]>(() => {
    this.language.lang();
    const actuels = this.recipients.hasValue() ? this.recipients.value().actuels : 0;
    return [
      { value: 'UN', label: this.translate.instant('messages.libre.un') },
      { value: 'TOUS_ACTUELS', label: this.translate.instant('messages.libre.tous', { n: actuels }) },
    ];
  });

  protected readonly tenants = computed(() => (this.recipients.hasValue() ? this.recipients.value().locataires : []));
  /** Destinataires qui recevront l'e-mail, et nombre de ceux qui n'ont pas d'e-mail. */
  private readonly pool = computed(() => {
    const tenants = this.tenants();
    if (this.mode() === 'TOUS_ACTUELS') {
      return tenants.filter((tenant) => !tenant.ancien);
    }
    const id = this.value().locataireId;
    return tenants.filter((tenant) => tenant.id === id);
  });
  protected readonly recipientsWithEmail = computed(() => this.pool().filter((tenant) => !!tenant.email));
  /** Destinataire choisi mais aucun e-mail : envoi impossible (sans choix, l'envoi surligne le champ vide). */
  protected readonly noRecipient = computed(() => this.pool().length > 0 && this.recipientsWithEmail().length === 0);
  protected readonly withoutEmail = computed(() => this.pool().length - this.recipientsWithEmail().length);
  protected readonly confirmList = computed(() => this.recipientsWithEmail().slice(0, CONFIRM_SHOWN));
  protected readonly confirmMore = computed(() => Math.max(0, this.recipientsWithEmail().length - CONFIRM_SHOWN));

  constructor() {
    // Le choix du locataire n'est obligatoire que pour « Un locataire ».
    this.form.controls.destinataires.valueChanges.subscribe((mode) => {
      const control = this.form.controls.locataireId;
      if (mode === 'UN') {
        control.addValidators(Validators.required);
      } else {
        control.removeValidators(Validators.required);
      }
      control.updateValueAndValidity();
    });
    if (!this.canSend()) {
      this.form.disable();
    }
  }

  protected setMode(mode: DestinataireMode): void {
    this.form.controls.destinataires.setValue(mode);
  }

  protected insertVariable(variable: string): void {
    this.editor()?.insertText(variable);
  }

  private message(): MessageLibre {
    const value = this.form.getRawValue();
    return {
      destinataires: value.destinataires,
      locataireId: value.destinataires === 'UN' ? value.locataireId : null,
      objet: value.objet.trim(),
      texte: value.texte,
    };
  }

  /** Champs obligatoires vides : tous en rouge ensemble (RG-VAL-01), via la soumission du formulaire. */
  private validate(): boolean {
    this.fieldErrors.set({});
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return false;
    }
    return true;
  }

  private openPreview(): void {
    this.preview.set({ data: null, error: null });
    this.api.librePreview(this.message()).subscribe({
      next: (data) => this.preview.update((current) => (current ? { ...current, data } : current)),
      error: (err: unknown) =>
        this.preview.update((current) => (current ? { ...current, error: this.errors.text(toApiError(err)) } : current)),
    });
  }

  /** Les deux boutons soumettent le formulaire, pour que les champs vides se surlignent (`FormField`). */
  protected submit(): void {
    if (!this.validate()) {
      return;
    }
    if (this.intent === 'preview') {
      this.openPreview();
    } else if (this.recipientsWithEmail().length > 0) {
      this.sendError.set(null);
      this.confirming.set(true);
    }
  }

  protected confirmSend(): void {
    if (this.sending()) {
      return;
    }
    this.sending.set(true);
    this.api
      .sendLibre(this.message())
      .pipe(finalize(() => this.sending.set(false)))
      .subscribe({
        next: (result) => {
          this.confirming.set(false);
          const n = result.envoyes;
          this.toasts.show(this.translate.instant(`messages.libre.envoyes.${n > 1 ? 'n' : 'un'}`, { n }));
          // Comme dans la maquette : l'objet et le message sont vidés, les destinataires restent.
          this.formDirective()?.resetForm({ ...this.form.getRawValue(), objet: '', texte: '' });
        },
        error: (err: unknown) => {
          const apiError = toApiError(err);
          const fields = this.errors.fields(apiError);
          if (Object.keys(fields).length > 0) {
            this.confirming.set(false);
            this.fieldErrors.set(fields);
          } else {
            this.sendError.set(this.errors.text(apiError));
          }
        },
      });
  }
}
