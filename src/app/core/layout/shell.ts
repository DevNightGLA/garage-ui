import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { filter, map, startWith } from 'rxjs';
import { ChangePassword } from '../../features/auth/change-password/change-password';
import { Confirm } from '../../shared/confirm/confirm';
import { Tooltip } from '../../shared/tooltip/tooltip';
import { AuthService } from '../auth/auth-service';
import { STORAGE_KEYS, StorageService } from '../storage';
import { Viewport } from '../viewport';
import { LanguageSwitch } from './language-switch';
import { NavigationMemory } from './navigation-memory';
import { Sidebar } from './sidebar';

/** Cadre de l'application : menu latéral repliable, en-tête (titre, langue, rôle) et page courante. */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, TranslatePipe, Sidebar, LanguageSwitch, Tooltip, Confirm, ChangePassword],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'closeDrawer()' },
})
export class Shell {
  protected readonly auth = inject(AuthService);
  protected readonly viewport = inject(Viewport);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly storage = inject(StorageService);
  private readonly memory = inject(NavigationMemory);

  /** Ordinateur : menu replié en colonne d'icônes (état mémorisé). */
  protected readonly collapsed = signal(this.storage.local.get(STORAGE_KEYS.menuReplie) === '1');
  /** Tablette et smartphone : le menu est un tiroir qui recouvre la page. */
  protected readonly drawerOpen = signal(false);
  protected readonly passwordOpen = signal(false);
  protected readonly logoutAsked = signal(false);

  protected readonly rail = computed(() => this.viewport.isDesktop() && this.collapsed());
  protected readonly menuExpanded = computed(() =>
    this.viewport.isDesktop() ? !this.collapsed() : this.drawerOpen(),
  );

  /**
   * Clé de traduction du titre, lue dans `data.titleKey` de la route active. Pendant
   * l'activation d'une route enfant son `snapshot` n'existe pas encore : le titre
   * est relu à la fin de la navigation.
   */
  protected readonly titleKey = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      startWith(null),
      map(() => {
        let current = this.route;
        while (current.firstChild) {
          current = current.firstChild;
        }
        return (current.snapshot?.data['titleKey'] as string | undefined) ?? '';
      }),
    ),
    { initialValue: '' },
  );

  constructor() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.memory.remember(event.urlAfterRedirects);
        this.drawerOpen.set(false);
      });
    // Passer sur grand écran (rotation, redimensionnement) referme le tiroir.
    effect(() => {
      if (this.viewport.isDesktop()) {
        this.drawerOpen.set(false);
      }
    });
  }

  protected toggleMenu(): void {
    if (!this.viewport.isDesktop()) {
      this.drawerOpen.update((open) => !open);
      return;
    }
    this.collapsed.update((value) => !value);
    this.storage.local.set(STORAGE_KEYS.menuReplie, this.collapsed() ? '1' : '0');
  }

  protected closeDrawer(): void {
    this.drawerOpen.set(false);
  }

  protected logout(): void {
    this.logoutAsked.set(false);
    this.auth.logout();
    this.router.navigate(['/connexion'], { queryParams: { raison: 'deconnecte' } });
  }
}
