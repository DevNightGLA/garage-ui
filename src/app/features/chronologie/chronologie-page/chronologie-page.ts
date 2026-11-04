import { formatCurrency } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { map } from 'rxjs';
import { toApiError } from '../../../core/api/api-error';
import { ErrorMessageService } from '../../../core/api/error-message-service';
import { LanguageService } from '../../../core/language-service';
import { isoToDisplay } from '../../../shared/date-input/date-utils';
import { FilterButtons, FilterOption } from '../../../shared/filter-buttons/filter-buttons';
import { PickList } from '../../../shared/pick-list/pick-list';
import { SearchInput } from '../../../shared/search-input/search-input';
import { StatTile, StatTiles } from '../../../shared/stat-tiles/stat-tiles';
import { Timeline, TimelineItem } from '../../../shared/timeline/timeline';
import { LocataireApi } from '../../locataires/locataire-api';
import { LocataireDTO } from '../../locataires/locataire.models';
import { LOCATAIRE_BADGE_TONE, locataireBadgeKey, locataireInitials } from '../../locataires/locataire-status';
import { ChronologieApi } from '../chronologie-api';
import { Chronologie, ChronologieFiltre, Evenement } from '../chronologie.models';

/** Événements chargés à la fois (« Afficher plus » par lots de 10, RG-CHR-03). */
export const EVENTS_BATCH = 10;
const ALL_TENANTS = 100;

/** Dégradés de la maquette (pastilles et étiquette de solde). */
const GRADIENT = {
  success: 'linear-gradient(310deg, #0c7a25, #62bd1d)',
  danger: 'linear-gradient(310deg, #d40505, #f2566f)',
  warning: 'linear-gradient(310deg, #f53939, #fbcf33)',
  info: 'linear-gradient(310deg, #2152ff, #21d4fd)',
  dark: 'linear-gradient(310deg, #141727, #3a416f)',
  ancien: 'linear-gradient(310deg, #626753, #7f846f)',
  ancienLight: 'linear-gradient(310deg, #8f9482, #a9ae9a)',
  primary: 'linear-gradient(310deg, #7928ca, #ff0080)',
} as const;

/** Solde ou statut → dégradé de l'étiquette d'en-tête. */
const SOLDE_GRADIENT: Record<string, string> = {
  A_JOUR: GRADIENT.success,
  ACTUEL: GRADIENT.success,
  EN_RETARD: GRADIENT.danger,
  A_VENIR: GRADIENT.info,
  ANCIEN: GRADIENT.ancien,
  SANS_LOCATION: GRADIENT.warning,
};

/**
 * Chronologie d'un locataire (RG-CHR-01 à 03) : liste des locataires à gauche (Actifs / Tous, recherche,
 * actuels d'abord puis nom), en-tête et indicateurs, puis les événements filtrés. Le locataire choisi est dans
 * l'adresse (`?locataire=id`) ; les événements viennent du back (`GET /api/locataires/{id}/chronologie`).
 */
@Component({
  selector: 'app-chronologie-page',
  imports: [TranslatePipe, PickList, SearchInput, FilterButtons, StatTiles, Timeline],
  templateUrl: './chronologie-page.html',
  styleUrl: './chronologie-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChronologiePage {
  private readonly locataires = inject(LocataireApi);
  private readonly api = inject(ChronologieApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly errors = inject(ErrorMessageService);
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);

  protected readonly actifs = signal<'ACTUEL' | 'TOUS'>('ACTUEL');
  protected readonly search = signal('');
  protected readonly filtre = signal<ChronologieFiltre>('TOUS');
  protected readonly shown = signal(EVENTS_BATCH);

  protected readonly tenants = rxResource({
    params: () => ({ statut: this.actifs(), q: this.search() }),
    stream: ({ params }) =>
      this.locataires.list({
        page: 0,
        size: ALL_TENANTS,
        q: params.q,
        sort: [{ key: 'locataire', dir: 'asc' }],
        filters: { statut: params.statut === 'TOUS' ? null : params.statut },
      }),
  });
  protected readonly counters = rxResource({
    params: () => this.search(),
    stream: ({ params }) => this.locataires.counters(params),
  });
  /** Locataires actuels d'abord, puis par nom (RG-CHR-01) : l'ordre par nom vient de l'API. */
  protected readonly items = computed(() => {
    const content = this.tenants.hasValue() ? this.tenants.value().content : [];
    return [...content.filter((l) => l.statut === 'ACTUEL'), ...content.filter((l) => l.statut !== 'ACTUEL')];
  });

  private readonly requested = toSignal(
    this.route.queryParamMap.pipe(map((params) => Number(params.get('locataire')) || null)),
    { initialValue: null },
  );
  protected readonly selectedId = computed(() => {
    const items = this.items();
    const requested = this.requested();
    if (requested !== null) {
      return requested;
    }
    return items[0]?.id ?? null;
  });

  protected readonly chronologie = rxResource({
    params: () => {
      const id = this.selectedId();
      return id === null ? undefined : { id, filtre: this.filtre(), size: this.shown() };
    },
    stream: ({ params }) => this.api.get(params.id, params.filtre, params.size),
  });
  /** Dernière réponse : gardée pendant le chargement du lot suivant, pour que la page ne clignote pas. */
  protected readonly data = signal<Chronologie | null>(null);
  protected readonly loadError = computed(() => {
    const error = this.chronologie.error() ?? this.tenants.error();
    return error ? this.errors.text(toApiError(error)) : null;
  });

  constructor() {
    effect(() => {
      if (this.chronologie.hasValue()) {
        this.data.set(this.chronologie.value());
      }
    });
    // Un autre locataire repart sur « Tous » et le premier lot (maquette).
    let previous: number | null = null;
    effect(() => {
      const id = this.selectedId();
      if (id !== previous) {
        previous = id;
        this.filtre.set('TOUS');
        this.shown.set(EVENTS_BATCH);
      }
    });
  }

  protected readonly switchOptions = computed<FilterOption<'ACTUEL' | 'TOUS'>[]>(() => {
    const counters = this.counters.hasValue() ? this.counters.value() : null;
    return [
      { value: 'ACTUEL', label: 'chronologie.actifs', count: counters ? counters.ACTUEL : null },
      { value: 'TOUS', label: 'chronologie.tous', count: counters ? counters.TOUS : null },
    ];
  });

  protected readonly filterOptions = computed<FilterOption<ChronologieFiltre>[]>(() => {
    const counters = this.data()?.compteurs ?? null;
    return (['TOUS', 'LOCATIONS', 'REMARQUES', 'PAIEMENTS'] as const).map((value) => ({
      value,
      label: `chronologie.filtre.${value}`,
      count: counters ? counters[value] : null,
    }));
  });

  protected readonly head = computed(() => {
    this.language.lang();
    const data = this.data();
    if (!data) {
      return null;
    }
    const l = data.locataire;
    const key = locataireBadgeKey(l);
    const civilite = l.civilite ? this.translate.instant(`locataires.civilite.${l.civilite}`) + ' ' : '';
    return {
      initials: locataireInitials(l),
      ancien: l.statut === 'ANCIEN' || l.statut === 'SANS_LOCATION',
      name: `${civilite}${l.prenom} ${l.nom}`,
      garages: l.garages.join(', '),
      address1: `${l.rue} ${l.numeroRue}`,
      address2: `${l.codePostal} ${l.localite}`,
      badgeKey: key,
      badgeGradient: SOLDE_GRADIENT[key],
    };
  });

  protected readonly tiles = computed<StatTile[]>(() => {
    this.language.lang();
    const data = this.data();
    if (!data) {
      return [];
    }
    const t = (key: string) => this.translate.instant(key);
    return [
      { label: t('chronologie.stat.locations'), value: String(data.nbLocations) },
      { label: t('chronologie.stat.totalVerse'), value: this.eur(data.totalVerse) },
      { label: t('chronologie.stat.remarquesOuvertes'), value: String(data.remarquesOuvertes) },
    ];
  });

  protected readonly events = computed<TimelineItem[]>(() => {
    this.language.lang();
    return (this.data()?.evenements.content ?? []).map((event, index) => this.item(event, index));
  });
  protected readonly remaining = computed(() => {
    const page = this.data()?.evenements;
    return page ? Math.max(0, page.totalElements - page.content.length) : 0;
  });

  protected tone(locataire: LocataireDTO) {
    return LOCATAIRE_BADGE_TONE[locataireBadgeKey(locataire)];
  }

  protected initials(locataire: LocataireDTO): string {
    return locataireInitials(locataire);
  }

  /** « Garage G01, G12 · À jour » (RG-CHR-01). */
  protected sub(locataire: LocataireDTO): string {
    const solde = this.translate.instant(`locataires.statut.${locataireBadgeKey(locataire)}`);
    return locataire.garages.length > 0
      ? `${this.translate.instant('chronologie.garage', { garages: locataire.garages.join(', ') })} · ${solde}`
      : solde;
  }

  protected choose(locataire: LocataireDTO): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: { locataire: locataire.id }, replaceUrl: true });
  }

  protected setFiltre(filtre: ChronologieFiltre): void {
    this.filtre.set(filtre);
    this.shown.set(EVENTS_BATCH);
  }

  protected more(): void {
    this.shown.update((n) => n + EVENTS_BATCH);
  }

  /** Description du back dans la langue de l'écran ; le texte d'une remarque reste celui saisi. */
  private describe(event: Evenement): string | null {
    if (!event.description) {
      return null;
    }
    return event.type.startsWith('REMARQUE') ? event.description : this.errors.message(event.description);
  }

  private item(event: Evenement, index: number): TimelineItem {
    const t = (key: string, params?: Record<string, unknown>) => this.translate.instant(key, params);
    const base = { key: `${event.dateHeure}|${event.type}|${index}`, date: this.dateLine(event.dateHeure), future: event.aVenir };
    switch (event.type) {
      case 'LOCATION_DEBUT':
        return {
          ...base,
          icon: 'fa-solid fa-key',
          gradient: event.aVenir ? GRADIENT.warning : GRADIENT.success,
          title: t(event.aVenir ? 'chronologie.type.LOCATION_A_VENIR' : 'chronologie.type.LOCATION_DEBUT'),
          chip: event.pastille,
          description: this.describe(event),
        };
      case 'LOCATION_FIN':
        return {
          ...base,
          icon: 'fa-solid fa-key',
          gradient: GRADIENT.ancienLight,
          title: t(event.aVenir ? 'chronologie.type.LOCATION_FIN_PREVUE' : 'chronologie.type.LOCATION_FIN'),
          chip: event.pastille,
          description: this.describe(event),
        };
      case 'PAIEMENT':
        return {
          ...base,
          icon: 'fa-solid fa-euro-sign',
          gradient: GRADIENT.info,
          title: t('chronologie.type.PAIEMENT'),
          chip: event.pastille ? t(`chronologie.mode.${event.pastille.toUpperCase()}`) : null,
          amount: event.montant === null ? null : this.eur(event.montant),
          description: this.describe(event),
        };
      case 'REMARQUE':
      case 'REMARQUE_RESOLUE': {
        const type = (event.pastille ?? '').toUpperCase();
        return {
          ...base,
          icon: 'fa-regular fa-comment',
          gradient:
            event.type === 'REMARQUE_RESOLUE'
              ? GRADIENT.success
              : type === 'PROBLEME'
                ? GRADIENT.danger
                : type === 'INFORMATION'
                  ? GRADIENT.info
                  : GRADIENT.dark,
          title: t(`chronologie.type.${event.type}`),
          chip: type ? t(`remarques.type.${type}`) : null,
          description: this.describe(event),
          quote: true,
        };
      }
    }
  }

  /** « 02/10/2026 », « 05/10/2026 · 14:05 » quand l'événement a une heure (remarque). */
  private dateLine(dateHeure: string): string {
    const [day, time = ''] = dateHeure.split('T');
    const hm = time.slice(0, 5);
    return hm && hm !== '00:00' ? `${isoToDisplay(day)} · ${hm}` : isoToDisplay(day);
  }

  private eur(value: number): string {
    return formatCurrency(value, 'fr', '€', 'EUR', '1.2-2');
  }
}
