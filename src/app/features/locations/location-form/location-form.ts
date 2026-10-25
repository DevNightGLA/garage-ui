import { formatCurrency } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { toApiError } from '../../../core/api/api-error';
import { ErrorMessageService } from '../../../core/api/error-message-service';
import { TODAY } from '../../../core/today';
import { DateInput } from '../../../shared/date-input/date-input';
import { dateToIso } from '../../../shared/date-input/date-utils';
import { FormField } from '../../../shared/form-field/form-field';
import { Modal } from '../../../shared/modal/modal';
import { GarageApi } from '../../garages/garage-api';
import { LocationApi } from '../location-api';
import { LocatairePicker } from '../locataire-picker/locataire-picker';
import { LocationDTO } from '../location.models';

/**
 * Fenêtre « Nouvelle location », « Modifier la location » ou, en lecture seule, « Visualiser
 * la location » (RG-LOC-10 à 16, 20 à 26). Les contrôles (garage libre, loyer, clés, chevauchement,
 * dernier jour du mois, mois payés) sont ceux de l'API : ses messages s'affichent dans la fenêtre.
 * À la création le formulaire propose les garages libres et les conditions du garage choisi
 * (RG-LOC-12 et 14) ; à la modification le locataire et le garage sont figés (RG-LOC-20).
 */
@Component({
  selector: 'app-location-form',
  imports: [ReactiveFormsModule, TranslatePipe, Modal, FormField, DateInput, LocatairePicker],
  templateUrl: './location-form.html',
  styleUrl: './location-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocationForm implements OnInit {
  /** Location à modifier ou à visualiser ; `null` pour une création. */
  readonly location = input<LocationDTO | null>(null);
  readonly readOnly = input(false);
  readonly saved = output<LocationDTO>();
  readonly closed = output<void>();

  private readonly api = inject(LocationApi);
  private readonly garageApi = inject(GarageApi);
  private readonly errors = inject(ErrorMessageService);
  private readonly today = inject(TODAY);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly form = new FormGroup({
    locataireId: new FormControl<number | null>(null, Validators.required),
    garageId: new FormControl<number | null>(null, Validators.required),
    dateDebut: new FormControl<string | null>(null, Validators.required),
    dateFin: new FormControl<string | null>(null),
    nbClesRemises: new FormControl<number | null>(null, Validators.required),
  });
  protected readonly pending = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly fieldErrors = signal<Record<string, string>>({});

  private readonly garageId = signal<number | null>(null);
  private readonly dateDebut = signal<string | null>(null);

  /** Garages proposés à la création : seuls les garages libres (RG-LOC-12). */
  protected readonly garages = rxResource({
    params: () => (this.location() === null ? {} : undefined),
    stream: () => this.garageApi.list({ page: 0, size: 100, filters: { statut: 'LIBRE' } }),
  });
  protected readonly freeGarages = computed(() => (this.garages.hasValue() ? this.garages.value().content : []));
  protected readonly noFreeGarage = computed(() => this.garages.hasValue() && this.freeGarages().length === 0);
  protected readonly keysMax = computed(
    () => this.freeGarages().find((garage) => garage.id === this.garageId())?.nbClesDisponibles ?? null,
  );

  /** Clés disponibles, réserve et loyer du garage choisi à la date de début (RG-LOC-14). */
  protected readonly conditions = rxResource({
    params: () => {
      const garageId = this.garageId();
      return this.location() === null && garageId !== null ? { garageId, dateDebut: this.dateDebut() } : undefined;
    },
    stream: ({ params }) => this.api.conditions(params.garageId, params.dateDebut),
  });

  constructor() {
    // Le premier garage libre est proposé tant que l'utilisateur n'a pas choisi (RG-LOC-14).
    effect(() => {
      const first = this.freeGarages()[0];
      const control = this.form.controls.garageId;
      if (first && control.value === null && control.pristine) {
        control.setValue(first.id);
      }
    });
  }

  protected get isCreation(): boolean {
    return this.location() === null;
  }

  /** La date de fin est réservée aux locations actives (RG-LOC-22). */
  protected get hasEndDate(): boolean {
    return this.location()?.statut === 'ACTIVE';
  }

  protected titleKey(): string {
    if (this.isCreation) {
      return 'locations.form.titreNouvelle';
    }
    return this.readOnly() ? 'locations.form.titreVisualiser' : 'locations.form.titreModifier';
  }

  protected tenantName(): string {
    const locataire = this.location()?.locataire;
    return locataire ? `${locataire.prenom} ${locataire.nom}` : '';
  }

  protected money(amount: number): string {
    return formatCurrency(amount, 'fr', '€', 'EUR', '1.2-2');
  }

  ngOnInit(): void {
    const location = this.location();
    if (location) {
      this.form.patchValue({
        locataireId: location.locataire.id,
        garageId: location.garage.id,
        dateDebut: location.dateDebut,
        dateFin: location.dateFin,
        nbClesRemises: location.nbClesRemises,
      });
      // Le locataire et le garage ne changent pas (RG-LOC-20).
      this.form.controls.locataireId.disable();
      this.form.controls.garageId.disable();
    } else {
      this.form.controls.dateDebut.setValue(dateToIso(this.today()));
      this.dateDebut.set(this.form.controls.dateDebut.value);
    }
    if (this.readOnly()) {
      this.form.disable();
    }

    this.form.controls.dateDebut.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.dateDebut.set(value));
    this.form.controls.garageId.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((id) => {
      this.garageId.set(id);
      // Les clés remises reviennent au maximum à chaque changement de garage (RG-LOC-14).
      const garage = this.freeGarages().find((candidate) => candidate.id === id);
      if (garage && this.isCreation) {
        this.form.controls.nbClesRemises.setValue(garage.nbClesDisponibles);
      }
    });
  }

  protected submit(): void {
    this.error.set(null);
    this.fieldErrors.set({});
    if (this.form.invalid || this.pending()) {
      return;
    }
    const value = this.form.getRawValue();
    const location = this.location();
    const request = location
      ? this.api.update(location.id, {
          dateDebut: value.dateDebut!,
          nbClesRemises: value.nbClesRemises!,
          dateFin: this.hasEndDate ? value.dateFin : null,
        })
      : this.api.create({
          locataireId: value.locataireId!,
          garageId: value.garageId!,
          dateDebut: value.dateDebut!,
          nbClesRemises: value.nbClesRemises!,
        });

    this.pending.set(true);
    request.pipe(finalize(() => this.pending.set(false))).subscribe({
      next: (saved) => this.saved.emit(saved),
      error: (err: unknown) => {
        const apiError = toApiError(err);
        this.fieldErrors.set(this.errors.fields(apiError));
        this.error.set(Object.keys(apiError.fieldErrors).length > 0 ? null : this.errors.text(apiError));
      },
    });
  }
}
