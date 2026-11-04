import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { filter, map, startWith } from 'rxjs';
import { Tooltip } from '../shared/tooltip/tooltip';
import { Utilisateur } from '../core/auth/auth.models';
import { RightsService } from '../core/rights/rights-service';
import { NAV, NavEntry, NavGroup, NavItem, isGroup, itemOfUrl } from './nav-items';

/** « marie.dupont » → « MD », « admin » → « AD ». */
export function initials(login: string): string {
  const parts = login.split(/[^A-Za-z0-9]+/).filter(Boolean);
  const letters = parts.length >= 2 ? parts[0][0] + parts[1][0] : (parts[0] ?? '').slice(0, 2);
  return letters.toUpperCase();
}

/** « Prénom Nom » ; le login si le compte n'a ni prénom ni nom. */
export function displayName(user: Utilisateur): string {
  return [user.prenom, user.nom].map((part) => part?.trim()).filter(Boolean).join(' ') || user.login;
}

/** Initiales du prénom et du nom, ou celles du login à défaut. */
export function userInitials(user: Utilisateur): string {
  const first = user.prenom?.trim().charAt(0) ?? '';
  const last = user.nom?.trim().charAt(0) ?? '';
  return first || last ? (first + last).toUpperCase() : initials(user.login);
}

/** Entrée du menu après filtrage : page seule, ou groupe avec ses pages visibles. */
export type VisibleEntry = { kind: 'item'; item: NavItem } | { kind: 'group'; group: NavGroup; children: NavItem[] };

/** Pages visibles pour ce profil et cet appareil ; un groupe sans page visible disparaît (RG-NAV-01, RG-APP-04). */
export function visibleEntries(entries: readonly NavEntry[], visible: (item: NavItem) => boolean): VisibleEntry[] {
  return entries.flatMap<VisibleEntry>((entry) => {
    if (isGroup(entry)) {
      const children = entry.children.filter(visible);
      return children.length > 0 ? [{ kind: 'group', group: entry, children }] : [];
    }
    return visible(entry) ? [{ kind: 'item', item: entry }] : [];
  });
}

/**
 * Menu latéral (maquette : composant Sidebar du design system et colonne d'icônes) : pages et groupes dépliables
 * filtrés par droits et appareil, utilisateur connecté, mot de passe et déconnexion.
 */
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

  private readonly rights = inject(RightsService);
  private readonly router = inject(Router);

  /** Groupes refermés par l'utilisateur ; tous sont ouverts au départ, comme dans la maquette. */
  private readonly closed = signal<ReadonlySet<string>>(new Set());

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url),
    ),
    { initialValue: '' },
  );
  private readonly activePath = computed(() => itemOfUrl(this.url())?.path ?? null);

  protected readonly entries = computed(() => visibleEntries(NAV, (item) => this.rights.visible(item.ecran)));

  protected readonly avatar = computed(() => {
    const current = this.user();
    return current ? userInitials(current) : '';
  });
  protected readonly name = computed(() => {
    const current = this.user();
    return current ? displayName(current) : '';
  });

  protected isOpen(group: NavGroup): boolean {
    return !this.closed().has(group.id);
  }

  /** Le groupe contient la page courante (en évidence quand il est refermé). */
  protected hasActive(children: readonly NavItem[]): boolean {
    return children.some((child) => child.path === this.activePath());
  }

  protected toggle(group: NavGroup): void {
    this.closed.update((current) => {
      const next = new Set(current);
      if (next.has(group.id)) {
        next.delete(group.id);
      } else {
        next.add(group.id);
      }
      return next;
    });
  }
}
