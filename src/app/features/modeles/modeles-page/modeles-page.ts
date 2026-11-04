import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { toApiError } from '../../../core/api/api-error';
import { ErrorMessageService } from '../../../core/api/error-message-service';
import { RightsService } from '../../../core/rights/rights-service';
import { ToastService } from '../../../shared/toast/toast';
import { ParametresApi } from '../../parametres/parametres-api';
import { ParametreDTO } from '../../parametres/parametres.models';
import { ModeleForm } from '../modele-form/modele-form';
import { MODELES, ModeleDef, SIGNATURE } from '../modeles';

/**
 * Modèles de messages (RG chapitre 15, maquette « Modèles de messages ») : avis de loyer, relance d'impayé total et
 * de paiement partiel (objet affiché, « Modifier » ouvre la fenêtre), puis la formule de politesse et la signature
 * reprises en bas de chaque message.
 */
@Component({
  selector: 'app-modeles-page',
  imports: [TranslatePipe, ModeleForm],
  templateUrl: './modeles-page.html',
  styleUrl: './modeles-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModelesPage {
  private readonly api = inject(ParametresApi);
  private readonly errors = inject(ErrorMessageService);
  private readonly translate = inject(TranslateService);
  private readonly toasts = inject(ToastService);
  private readonly rights = inject(RightsService);

  protected readonly modeles = MODELES;
  protected readonly signature = SIGNATURE;
  protected readonly canEdit = computed(() => this.rights.can('TPL', 'm'));

  protected readonly data = rxResource({ stream: () => this.api.modeles() });
  protected readonly values = computed<Record<string, string>>(() =>
    Object.fromEntries((this.data.hasValue() ? this.data.value() : []).map((p) => [p.cle, p.valeur ?? ''])),
  );
  protected readonly loadError = computed(() => {
    const error = this.data.error();
    return error ? this.errors.text(toApiError(error)) : null;
  });

  protected readonly editing = signal<ModeleDef | null>(null);

  protected subject(modele: ModeleDef): string {
    return modele.objet ? (this.values()[modele.objet] ?? '') : '';
  }

  protected saved(result: ParametreDTO[]): void {
    const modele = this.editing();
    this.editing.set(null);
    this.data.update((current) => (current ? current.map((p) => result.find((r) => r.cle === p.cle) ?? p) : result));
    this.toasts.show(this.translate.instant(modele?.key === 'signature' ? 'modeles.signatureEnregistree' : 'modeles.enregistre'));
  }
}
