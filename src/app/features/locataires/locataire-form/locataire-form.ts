import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  afterRenderEffect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { toApiError } from '../../../core/api/api-error';
import { ErrorMessageService } from '../../../core/api/error-message-service';
import { FormField } from '../../../shared/form-field/form-field';
import { Modal } from '../../../shared/modal/modal';
import { LocataireApi } from '../locataire-api';
import { Civilite, LocataireDTO, LocataireEnvoi } from '../locataire.models';

/** Code d'erreur de l'alerte de doublon, non bloquante (RG-LOCT-04). */
export const CODE_DOUBLON = 'LOCT_DOUBLON';

/**
 * Fenêtre « Nouveau locataire », « Modifier le locataire » ou, en lecture seule,
 * « Visualiser le locataire » (RG-LOCT-01 à 04). Le doublon nom + prénom est détecté
 * par l'API (409) : le bouton devient « Enregistrer quand même » et le second clic
 * renvoie la même requête avec `?force=true`. Toute modification d'un champ réarme l'alerte.
 */
@Component({
  selector: 'app-locataire-form',
  imports: [ReactiveFormsModule, TranslatePipe, Modal, FormField],
  templateUrl: './locataire-form.html',
  styleUrl: './locataire-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocataireForm implements OnInit {
  /** Locataire à modifier ou à visualiser ; `null` pour une création. */
  readonly locataire = input<LocataireDTO | null>(null);
  readonly readOnly = input(false);
  readonly saved = output<LocataireDTO>();
  readonly closed = output<void>();

  private readonly api = inject(LocataireApi);
  private readonly errors = inject(ErrorMessageService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly form = new FormGroup({
    civilite: new FormControl<Civilite | ''>('', { nonNullable: true }),
    nom: new FormControl('', { nonNullable: true, validators: Validators.required }),
    prenom: new FormControl('', { nonNullable: true, validators: Validators.required }),
    rue: new FormControl('', { nonNullable: true, validators: Validators.required }),
    numeroRue: new FormControl('', { nonNullable: true, validators: Validators.required }),
    codePostal: new FormControl('', { nonNullable: true, validators: Validators.required }),
    localite: new FormControl('', { nonNullable: true, validators: Validators.required }),
    tel1: new FormControl('', { nonNullable: true, validators: Validators.required }),
    tel2: new FormControl('', { nonNullable: true }),
    email: new FormControl('', { nonNullable: true }),
  });
  protected readonly pending = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly fieldErrors = signal<Record<string, string>>({});
  /** Message de l'alerte de doublon quand l'API l'a signalé ; son affichage arme le renvoi avec `force`. */
  protected readonly duplicate = signal<string | null>(null);
  private readonly alert = viewChild<ElementRef<HTMLElement>>('alert');

  constructor() {
    // Sur smartphone le corps de la fenêtre défile : l'alerte, en bas, doit venir dans la zone visible.
    afterRenderEffect(() => this.alert()?.nativeElement.scrollIntoView?.({ block: 'nearest' }));
  }

  protected get isCreation(): boolean {
    return this.locataire() === null;
  }

  protected titleKey(): string {
    if (this.isCreation) {
      return 'locataires.form.titreNouveau';
    }
    return this.readOnly() ? 'locataires.form.titreVisualiser' : 'locataires.form.titreModifier';
  }

  ngOnInit(): void {
    const locataire = this.locataire();
    if (locataire) {
      this.form.patchValue({
        ...locataire,
        civilite: locataire.civilite ?? '',
        tel2: locataire.tel2 ?? '',
        email: locataire.email ?? '',
      });
    }
    if (this.readOnly()) {
      this.form.disable();
    }
    // Abonné après le remplissage initial : seule une saisie de l'utilisateur réarme l'alerte.
    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.duplicate.set(null);
      this.error.set(null);
    });
  }

  protected submit(): void {
    this.error.set(null);
    this.fieldErrors.set({});
    if (this.form.invalid || this.pending()) {
      return;
    }
    const body = this.body();
    const force = this.duplicate() !== null;
    const locataire = this.locataire();
    const request = locataire ? this.api.update(locataire.id, body, force) : this.api.create(body, force);

    this.pending.set(true);
    request.pipe(finalize(() => this.pending.set(false))).subscribe({
      next: (saved) => this.saved.emit(saved),
      error: (err: unknown) => {
        const apiError = toApiError(err);
        if (apiError.code === CODE_DOUBLON) {
          this.duplicate.set(this.errors.text(apiError));
          return;
        }
        this.fieldErrors.set(this.errors.fields(apiError));
        this.error.set(Object.keys(apiError.fieldErrors).length > 0 ? null : this.errors.text(apiError));
      },
    });
  }

  private body(): LocataireEnvoi {
    const value = this.form.getRawValue();
    return {
      civilite: value.civilite || null,
      nom: value.nom,
      prenom: value.prenom,
      rue: value.rue,
      numeroRue: value.numeroRue,
      codePostal: value.codePostal,
      localite: value.localite,
      tel1: value.tel1,
      tel2: value.tel2.trim() || null,
      email: value.email.trim() || null,
    };
  }
}
