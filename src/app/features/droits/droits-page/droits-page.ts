import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Observable, finalize, forkJoin, of } from 'rxjs';
import { toApiError } from '../../../core/api/api-error';
import { ErrorMessageService } from '../../../core/api/error-message-service';
import { ROLES, Role } from '../../../core/auth/auth.models';
import { LanguageService } from '../../../core/language-service';
import { RightsService } from '../../../core/rights/rights-service';
import { Action, Appareil, DroitAppareil, DroitProfil, Ecran } from '../../../core/rights/rights.models';
import { Segmented, SegmentedOption } from '../../../shared/segmented/segmented';
import { ToastService } from '../../../shared/toast/toast';
import { ToggleCell } from '../../../shared/toggle-cell/toggle-cell';
import { PROFILS } from '../../utilisateurs/utilisateur.models';
import { DroitsApi } from '../droits-api';

export type DroitsTab = 'ecrans' | 'actions' | 'appareils';
type Flag = 'peutVoir' | 'peutAjouter' | 'peutModifier' | 'peutSupprimer';

/** Écrans réservés à l'Admin : non attribuables (RG-DRO-02). */
const ADMIN_ONLY: readonly Ecran[] = ['AUD', 'MNT'];
const FLAGS: Record<Action, Flag> = { v: 'peutVoir', a: 'peutAjouter', m: 'peutModifier', d: 'peutSupprimer' };
const PROPOSED: Record<Exclude<Action, 'v'>, 'ajoutPropose' | 'modificationProposee' | 'suppressionProposee'> = {
  a: 'ajoutPropose',
  m: 'modificationProposee',
  d: 'suppressionProposee',
};
const DEVICES: readonly Appareil[] = ['ORDINATEUR', 'TABLETTE', 'SMARTPHONE'];
const DEVICE_ICONS: Record<Appareil, string> = { ORDINATEUR: 'fa-desktop', TABLETTE: 'fa-tablet-screen-button', SMARTPHONE: 'fa-mobile-screen-button' };
/** Écran toujours disponible sur tous les appareils (RG-APP-02). */
const ALWAYS_ON_DEVICE: Ecran = 'DRO';

const rowKey = (profil: Role, ecran: Ecran) => `${profil}|${ecran}`;
const deviceKey = (appareil: Appareil, ecran: Ecran) => `${appareil}|${ecran}`;

/**
 * Droits d'accès (RG-DRO-10 à 14, RG-APP-02 à 04, maquette « Gestion des utilisateurs ») : « Accès aux écrans »
 * (profils × écrans), « Actions autorisées » (un profil, quatre actions), « Accès selon l'appareil » (Admin).
 * Navigation par section. Les changements restent en brouillon (pastille orange, compteur) jusqu'à « Enregistrer ».
 * Colonne Admin et écrans réservés verrouillés ; Droits d'accès toujours disponible sur tous les appareils.
 */
@Component({
  selector: 'app-droits-page',
  imports: [TranslatePipe, Segmented, ToggleCell],
  templateUrl: './droits-page.html',
  styleUrl: './droits-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DroitsPage {
  private readonly api = inject(DroitsApi);
  private readonly rights = inject(RightsService);
  private readonly errors = inject(ErrorMessageService);
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);
  private readonly toasts = inject(ToastService);

  protected readonly roles = ROLES;
  protected readonly devices = DEVICES;
  protected readonly deviceIcons = DEVICE_ICONS;
  protected readonly profils = PROFILS;
  protected readonly actions: readonly Action[] = ['v', 'a', 'm', 'd'];

  protected readonly canEdit = computed(() => this.rights.can('DRO', 'm'));
  protected readonly isAdmin = computed(() => this.rights.profil() === 'ADMIN');
  protected readonly tab = signal<DroitsTab>('ecrans');
  protected readonly profil = signal<Role>('GESTIONNAIRE');
  private readonly selectedSection = signal<string | null>(null);

  protected readonly grid = rxResource({ stream: () => this.api.profils() });
  protected readonly deviceGrid = rxResource({
    params: () => (this.isAdmin() ? true : undefined),
    stream: () => this.api.appareils(),
  });
  protected readonly loadError = computed(() => {
    const error = this.grid.error() ?? this.deviceGrid.error();
    return error ? this.errors.text(toApiError(error)) : null;
  });

  /** Brouillons : lignes modifiées, par clé. */
  private readonly draft = signal<ReadonlyMap<string, DroitProfil>>(new Map());
  private readonly deviceDraft = signal<ReadonlyMap<string, boolean>>(new Map());
  protected readonly saving = signal(false);
  protected readonly saveError = signal<string | null>(null);

  private readonly saved = computed(() => {
    const map = new Map<string, DroitProfil>();
    for (const row of this.grid.hasValue() ? this.grid.value() : []) {
      map.set(rowKey(row.profil, row.ecran), row);
    }
    return map;
  });
  private readonly savedDevices = computed(() => {
    const map = new Map<string, boolean>();
    for (const line of this.deviceGrid.hasValue() ? this.deviceGrid.value() : []) {
      map.set(deviceKey(line.appareil, line.ecran), line.autorise);
    }
    return map;
  });

  /** Écrans dans l'ordre de l'API, avec leur section. */
  protected readonly screens = computed(() => {
    const seen = new Map<Ecran, DroitProfil>();
    for (const row of this.grid.hasValue() ? this.grid.value() : []) {
      if (!seen.has(row.ecran)) {
        seen.set(row.ecran, row);
      }
    }
    return [...seen.values()];
  });
  protected readonly sections = computed(() => [...new Set(this.screens().map((s) => s.section))]);
  protected readonly section = computed(() => {
    const wanted = this.selectedSection();
    const sections = this.sections();
    return wanted && sections.includes(wanted) ? wanted : (sections[0] ?? null);
  });
  protected readonly sectionScreens = computed(() => this.screens().filter((s) => s.section === this.section()));

  protected readonly tabOptions = computed<SegmentedOption<DroitsTab>[]>(() => {
    this.language.lang();
    const tabs: DroitsTab[] = this.isAdmin() ? ['ecrans', 'actions', 'appareils'] : ['ecrans', 'actions'];
    return tabs.map((value) => ({ value, label: this.translate.instant(`droits.onglet.${value}`) }));
  });
  protected readonly profilOptions = computed<SegmentedOption<Role>[]>(() => {
    this.language.lang();
    return ROLES.map((value) => ({ value, label: this.translate.instant(`role.${value}`) }));
  });

  /** Nombre de modifications : un accès changé compte pour un, sinon chaque action changée (maquette). */
  private changesOf(key: string): number {
    const draft = this.draft().get(key);
    const saved = this.saved().get(key);
    if (!draft || !saved) {
      return 0;
    }
    if (draft.peutVoir !== saved.peutVoir) {
      return 1;
    }
    return (['peutAjouter', 'peutModifier', 'peutSupprimer'] as const).filter((flag) => draft[flag] !== saved[flag]).length;
  }
  protected readonly changeCount = computed(() => {
    let count = 0;
    for (const key of this.draft().keys()) {
      count += this.changesOf(key);
    }
    for (const [key, value] of this.deviceDraft()) {
      count += value !== (this.savedDevices().get(key) ?? true) ? 1 : 0;
    }
    return count;
  });
  protected sectionChanges(section: string): number {
    const ecrans = new Set(this.screens().filter((s) => s.section === section).map((s) => s.ecran));
    let count = 0;
    for (const key of this.draft().keys()) {
      if (ecrans.has(key.split('|')[1] as Ecran)) {
        count += this.changesOf(key);
      }
    }
    for (const [key, value] of this.deviceDraft()) {
      if (ecrans.has(key.split('|')[1] as Ecran) && value !== (this.savedDevices().get(key) ?? true)) {
        count++;
      }
    }
    return count;
  }

  // --- Lecture ---

  protected row(profil: Role, ecran: Ecran): DroitProfil | null {
    const key = rowKey(profil, ecran);
    return this.draft().get(key) ?? this.saved().get(key) ?? null;
  }

  protected has(profil: Role, ecran: Ecran, action: Action): boolean {
    return this.row(profil, ecran)?.[FLAGS[action]] ?? false;
  }

  protected proposed(screen: DroitProfil, action: Action): boolean {
    return action === 'v' || screen[PROPOSED[action]];
  }

  protected changed(profil: Role, ecran: Ecran, action: Action): boolean {
    const key = rowKey(profil, ecran);
    const draft = this.draft().get(key);
    const saved = this.saved().get(key);
    return !!draft && !!saved && draft[FLAGS[action]] !== saved[FLAGS[action]];
  }

  /** Colonne Admin, écrans réservés, ou consultation seule. */
  protected locked(profil: Role, ecran: Ecran): boolean {
    return profil === 'ADMIN' || ADMIN_ONLY.includes(ecran) || !this.canEdit();
  }

  protected screenCount(profil: Role): number {
    return this.screens().filter((s) => this.has(profil, s.ecran, 'v')).length;
  }

  protected device(appareil: Appareil, ecran: Ecran): boolean {
    if (appareil === 'ORDINATEUR' || ecran === ALWAYS_ON_DEVICE) {
      return true;
    }
    const key = deviceKey(appareil, ecran);
    return this.deviceDraft().get(key) ?? this.savedDevices().get(key) ?? true;
  }

  protected deviceChanged(appareil: Appareil, ecran: Ecran): boolean {
    const key = deviceKey(appareil, ecran);
    const value = this.deviceDraft().get(key);
    return value !== undefined && value !== (this.savedDevices().get(key) ?? true);
  }

  protected deviceLocked(appareil: Appareil, ecran: Ecran): boolean {
    return appareil === 'ORDINATEUR' || ecran === ALWAYS_ON_DEVICE || !this.canEdit();
  }

  protected deviceCount(appareil: Appareil): number {
    return this.screens().filter((s) => this.device(appareil, s.ecran)).length;
  }

  // --- Libellés ---

  protected screenLabel(screen: DroitProfil): string {
    this.language.lang();
    const key = `droits.ecran.${screen.ecran}`;
    const text = this.translate.instant(key);
    return text === key ? screen.libelle : text;
  }

  protected sectionLabel(section: string): string {
    this.language.lang();
    const key = `droits.section.${section}`;
    const text = this.translate.instant(key);
    return text === key ? section : text;
  }

  /** Libellé d'une action sous la case (« Créer un garage »), ou « Consulter l'écran ». */
  protected actionLabel(screen: DroitProfil, action: Action): string {
    this.language.lang();
    if (action === 'v') {
      return this.translate.instant(this.profil() === 'LOCATAIRE' ? 'droits.consulterDonnees' : 'droits.consulterEcran');
    }
    return this.translate.instant(`droits.libelleAction.${screen.ecran}.${action}`);
  }

  /** Nom accessible et raison d'un verrou. */
  protected cellLabel(profil: Role, screen: DroitProfil, action: Action): string {
    this.language.lang();
    const name = `${this.translate.instant(`role.${profil}`)} · ${this.screenLabel(screen)}`;
    const on = this.has(profil, screen.ecran, action);
    const verb =
      action === 'v'
        ? this.translate.instant(on ? 'droits.retirerAcces' : 'droits.autoriserAcces')
        : `${this.translate.instant(on ? 'droits.retirer' : 'droits.autoriser')} ${this.actionLabel(screen, action)}`;
    return `${verb} · ${name}`;
  }

  protected lockReason(profil: Role, screen: DroitProfil, action: Action): string | null {
    if (profil === 'ADMIN') {
      return this.translate.instant('droits.verrou.admin');
    }
    if (ADMIN_ONLY.includes(screen.ecran)) {
      return this.translate.instant('droits.verrou.reserve');
    }
    if (action !== 'v' && !this.has(profil, screen.ecran, 'v')) {
      return this.translate.instant('droits.verrou.accesRequis');
    }
    return null;
  }

  protected deviceLabel(appareil: Appareil, screen: DroitProfil): string {
    this.language.lang();
    if (appareil === 'ORDINATEUR') {
      return this.translate.instant('droits.verrou.ordinateur');
    }
    if (screen.ecran === ALWAYS_ON_DEVICE) {
      return this.translate.instant('droits.verrou.droitsToujours');
    }
    const on = this.device(appareil, screen.ecran);
    return `${this.translate.instant(on ? 'droits.retirerAcces' : 'droits.autoriserAcces')} · ${this.translate.instant(`droits.appareil.${appareil}`)} · ${this.screenLabel(screen)}`;
  }

  // --- Modifications ---

  protected setTab(tab: DroitsTab): void {
    this.tab.set(tab);
  }

  protected setSection(section: string): void {
    this.selectedSection.set(section);
  }

  protected toggle(profil: Role, screen: DroitProfil, action: Action): void {
    if (this.locked(profil, screen.ecran) || (action !== 'v' && !this.has(profil, screen.ecran, 'v'))) {
      return;
    }
    const key = rowKey(profil, screen.ecran);
    const current = this.row(profil, screen.ecran);
    const saved = this.saved().get(key);
    if (!current || !saved) {
      return;
    }
    const flag = FLAGS[action];
    const next = { ...current, [flag]: !current[flag] };
    this.draft.update((draft) => {
      const map = new Map(draft);
      const same = (Object.values(FLAGS) as Flag[]).every((f) => next[f] === saved[f]);
      if (same) {
        map.delete(key);
      } else {
        map.set(key, next);
      }
      return map;
    });
  }

  protected toggleDevice(appareil: Appareil, ecran: Ecran): void {
    if (this.deviceLocked(appareil, ecran)) {
      return;
    }
    const key = deviceKey(appareil, ecran);
    const next = !this.device(appareil, ecran);
    this.deviceDraft.update((draft) => {
      const map = new Map(draft);
      if (next === (this.savedDevices().get(key) ?? true)) {
        map.delete(key);
      } else {
        map.set(key, next);
      }
      return map;
    });
  }

  protected cancel(): void {
    this.draft.set(new Map());
    this.deviceDraft.set(new Map());
    this.saveError.set(null);
  }

  protected save(): void {
    if (this.changeCount() === 0 || this.saving()) {
      return;
    }
    // Sans accès, les actions sont retirées (le back fait de même).
    const lignes = [...this.draft().values()].map((row) =>
      row.peutVoir ? row : { ...row, peutAjouter: false, peutModifier: false, peutSupprimer: false },
    );
    const appareils: DroitAppareil[] = [...this.deviceDraft()].map(([key, autorise]) => {
      const [appareil, ecran] = key.split('|') as [DroitAppareil['appareil'], Ecran];
      return { appareil, ecran, autorise };
    });
    const requests: Observable<unknown>[] = [
      lignes.length ? this.api.saveProfils(lignes) : of(null),
      appareils.length ? this.api.saveAppareils(appareils) : of(null),
    ];
    this.saving.set(true);
    this.saveError.set(null);
    forkJoin(requests)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: ([grid, devices]) => {
          if (grid) {
            this.grid.set(grid as DroitProfil[]);
          }
          if (devices) {
            this.deviceGrid.set(devices as DroitAppareil[]);
          }
          this.draft.set(new Map());
          this.deviceDraft.set(new Map());
          this.toasts.show(this.translate.instant('droits.enregistres'));
          // Le menu et les boutons du compte connecté suivent les nouveaux droits.
          this.rights.load().subscribe();
        },
        error: (err: unknown) => this.saveError.set(this.errors.text(toApiError(err))),
      });
  }
}
