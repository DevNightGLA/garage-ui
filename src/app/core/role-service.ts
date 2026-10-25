import { Injectable, computed, inject } from '@angular/core';
import { AuthService } from './auth/auth-service';
import { Role } from './auth/auth.models';

/**
 * Droits d'affichage selon le rôle (RG-ROL, chapitre 4). Le front masque ou
 * désactive les actions ; le back reste l'autorité (403).
 */
@Injectable({ providedIn: 'root' })
export class RoleService {
  private readonly auth = inject(AuthService);

  readonly role = computed<Role | null>(() => this.auth.user()?.role ?? null);
  readonly isAdmin = computed(() => this.role() === 'ADMIN');
  readonly isReadOnly = computed(() => this.role() === 'LECTURE_SEULE');
  /** Créer, modifier, clôturer, payer, gérer les remarques et les loyers. */
  readonly canWrite = computed(() => this.role() === 'ADMIN' || this.role() === 'GESTIONNAIRE');
  /** Suppressions définitives et annulation d'un versement. */
  readonly canDelete = this.isAdmin;
}
