import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { toApiError } from '../../../core/api/api-error';
import { ErrorMessageService } from '../../../core/api/error-message-service';
import { LanguageService } from '../../../core/language-service';
import { TODAY } from '../../../core/today';
import { DateInput } from '../../../shared/date-input/date-input';
import { dateToIso } from '../../../shared/date-input/date-utils';
import { FormField } from '../../../shared/form-field/form-field';
import { Modal } from '../../../shared/modal/modal';
import { monthLabel } from '../../../shared/month-picker/month-utils';
import { PaiementApi } from '../paiement-api';
import { ModePaiement, PaiementDTO, TypePaiement } from '../paiement.models';

/**
 * Fenêtre « Payer en totalité » ou « Paiement partiel » (RG-PAI-20 à 23). Un paiement total verse le
 * reste dû ; un paiement partiel demande le montant reçu. Le contrôle « strictement inférieur au reste
 * dû » est celui de l'API : son message s'affiche dans la fenêtre sans la fermer.
 */
@Component({
  selector: 'app-paiement-form',
  imports: [ReactiveFormsModule, CurrencyPipe, TranslatePipe, Modal, FormField, DateInput],
  templateUrl: './paiement-form.html',
  styleUrl: './paiement-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaiementForm implements OnInit {
  readonly paiement = input.required<PaiementDTO>();
  /** Mois de la ligne, `yyyy-MM`. */
  readonly mois = input.required<string>();
  readonly type = input.required<TypePaiement>();
  readonly saved = output<PaiementDTO>();
  readonly closed = output<void>();

  private readonly api = inject(PaiementApi);
  private readonly errors = inject(ErrorMessageService);
  private readonly language = inject(LanguageService);
  private readonly today = inject(TODAY);

  protected readonly form = new FormGroup({
    montant: new FormControl<number | null>(null, Validators.required),
    modePaiement: new FormControl<ModePaiement>('VIREMENT', { nonNullable: true, validators: Validators.required }),
    datePaiement: new FormControl<string | null>(null, Validators.required),
  });
  protected readonly pending = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly fieldErrors = signal<Record<string, string>>({});

  protected readonly isPartial = computed(() => this.type() === 'PARTIEL');
  /** « Marie Dupont · G01 · Octobre 2026 » */
  protected readonly who = computed(() => {
    const { locataire, garage } = this.paiement();
    return `${locataire.prenom} ${locataire.nom} · ${garage.numero} · ${monthLabel(this.language.lang(), this.mois())}`;
  });

  ngOnInit(): void {
    this.form.controls.datePaiement.setValue(dateToIso(this.today()));
    // Le montant n'existe que pour un paiement partiel : un paiement total verse le reste dû.
    if (!this.isPartial()) {
      this.form.controls.montant.disable();
    }
  }

  protected submit(): void {
    this.error.set(null);
    this.fieldErrors.set({});
    if (this.form.invalid || this.pending()) {
      return;
    }
    const value = this.form.getRawValue();
    this.pending.set(true);
    this.api
      .pay({
        locationId: this.paiement().locationId,
        mois: this.mois(),
        type: this.type(),
        ...(this.isPartial() ? { montant: value.montant! } : {}),
        modePaiement: value.modePaiement,
        datePaiement: value.datePaiement!,
      })
      .pipe(finalize(() => this.pending.set(false)))
      .subscribe({
        next: (saved) => this.saved.emit(saved),
        error: (err: unknown) => {
          const apiError = toApiError(err);
          this.fieldErrors.set(this.errors.fields(apiError));
          this.error.set(Object.keys(apiError.fieldErrors).length > 0 ? null : this.errors.text(apiError));
        },
      });
  }
}
