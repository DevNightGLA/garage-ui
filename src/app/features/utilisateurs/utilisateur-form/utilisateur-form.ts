import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { finalize, startWith } from 'rxjs';
import { toApiError } from '../../../core/api/api-error';
import { ErrorMessageService } from '../../../core/api/error-message-service';
import { LanguageService } from '../../../core/language-service';
import { ROLES, Role } from '../../../core/auth/auth.models';
import { FormField } from '../../../shared/form-field/form-field';
import { Modal } from '../../../shared/modal/modal';
import { Stepper } from '../../../shared/stepper/stepper';
import { LocataireDTO } from '../../locataires/locataire.models';
import { LocatairePicker } from '../../locations/locataire-picker/locataire-picker';
import { UtilisateurApi } from '../utilisateur-api';
import { MotDePasseTemporaireDTO, PROFILS, UtilisateurDTO, UtilisateurSaisie } from '../utilisateur.models';

type Field = 'nom' | 'prenom' | 'email' | 'login' | 'role' | 'locataireId';
/** Champs de chaque étape de la création (maquette : Identité, Connexion, Profil, Récapitulatif). */
const STEPS: readonly (readonly Field[])[] = [['nom', 'prenom'], ['email', 'login'], ['role', 'locataireId'], []];
/** Erreurs du back rattachées à un champ (codes 409), pour revenir à la bonne étape. */
const CODE_FIELDS: Record<string, Field> = {
  USR_LOGIN_EXISTE: 'login',
  USR_EMAIL_EXISTE: 'email',
  USR_FICHE_PRISE: 'locataireId',
  USR_DERNIER_ADMIN: 'role',
  USR_PROPRE_PROFIL: 'role',
};

/**
 * Création d'un utilisateur en quatre étapes, ou modification (RG-USR-04 à 06). Le profil Locataire demande la fiche
 * du locataire (v2). Les contrôles de format et d'unicité sont ceux du back ; ses messages s'affichent sous les
 * champs et l'assistant revient à l'étape concernée. La création renvoie le mot de passe temporaire.
 */
@Component({
  selector: 'app-utilisateur-form',
  imports: [ReactiveFormsModule, TranslatePipe, Modal, FormField, Stepper, LocatairePicker],
  templateUrl: './utilisateur-form.html',
  styleUrl: './utilisateur-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UtilisateurForm implements OnInit {
  /** Compte modifié ; `null` pour une création. */
  readonly utilisateur = input<UtilisateurDTO | null>(null);
  /** Sans droit `USR` m : « Visualiser l'utilisateur » (RG-VAL-05). */
  readonly readOnly = input(false);
  readonly created = output<MotDePasseTemporaireDTO>();
  readonly saved = output<UtilisateurDTO>();
  readonly closed = output<void>();

  private readonly api = inject(UtilisateurApi);
  private readonly errors = inject(ErrorMessageService);
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);

  protected readonly roles = ROLES;
  protected readonly profils = PROFILS;
  protected readonly form = new FormGroup({
    nom: new FormControl('', { nonNullable: true, validators: Validators.required }),
    prenom: new FormControl('', { nonNullable: true, validators: Validators.required }),
    email: new FormControl('', { nonNullable: true, validators: Validators.required }),
    login: new FormControl('', { nonNullable: true, validators: Validators.required }),
    role: new FormControl<Role>('CONSULTANT', { nonNullable: true }),
    locataireId: new FormControl<number | null>(null),
  });
  private readonly value = toSignal(this.form.valueChanges.pipe(startWith(null)), { initialValue: null });
  protected readonly role = computed(() => {
    this.value();
    return this.form.controls.role.value;
  });

  protected readonly isNew = computed(() => this.utilisateur() === null);
  /** On ne modifie pas son propre profil (RG-USR-06). */
  protected readonly self = computed(() => this.utilisateur()?.vous ?? false);
  protected readonly step = signal(0);
  protected readonly stepLabels = computed(() => {
    this.language.lang();
    return ['identite', 'connexion', 'profil', 'recapitulatif'].map((key) => this.translate.instant(`utilisateurs.etape.${key}`));
  });
  protected readonly lastStep = STEPS.length - 1;

  protected readonly fieldErrors = signal<Record<string, string>>({});
  protected readonly error = signal<string | null>(null);
  protected readonly pending = signal(false);
  /** Nom de la fiche reliée, pour le récapitulatif. */
  protected readonly locataireNom = signal<string | null>(null);

  ngOnInit(): void {
    const utilisateur = this.utilisateur();
    if (utilisateur) {
      this.form.setValue({
        nom: utilisateur.nom,
        prenom: utilisateur.prenom,
        email: utilisateur.email,
        login: utilisateur.login,
        role: utilisateur.role,
        locataireId: utilisateur.locataireId,
      });
      this.form.controls.login.disable();
      if (this.readOnly()) {
        this.form.disable();
      }
      this.locataireNom.set(utilisateur.locataireNom);
    }
    this.form.controls.role.valueChanges.subscribe((role) => this.updateLocataireValidator(role));
    this.updateLocataireValidator(this.form.controls.role.value);
  }

  protected pickedLocataire(locataire: LocataireDTO): void {
    this.locataireNom.set(`${locataire.nom} ${locataire.prenom}`);
  }

  protected setRole(role: Role): void {
    if (!this.self() && !this.readOnly()) {
      this.form.controls.role.setValue(role);
    }
  }

  protected initials(): string {
    const { prenom, nom } = this.form.getRawValue();
    return `${prenom.trim().charAt(0)}${nom.trim().charAt(0)}`.toUpperCase();
  }

  protected summary(): { prenom: string; nom: string; email: string; login: string } {
    const { prenom, nom, email, login } = this.form.getRawValue();
    return { prenom: prenom.trim(), nom: nom.trim(), email: email.trim().toLowerCase(), login: login.trim().toLowerCase() };
  }

  // --- Assistant ---

  /** Les champs vides de l'étape se surlignent (FormField) : chaque étape est un envoi du formulaire. */
  protected submit(): void {
    if (this.readOnly()) {
      return;
    }
    if (!this.isNew()) {
      this.save();
      return;
    }
    const step = this.step();
    if (step < this.lastStep) {
      if (STEPS[step].every((name) => this.form.controls[name].valid)) {
        this.step.set(step + 1);
      }
      return;
    }
    this.save();
  }

  protected goTo(step: number): void {
    if (step < this.step()) {
      this.step.set(step);
    }
  }

  protected previous(): void {
    this.step.update((step) => Math.max(0, step - 1));
  }

  // --- Enregistrement ---

  private saisie(): UtilisateurSaisie {
    const value = this.form.getRawValue();
    return {
      nom: value.nom.trim(),
      prenom: value.prenom.trim(),
      email: value.email.trim(),
      ...(this.isNew() ? { login: value.login.trim() } : {}),
      role: value.role,
      locataireId: value.role === 'LOCATAIRE' ? value.locataireId : null,
    };
  }

  private save(): void {
    if (this.pending()) {
      return;
    }
    this.fieldErrors.set({});
    this.error.set(null);
    if (this.form.invalid) {
      return;
    }
    this.pending.set(true);
    const utilisateur = this.utilisateur();
    if (utilisateur) {
      this.api.update(utilisateur.id, this.saisie()).pipe(finalize(() => this.pending.set(false))).subscribe({
        next: (result) => this.saved.emit(result),
        error: (err: unknown) => this.fail(err),
      });
    } else {
      this.api.create(this.saisie()).pipe(finalize(() => this.pending.set(false))).subscribe({
        next: (result) => this.created.emit(result),
        error: (err: unknown) => this.fail(err),
      });
    }
  }

  private fail(err: unknown): void {
    const apiError = toApiError(err);
    const fields = { ...this.errors.fields(apiError) };
    const field = CODE_FIELDS[apiError.code];
    if (field && Object.keys(fields).length === 0) {
      fields[field] = this.errors.text(apiError);
    }
    this.fieldErrors.set(fields);
    this.error.set(Object.keys(fields).length > 0 ? null : this.errors.text(apiError));
    if (this.isNew()) {
      const step = STEPS.findIndex((names) => names.some((name) => fields[name]));
      if (step >= 0) {
        this.step.set(step);
      }
    }
  }

  private updateLocataireValidator(role: Role): void {
    const control = this.form.controls.locataireId;
    if (role === 'LOCATAIRE') {
      control.setValidators(Validators.required);
    } else {
      control.clearValidators();
    }
    control.updateValueAndValidity({ emitEvent: false });
  }
}
