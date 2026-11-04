import { Signal, computed, inject } from '@angular/core';
import { RightsService } from './rights-service';
import { Ecran } from './rights.models';

/** Droits d'un écran, sous forme de signaux pour les gabarits. */
export interface ScreenRights {
  readonly canAdd: Signal<boolean>;
  readonly canEdit: Signal<boolean>;
  readonly canDelete: Signal<boolean>;
  /** Sans droit « modifier », les fenêtres s'ouvrent en consultation, « Visualiser … » (RG-VAL-05). */
  readonly isReadOnly: Signal<boolean>;
}

/** À appeler dans un contexte d'injection (champ d'un composant) : `droits = screenRights('GAR')`. */
export function screenRights(ecran: Ecran): ScreenRights {
  const rights = inject(RightsService);
  const canEdit = computed(() => rights.can(ecran, 'm'));
  return {
    canAdd: computed(() => rights.can(ecran, 'a')),
    canEdit,
    canDelete: computed(() => rights.can(ecran, 'd')),
    isReadOnly: computed(() => !canEdit()),
  };
}
