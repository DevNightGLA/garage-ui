import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';
import { toApiError } from '../../../core/api/api-error';
import { ErrorMessageService } from '../../../core/api/error-message-service';
import { isoToDisplay } from '../../../shared/date-input/date-utils';
import { Modal } from '../../../shared/modal/modal';
import { Pagination } from '../../../shared/pagination/pagination';
import { BadgeTone, StatusBadge } from '../../../shared/status-badge/status-badge';
import { LocationApi } from '../../locations/location-api';
import { LocationDTO, LocationStatut } from '../../locations/location.models';
import { GarageDTO } from '../garage.models';

/** RG-LST-01 : 5 lignes par page dans les historiques. */
export const LOCATIONS_HISTORY_PAGE_SIZE = 5;

const STATUT_TONE: Record<LocationStatut, BadgeTone> = {
  ACTIVE: 'success',
  A_VENIR: 'info',
  TERMINEE: 'ancien',
};

/**
 * Historique des locations d'un garage (RG-GAR-43) : locataire, début, fin, clés, loyer, statut.
 * L'API les renvoie du plus récent au plus ancien ; le statut est celui qu'elle calcule.
 */
@Component({
  selector: 'app-locations-history',
  imports: [CurrencyPipe, TranslatePipe, Modal, Pagination, StatusBadge],
  templateUrl: './locations-history.html',
  styleUrls: ['../loyers-history/loyers-history.scss', './locations-history.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocationsHistory {
  readonly garage = input.required<GarageDTO>();
  readonly closed = output<void>();

  private readonly api = inject(LocationApi);
  private readonly errors = inject(ErrorMessageService);

  protected readonly pageSize = LOCATIONS_HISTORY_PAGE_SIZE;
  protected readonly page = signal(0);

  protected readonly list = rxResource({
    params: () => ({ id: this.garage().id, page: this.page() }),
    stream: ({ params }) => this.api.listForGarage(params.id, { page: params.page, size: LOCATIONS_HISTORY_PAGE_SIZE }),
  });
  protected readonly rows = computed(() => (this.list.hasValue() ? this.list.value().content : []));
  protected readonly total = computed(() => (this.list.hasValue() ? this.list.value().totalElements : 0));
  protected readonly loadError = computed(() => {
    const error = this.list.error();
    return error ? this.errors.text(toApiError(error)) : null;
  });

  protected tone(statut: LocationStatut): BadgeTone {
    return STATUT_TONE[statut];
  }

  protected initials(location: LocationDTO): string {
    return `${location.locataire.prenom.charAt(0)}${location.locataire.nom.charAt(0)}`.toUpperCase();
  }

  protected date(iso: string | null): string {
    return isoToDisplay(iso);
  }
}
