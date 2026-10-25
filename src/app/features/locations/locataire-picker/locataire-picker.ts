import { ChangeDetectionStrategy, Component, DestroyRef, computed, forwardRef, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { toApiError } from '../../../core/api/api-error';
import { ErrorMessageService } from '../../../core/api/error-message-service';
import { Pagination } from '../../../shared/pagination/pagination';
import { SEARCH_DEBOUNCE_MS } from '../../../shared/search-input/search-input';
import { LocataireApi } from '../../locataires/locataire-api';
import { LocataireDTO } from '../../locataires/locataire.models';

/** RG-LST-01 : 5 locataires par page dans la liste de choix. */
export const PICKER_PAGE_SIZE = 5;

/**
 * Choix du locataire d'une location (RG-LOC-11) : recherche par nom ou prénom, liste triée par
 * nom, 5 par page, statut de chaque locataire. Tout locataire peut être choisi. La valeur du
 * formulaire est l'identifiant du locataire, `null` tant qu'aucun n'est choisi ; saisir de
 * nouveau dans le champ annule le choix.
 */
@Component({
  selector: 'app-locataire-picker',
  imports: [TranslatePipe, Pagination],
  templateUrl: './locataire-picker.html',
  styleUrl: './locataire-picker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => LocatairePicker), multi: true }],
})
export class LocatairePicker implements ControlValueAccessor {
  private readonly api = inject(LocataireApi);
  private readonly errors = inject(ErrorMessageService);

  protected readonly pageSize = PICKER_PAGE_SIZE;
  protected readonly text = signal('');
  protected readonly query = signal('');
  protected readonly page = signal(0);
  protected readonly selectedId = signal<number | null>(null);
  protected readonly disabled = signal(false);

  protected readonly list = rxResource({
    params: () => ({ page: this.page(), q: this.query() }),
    stream: ({ params }) => this.api.list({ page: params.page, size: PICKER_PAGE_SIZE, q: params.q }),
  });
  protected readonly rows = computed(() => (this.list.hasValue() ? this.list.value().content : []));
  protected readonly total = computed(() => (this.list.hasValue() ? this.list.value().totalElements : 0));
  protected readonly loadError = computed(() => {
    const error = this.list.error();
    return error ? this.errors.text(toApiError(error)) : null;
  });

  private timer: ReturnType<typeof setTimeout> | undefined;
  private onChange: (value: number | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }

  writeValue(id: number | null): void {
    this.selectedId.set(id ?? null);
    if (id === null || id === undefined) {
      this.text.set('');
    }
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled.set(disabled);
  }

  protected fullName(locataire: LocataireDTO): string {
    return `${locataire.nom.toUpperCase()} ${locataire.prenom}`;
  }

  /** La recherche part après une courte pause ; saisir annule le locataire choisi. */
  protected typed(value: string): void {
    this.text.set(value);
    if (this.selectedId() !== null) {
      this.selectedId.set(null);
      this.onChange(null);
    }
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.query.set(value);
      this.page.set(0);
    }, SEARCH_DEBOUNCE_MS);
  }

  /** Entrée lance la recherche tout de suite, sans valider le formulaire de la location. */
  protected submit(event: Event, value: string): void {
    event.preventDefault();
    clearTimeout(this.timer);
    this.query.set(value);
    this.page.set(0);
  }

  protected pick(locataire: LocataireDTO): void {
    if (this.disabled()) {
      return;
    }
    this.selectedId.set(locataire.id);
    this.text.set(this.fullName(locataire));
    this.onChange(locataire.id);
    this.onTouched();
  }

  protected touched(): void {
    this.onTouched();
  }
}
