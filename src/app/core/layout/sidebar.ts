import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Tooltip } from '../../shared/tooltip/tooltip';
import { Utilisateur } from '../auth/auth.models';
import { NAV_ITEMS } from './nav-items';

/** « marie.dupont » → « MD », « admin » → « AD ». */
export function initials(login: string): string {
  const parts = login.split(/[^A-Za-z0-9]+/).filter(Boolean);
  const letters = parts.length >= 2 ? parts[0][0] + parts[1][0] : (parts[0] ?? '').slice(0, 2);
  return letters.toUpperCase();
}

/** Menu latéral repliable : navigation, utilisateur connecté, mot de passe et déconnexion. */
@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, TranslatePipe, Tooltip],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'complementary', '[class.is-collapsed]': 'collapsed()', '[class.is-open]': 'open()' },
})
export class Sidebar {
  /** Ordinateur : colonne d'icônes. */
  readonly collapsed = input(false);
  /** Tablette et smartphone : tiroir ouvert. Sans effet sur ordinateur, où le menu est toujours visible. */
  readonly open = input(false);
  readonly user = input<Utilisateur | null>(null);
  readonly changePassword = output<void>();
  readonly logout = output<void>();

  protected readonly items = NAV_ITEMS;
  protected readonly avatar = computed(() => initials(this.user()?.login ?? ''));
}
