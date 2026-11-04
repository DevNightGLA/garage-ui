import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { map } from 'rxjs';
import { DeviceService } from '../core/device-service';
import { RightsService } from '../core/rights/rights-service';
import { NAV_ITEMS } from './nav-items';

const STYLES = `
  .info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-3);
    max-width: 560px;
    margin: var(--space-8) auto;
    padding: var(--space-10) var(--space-8);
    text-align: center;
  }
  .info__icon {
    width: 56px;
    height: 56px;
    border-radius: var(--radius-circle);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    color: var(--white);
    background: var(--gradient-dark);
  }
  .info__title {
    margin: 0;
    font-size: 19px;
    font-weight: 700;
    color: var(--text-heading);
  }
  .info__text {
    margin: 0;
    font-size: 14px;
    line-height: 1.6;
    color: var(--text-body);
  }
`;

/** Accès direct à un écran retiré pour cet appareil (RG-APP-04). */
@Component({
  selector: 'app-screen-unavailable',
  imports: [TranslatePipe],
  template: `
    <section class="card info" role="status">
      <span class="info__icon" aria-hidden="true"><i class="fa-solid fa-mobile-screen"></i></span>
      <h2 class="info__title">{{ labelKey() | translate }}</h2>
      <p class="info__text">
        {{ 'acces.indisponible' | translate: { appareil: ('acces.appareil.' + device.mode() | translate) } }}
      </p>
    </section>
  `,
  styles: STYLES,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScreenUnavailable {
  protected readonly device = inject(DeviceService);
  private readonly ecran = toSignal(inject(ActivatedRoute).queryParamMap.pipe(map((params) => params.get('ecran'))));
  protected readonly labelKey = computed(
    () => NAV_ITEMS.find((item) => item.ecran === this.ecran())?.labelKey ?? 'acces.titre',
  );
}

/** Profil sans aucun écran autorisé (« Le profil … n'a pas accès à cet écran », regles-de-gestion ch. 23). */
@Component({
  selector: 'app-access-denied',
  imports: [TranslatePipe],
  template: `
    <section class="card info" role="status">
      <span class="info__icon" aria-hidden="true"><i class="fa-solid fa-user-lock"></i></span>
      <h2 class="info__title">{{ 'acces.titre' | translate }}</h2>
      <p class="info__text">{{ 'acces.refuse' | translate: { profil: ('role.' + rights.profil() | translate) } }}</p>
    </section>
  `,
  styles: STYLES,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccessDenied {
  protected readonly rights = inject(RightsService);
}

/** Écran v2 inscrit au menu, pas encore construit (étape 3 de docs/TASKS.md). */
@Component({
  selector: 'app-screen-pending',
  imports: [TranslatePipe],
  template: `
    <section class="card info" role="status">
      <span class="info__icon" aria-hidden="true"><i class="fa-solid fa-person-digging"></i></span>
      <h2 class="info__title">{{ 'acces.enConstruction' | translate }}</h2>
    </section>
  `,
  styles: STYLES,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScreenPending {}
