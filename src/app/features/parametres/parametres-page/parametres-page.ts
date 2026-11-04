import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormControl, FormRecord, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { toApiError } from '../../../core/api/api-error';
import { ErrorMessageService } from '../../../core/api/error-message-service';
import { LanguageService } from '../../../core/language-service';
import { RightsService } from '../../../core/rights/rights-service';
import { SettingsService } from '../../../core/settings-service';
import { FormField } from '../../../shared/form-field/form-field';
import { Segmented, SegmentedOption } from '../../../shared/segmented/segmented';
import { ToastService } from '../../../shared/toast/toast';
import { ParametresApi } from '../parametres-api';
import { CATEGORIES, CATEGORIES_CONTEXTE, ParametreDTO, ParametreNature } from '../parametres.models';

const NATURES: readonly ParametreNature[] = ['METIER', 'APPLICATION'];

/**
 * Paramètres (RG chapitre 15, maquette « Paramètres ») : onglets « Paramètres métier » et « Paramètres de
 * l'application », une catégorie à la fois, chaque catégorie enregistrée séparément. Les contrôles (obligatoire,
 * e-mail, bornes) sont ceux du back : ses messages s'affichent sous les champs. Changer d'onglet ou de catégorie
 * abandonne les saisies non enregistrées (maquette).
 */
@Component({
  selector: 'app-parametres-page',
  imports: [ReactiveFormsModule, TranslatePipe, FormField, Segmented],
  templateUrl: './parametres-page.html',
  styleUrl: './parametres-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParametresPage {
  private readonly api = inject(ParametresApi);
  private readonly errors = inject(ErrorMessageService);
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);
  private readonly settings = inject(SettingsService);
  private readonly toasts = inject(ToastService);
  private readonly rights = inject(RightsService);

  protected readonly canEdit = computed(() => this.rights.can('PAR', 'm'));
  protected readonly nature = signal<ParametreNature>('METIER');
  private readonly selected = signal<Partial<Record<ParametreNature, string>>>({});

  protected readonly parametres = rxResource({ stream: () => this.api.list() });
  private readonly all = computed(() => (this.parametres.hasValue() ? this.parametres.value() : []));
  protected readonly loadError = computed(() => {
    const error = this.parametres.error();
    return error ? this.errors.text(toApiError(error)) : null;
  });

  /** Catégories présentes pour la nature affichée, dans l'ordre de la maquette. */
  private readonly categories = computed(() => {
    const present = new Set(this.all().filter((p) => p.nature === this.nature()).map((p) => p.categorie));
    const known = CATEGORIES[this.nature()].filter((c) => present.has(c));
    return [...known, ...[...present].filter((c) => !known.includes(c))];
  });
  protected readonly categorie = computed(() => {
    const wanted = this.selected()[this.nature()];
    const categories = this.categories();
    return wanted && categories.includes(wanted) ? wanted : (categories[0] ?? null);
  });
  protected readonly fields = computed(() =>
    this.all()
      .filter((p) => p.categorie === this.categorie())
      .sort((a, b) => a.ordre - b.ordre),
  );

  protected readonly natureOptions = computed<SegmentedOption<ParametreNature>[]>(() => {
    this.language.lang();
    return NATURES.map((value) => ({ value, label: this.translate.instant(`parametres.nature.${value}.titre`) }));
  });
  protected readonly categoryOptions = computed<SegmentedOption[]>(() => {
    this.language.lang();
    return this.categories().map((value) => ({ value, label: this.categoryLabel(value) }));
  });

  protected form = new FormRecord<FormControl<string>>({});
  protected readonly formVersion = signal(0);
  protected readonly fieldErrors = signal<Record<string, string>>({});
  protected readonly error = signal<string | null>(null);
  protected readonly saving = signal(false);

  constructor() {
    // Un formulaire neuf pour chaque catégorie affichée (ou rechargée).
    effect(() => {
      const fields = this.fields();
      untracked(() => this.buildForm(fields));
    });
  }

  protected setNature(nature: ParametreNature): void {
    this.nature.set(nature);
  }

  protected setCategory(categorie: string): void {
    this.selected.update((current) => ({ ...current, [this.nature()]: categorie }));
  }

  // --- Libellés (traduits, avec repli sur le libellé du back) ---

  private tr(key: string, fallback: string): string {
    const text = this.translate.instant(key);
    return text === key ? fallback : text;
  }

  protected categoryLabel(categorie: string): string {
    this.language.lang();
    return this.tr(`parametres.categorie.${categorie}.titre`, categorie);
  }

  protected categoryDescription(categorie: string): string {
    this.language.lang();
    return this.tr(`parametres.categorie.${categorie}.description`, '');
  }

  protected label(parametre: ParametreDTO): string {
    this.language.lang();
    return this.tr(`parametres.cle.${parametre.cle}.libelle`, parametre.libelle);
  }

  protected help(parametre: ParametreDTO): string | null {
    this.language.lang();
    return this.tr(`parametres.cle.${parametre.cle}.aide`, '') || null;
  }

  protected choiceLabel(parametre: ParametreDTO, choix: string): string {
    this.language.lang();
    return this.tr(`parametres.choix.${parametre.cle}.${choix}`, choix);
  }

  // --- Enregistrement ---

  protected submit(): void {
    const categorie = this.categorie();
    if (!categorie || this.saving() || !this.canEdit()) {
      return;
    }
    this.fieldErrors.set({});
    this.error.set(null);
    if (this.form.invalid) {
      return; // champs obligatoires vides : surlignés par FormField
    }
    // Un champ numérique rend un nombre (ou null s'il est vide).
    const values: Record<string, unknown> = this.form.getRawValue();
    const parametres = this.fields().map((p) => ({ cle: p.cle, valeur: String(values[p.cle] ?? '').trim() }));
    this.saving.set(true);
    this.api
      .saveCategory(categorie, parametres)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (saved) => {
          this.parametres.update((current) =>
            current ? current.map((p) => saved.find((s) => s.cle === p.cle) ?? p) : current,
          );
          this.toasts.show(this.translate.instant('parametres.enregistres', { categorie: this.categoryLabel(categorie) }));
          if (CATEGORIES_CONTEXTE.includes(categorie)) {
            this.settings.load().subscribe();
          }
        },
        error: (err: unknown) => {
          const apiError = toApiError(err);
          const fields = this.errors.fields(apiError);
          this.fieldErrors.set(fields);
          this.error.set(Object.keys(fields).length > 0 ? null : this.errors.text(apiError));
        },
      });
  }

  private buildForm(fields: ParametreDTO[]): void {
    const form = new FormRecord<FormControl<string>>({});
    for (const p of fields) {
      form.addControl(
        p.cle,
        new FormControl(
          { value: p.valeur ?? '', disabled: !this.canEdit() },
          { nonNullable: true, validators: p.obligatoire ? Validators.required : [] },
        ),
      );
    }
    this.form = form;
    this.fieldErrors.set({});
    this.error.set(null);
    this.formVersion.update((v) => v + 1);
  }
}
