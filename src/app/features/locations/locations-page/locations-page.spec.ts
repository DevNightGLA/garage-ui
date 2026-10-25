import { HttpRequest, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { libre, pageOf } from '../../../../testing/garage-fixtures';
import { locataire, locataireAVenir, locataireAncien } from '../../../../testing/locataire-fixtures';
import {
  COMPTEURS_LOCATIONS,
  CONDITIONS,
  location,
  locationAVenir,
  locationTerminee,
} from '../../../../testing/location-fixtures';
import { provideTestTranslations } from '../../../../testing/translations';
import { AuthService } from '../../../core/auth/auth-service';
import { Role } from '../../../core/auth/auth.models';
import { TODAY } from '../../../core/today';
import { GarageDTO } from '../../garages/garage.models';
import { LocationDTO } from '../location.models';
import { LocationsPage } from './locations-page';

const isList = (r: HttpRequest<unknown>) => r.url === '/api/locations';
const isCounters = (r: HttpRequest<unknown>) => r.url === '/api/locations/compteurs';
const isFreeGarages = (r: HttpRequest<unknown>) => r.url === '/api/garages' && r.params.get('statut') === 'LIBRE';
const isTenants = (r: HttpRequest<unknown>) => r.url === '/api/locataires';
const isConditions = (garageId: number) => (r: HttpRequest<unknown>) =>
  r.url === `/api/garages/${garageId}/conditions-location`;

const G12 = libre({ id: 12, numero: 'G12', nbClesTotal: 3, nbClesReserve: 1, nbClesDisponibles: 2 });
const G14 = libre({ id: 14, numero: 'G14', nbClesTotal: 5, nbClesReserve: 2, nbClesDisponibles: 3 });

describe('LocationsPage', () => {
  let fixture: ComponentFixture<LocationsPage>;
  let http: HttpTestingController;
  let root: HTMLElement;

  const text = (element: Element | null) => (element?.textContent ?? '').replace(/\s+/g, ' ').trim();
  const rowsText = () => Array.from(root.querySelectorAll('tbody tr')).map((tr) => text(tr));
  const headers = () =>
    Array.from(root.querySelectorAll('thead th')).map((th) => text(th).replace(/[↕▲▼]/g, '').trim());
  /** Attend la stabilité : à n'utiliser qu'une fois toutes les requêtes ouvertes servies. */
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };
  /** Rend l'écran sans attendre : une requête HTTP simulée encore ouverte bloquerait `whenStable`. */
  const render = () => fixture.detectChanges();
  /** Laisse les ressources `rxResource` livrer leur valeur, sans attendre les requêtes encore ouvertes. */
  const tick = () => new Promise<void>((resolve) => setTimeout(resolve));
  const click = (element: Element | null) => {
    (element as HTMLElement).click();
    render();
  };
  const signIn = (role: Role | null) =>
    TestBed.inject(AuthService).user.set(
      role ? { id: 1, login: 'u', email: 'u@example.com', role, actif: true } : null,
    );

  /** Crée l'écran avec le rôle voulu et répond aux deux premières requêtes (liste et compteurs). */
  const open = async (
    role: Role | null,
    rows: LocationDTO[] = [location(), locationAVenir()],
    total = rows.length,
  ) => {
    signIn(role);
    fixture = TestBed.createComponent(LocationsPage);
    root = fixture.nativeElement;
    render();
    http.expectOne(isList).flush(pageOf(rows, total));
    http.expectOne(isCounters).flush(COMPTEURS_LOCATIONS);
    await settle();
  };

  /** Répond à la liste et aux compteurs rechargés après une modification. */
  const flushReload = async (rows: LocationDTO[] = [location(), locationAVenir()]) => {
    render();
    http.expectOne(isList).flush(pageOf(rows));
    http.expectOne(isCounters).flush(COMPTEURS_LOCATIONS);
    await settle();
  };

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTestTranslations(),
        { provide: TODAY, useValue: () => new Date(2026, 9, 25) },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  describe('états', () => {
    it('affiche le chargement tant que la liste n\'est pas arrivée', () => {
      signIn('ADMIN');
      fixture = TestBed.createComponent(LocationsPage);
      root = fixture.nativeElement;
      render();
      expect(text(root.querySelector('.dt__state'))).toBe('Chargement…');
      http.expectOne(isList).flush(pageOf([]));
      http.expectOne(isCounters).flush(COMPTEURS_LOCATIONS);
    });

    it('affiche la liste vide', async () => {
      await open('ADMIN', []);
      expect(text(root.querySelector('.dt__state'))).toBe('Aucun résultat.');
      expect(text(root.querySelector('.pg__count'))).toBe('0–0 sur 0 locations');
    });

    it('affiche le message d\'erreur et recharge au clic sur Réessayer', async () => {
      signIn('ADMIN');
      fixture = TestBed.createComponent(LocationsPage);
      root = fixture.nativeElement;
      render();
      http
        .expectOne(isList)
        .flush({ code: 'ERREUR_INTERNE', message: 'Une erreur inattendue est survenue.' }, { status: 500, statusText: 'Server Error' });
      http.expectOne(isCounters).flush(COMPTEURS_LOCATIONS);
      await settle();
      expect(text(root.querySelector('.dt__state--error'))).toContain('Une erreur inattendue est survenue.');

      click(root.querySelector('.dt__state--error button'));
      http.expectOne(isList).flush(pageOf([location()]));
      http.expectOne(isCounters).flush(COMPTEURS_LOCATIONS);
      await settle();
      expect(root.querySelector('.dt__state--error')).toBeNull();
      expect(rowsText()).toHaveLength(1);
    });
  });

  describe('liste', () => {
    it('demande les locations actives par défaut, sans tri, 10 par page', async () => {
      signIn('ADMIN');
      fixture = TestBed.createComponent(LocationsPage);
      root = fixture.nativeElement;
      render();
      const request = http.expectOne(isList);
      expect(request.request.params.get('statut')).toBe('ACTIVE');
      expect(request.request.params.get('page')).toBe('0');
      expect(request.request.params.get('size')).toBe('10');
      expect(request.request.params.has('sort')).toBe(false);
      expect(request.request.params.has('finDu')).toBe(false);
      request.flush(pageOf([location()]));
      http.expectOne(isCounters).flush(COMPTEURS_LOCATIONS);
      await settle();
    });

    it('affiche locataire, garage, début, fin, loyer et clés', async () => {
      await open('ADMIN', [location({ dateFin: '2026-12-31' }), locationAVenir()]);
      const [active, upcoming] = rowsText();
      expect(active).toContain('MD');
      expect(active).toContain('Marie Dupont');
      expect(active).toContain('G01');
      expect(active).toContain('01/03/2025');
      expect(active).toContain('31/12/2026');
      expect(active).toContain('90,00 €');
      expect(active).toContain('2');
      expect(upcoming).toContain('Luc Martin');
      expect(upcoming).toContain('G12');
      expect(upcoming).toContain('01/12/2026');
      expect(upcoming).toContain('95,00 €');
    });

    it('laisse la fin et le loyer vides quand l\'API n\'en renvoie pas', async () => {
      await open('ADMIN', [location({ dateFin: null, loyer: null })]);
      const cells = root.querySelectorAll('tbody tr td');
      expect(text(cells[3])).toBe('');
      expect(text(cells[4])).toBe('');
    });

    it('affiche les filtres avec leurs compteurs, « Actives » actif par défaut', async () => {
      await open('ADMIN');
      const buttons = Array.from(root.querySelectorAll('.fb__btn'));
      expect(buttons.map((b) => text(b))).toEqual(['Actives (7)', 'À venir (1)', 'Terminées (2)']);
      expect(buttons.map((b) => b.classList.contains('is-active'))).toEqual([true, false, false]);
    });

    it('envoie le statut du filtre et revient à la page 1', async () => {
      await open('ADMIN', [location()], 25);
      click(root.querySelectorAll('.pg__btn')[2]);
      http.expectOne((r) => isList(r) && r.params.get('page') === '1').flush(pageOf([location()], 25, 1));
      await settle();

      click(root.querySelectorAll('.fb__btn')[1]);
      const request = http.expectOne(isList);
      expect(request.request.params.get('statut')).toBe('A_VENIR');
      expect(request.request.params.get('page')).toBe('0');
      request.flush(pageOf([locationAVenir()]));
      await settle();
      expect(text(root.querySelector('.fb__btn.is-active'))).toBe('À venir (1)');
    });

    it('envoie la recherche au serveur et recharge les compteurs', async () => {
      await open('ADMIN');
      const field = root.querySelector<HTMLInputElement>('app-search-input input')!;
      field.value = 'dupont';
      field.dispatchEvent(new Event('input'));
      field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      render();
      const list = http.expectOne(isList);
      expect(list.request.params.get('q')).toBe('dupont');
      expect(list.request.params.get('page')).toBe('0');
      list.flush(pageOf([location()]));
      const counters = http.expectOne(isCounters);
      expect(counters.request.params.get('q')).toBe('dupont');
      counters.flush({ A_VENIR: 0, ACTIVE: 1, TERMINEE: 0, TOUS: 1 });
      await settle();
      expect(text(root.querySelectorAll('.fb__btn')[0])).toBe('Actives (1)');
    });

    it('envoie les tris cumulés avec les propriétés de l\'API', async () => {
      await open('ADMIN');
      expect(headers()).toEqual(['Locataire', 'Garage', 'Début', 'Fin', 'Loyer', 'Clés', 'Actions']);
      click(root.querySelectorAll<HTMLButtonElement>('th .dt__sort')[0]);
      http.expectOne(isList).flush(pageOf([location()]));
      await settle();
      click(root.querySelectorAll<HTMLButtonElement>('th .dt__sort')[4]);
      const request = http.expectOne(isList);
      expect(request.request.params.getAll('sort')).toEqual(['locataire,asc', 'loyer,asc']);
      request.flush(pageOf([location()]));
      await settle();
      expect(text(root.querySelector('.dt-clear'))).toContain('Annuler les tris (2)');
    });

    it('trie sur le début, la fin, le garage et les clés avec les bonnes propriétés', async () => {
      await open('ADMIN');
      for (const [index, key] of [
        [1, 'garage'],
        [2, 'dateDebut'],
        [3, 'dateFin'],
        [5, 'nbClesRemises'],
      ] as const) {
        click(root.querySelectorAll<HTMLButtonElement>('th .dt__sort')[index]);
        const request = http.expectOne(isList);
        expect(request.request.params.getAll('sort')?.at(-1)).toBe(`${key},asc`);
        request.flush(pageOf([location()]));
        await settle();
      }
    });

    it('pagine côté serveur 10 par 10', async () => {
      await open('ADMIN', [location()], 25);
      expect(text(root.querySelector('.pg__count'))).toBe('1–10 sur 25 locations');
      click(root.querySelectorAll('.pg__btn')[3]);
      const request = http.expectOne(isList);
      expect(request.request.params.get('page')).toBe('2');
      request.flush(pageOf([location()], 25, 2));
      await settle();
      expect(text(root.querySelector('.pg__count'))).toBe('21–25 sur 25 locations');
    });
  });

  describe('période de fin (RG-LOC-05)', () => {
    const toTerminees = async (rows = [locationTerminee()]) => {
      await open('ADMIN');
      click(root.querySelectorAll('.fb__btn')[2]);
      http.expectOne((r) => isList(r) && r.params.get('statut') === 'TERMINEE').flush(pageOf(rows));
      await settle();
    };
    const type = (index: number, digits: string) => {
      const input = root.querySelectorAll<HTMLInputElement>('.periode app-date-input input')[index];
      input.value = digits;
      input.dispatchEvent(new Event('input'));
      render();
    };

    it('n\'est proposée que pour les locations terminées', async () => {
      await open('ADMIN');
      expect(root.querySelector('.periode')).toBeNull();
      click(root.querySelectorAll('.fb__btn')[1]);
      http.expectOne(isList).flush(pageOf([locationAVenir()]));
      await settle();
      expect(root.querySelector('.periode')).toBeNull();

      click(root.querySelectorAll('.fb__btn')[2]);
      http.expectOne(isList).flush(pageOf([locationTerminee()]));
      await settle();
      expect(text(root.querySelector('.periode'))).toContain('Comprises entre le');
      expect(root.querySelectorAll('.periode app-date-input')).toHaveLength(2);
    });

    it('envoie les bornes au format yyyy-MM-dd et revient à la page 1', async () => {
      await toTerminees();
      type(0, '01012025');
      const from = http.expectOne(isList);
      expect(from.request.params.get('statut')).toBe('TERMINEE');
      expect(from.request.params.get('finDu')).toBe('2025-01-01');
      expect(from.request.params.has('finAu')).toBe(false);
      expect(from.request.params.get('page')).toBe('0');
      from.flush(pageOf([locationTerminee()]));
      await settle();

      type(1, '31122025');
      const to = http.expectOne(isList);
      expect(to.request.params.get('finDu')).toBe('2025-01-01');
      expect(to.request.params.get('finAu')).toBe('2025-12-31');
      to.flush(pageOf([locationTerminee()]));
      await settle();
    });

    it('une date qui n\'existe pas vide le champ et ne filtre rien', async () => {
      await toTerminees();
      type(0, '31022025');
      const input = root.querySelector<HTMLInputElement>('.periode app-date-input input')!;
      expect(input.value).toBe('');
      http.expectNone(isList);
    });

    it('le lien d\'effacement vide les deux bornes', async () => {
      await toTerminees();
      expect(root.querySelector('.periode .icon-link')).toBeNull();
      type(0, '01012025');
      http.expectOne(isList).flush(pageOf([locationTerminee()]));
      await settle();
      type(1, '31122025');
      http.expectOne(isList).flush(pageOf([locationTerminee()]));
      await settle();

      click(root.querySelector('.periode .icon-link'));
      const requests = http.match(isList);
      expect(requests.length).toBeGreaterThan(0);
      const last = requests.at(-1)!;
      expect(last.request.params.has('finDu')).toBe(false);
      expect(last.request.params.has('finAu')).toBe(false);
      requests.forEach((r) => r.flush(pageOf([locationTerminee()])));
      await settle();
      expect(Array.from(root.querySelectorAll<HTMLInputElement>('.periode app-date-input input')).map((i) => i.value)).toEqual(['', '']);
      expect(root.querySelector('.periode .icon-link')).toBeNull();
    });

    it('les bornes ne s\'appliquent pas aux filtres Actives et À venir', async () => {
      await toTerminees();
      type(0, '01012025');
      http.expectOne(isList).flush(pageOf([locationTerminee()]));
      await settle();

      click(root.querySelectorAll('.fb__btn')[0]);
      const active = http.expectOne(isList);
      expect(active.request.params.get('statut')).toBe('ACTIVE');
      expect(active.request.params.has('finDu')).toBe(false);
      active.flush(pageOf([location()]));
      await settle();
    });
  });

  describe('droits', () => {
    const actionTitles = (selector = 'tbody tr:first-child') =>
      Array.from(root.querySelectorAll(`${selector} .actions .icon-btn`)).map((b) => b.getAttribute('aria-label'));

    it('Admin : crée, modifie et supprime', async () => {
      await open('ADMIN');
      expect(root.querySelector('[dtToolbarEnd]')).not.toBeNull();
      expect(actionTitles()).toEqual(['Modifier la location', 'Supprimer la location']);
    });

    it('Gestionnaire : crée et modifie, ne supprime pas', async () => {
      await open('GESTIONNAIRE');
      expect(root.querySelector('[dtToolbarEnd]')).not.toBeNull();
      expect(actionTitles()).toEqual(['Modifier la location']);
    });

    it('Lecture seule : ni création ni suppression, « Visualiser » à la place de « Modifier »', async () => {
      await open('LECTURE_SEULE');
      expect(root.querySelector('[dtToolbarEnd]')).toBeNull();
      expect(actionTitles()).toEqual(['Visualiser la location']);
      expect(root.querySelector('tbody tr:first-child .actions .fa-eye')).not.toBeNull();
    });

    it('une location terminée n\'a aucune action, pour aucun rôle (RG-LOC-27 et 33)', async () => {
      await open('ADMIN', [locationTerminee()]);
      expect(actionTitles()).toEqual([]);
      expect(root.querySelector('tbody tr .actions')!.classList.contains('cell-empty')).toBe(true);
    });

    it('Lecture seule : la fiche s\'ouvre en consultation, champs désactivés et sans Enregistrer', async () => {
      await open('LECTURE_SEULE', [location()]);
      click(root.querySelector('tbody tr:first-child .actions .icon-btn'));
      expect(text(root.querySelector('.modal__title'))).toBe('Visualiser la location');
      const controls = Array.from(root.querySelectorAll<HTMLInputElement>('app-location-form input'));
      expect(controls.length).toBeGreaterThan(0);
      expect(controls.every((control) => control.disabled)).toBe(true);
      expect(root.querySelector('app-location-form button[type="submit"]')).toBeNull();
      expect(text(root.querySelector('.modal__foot'))).toBe('Annuler');
      expect(root.querySelector('app-location-form .message-info')).toBeNull();
      http.expectNone((r) => r.method !== 'GET');
    });
  });

  describe('fiche de création', () => {
    const type = (selector: string, value: string, event = 'input') => {
      const control = root.querySelector<HTMLInputElement | HTMLSelectElement>(`app-location-form ${selector}`)!;
      control.value = value;
      control.dispatchEvent(new Event(event));
      render();
    };
    const submit = () => {
      root.querySelector('app-location-form form')!.dispatchEvent(new Event('submit'));
      render();
    };
    const tenantRows = [locataire(), locataireAVenir(), locataireAncien()];

    /** Ouvre la fiche et répond aux garages libres, aux locataires et aux conditions du premier garage. */
    const openCreation = async (garages: GarageDTO[] = [G12, G14]) => {
      await open('GESTIONNAIRE');
      click(root.querySelector('[dtToolbarEnd]'));
      http.expectOne(isFreeGarages).flush(pageOf(garages, garages.length, 0, 100));
      http.expectOne(isTenants).flush(pageOf(tenantRows, 13, 0, 5));
      // les garages arrivent, le premier est proposé, ses conditions sont demandées
      await tick();
      render();
      await tick();
      render();
      if (garages.length > 0) {
        http.expectOne(isConditions(garages[0].id)).flush(CONDITIONS);
      }
      await settle();
    };
    const chooseTenant = (index = 0) => {
      click(root.querySelectorAll('app-location-form .picker__row')[index]);
    };

    it('propose les garages libres, le premier garage, la date du jour et les clés au maximum', async () => {
      await openCreation();
      expect(text(root.querySelector('.modal__title'))).toBe('Nouvelle location');
      const request = http.match(() => false);
      expect(request).toEqual([]);
      const select = root.querySelector<HTMLSelectElement>('app-location-form select')!;
      expect(Array.from(select.options).map((o) => o.textContent!.trim())).toEqual(['G12', 'G14']);
      expect(select.selectedOptions[0].textContent!.trim()).toBe('G12');
      expect(root.querySelector<HTMLInputElement>('app-location-form app-date-input input')!.value).toBe('25/10/2026');
      expect(root.querySelector<HTMLInputElement>('[formControlName="nbClesRemises"]')!.value).toBe('2');
    });

    it('affiche les clés disponibles, la réserve et le loyer à la date de début', async () => {
      await openCreation();
      expect(text(root.querySelector('.lf-info'))).toBe(
        'Clés disponibles : 2 (réserve : 1) · Loyer à la date de début : 90,00 €/mois',
      );
    });

    it('recalcule les clés et les conditions au changement de garage', async () => {
      await openCreation();
      type('select', root.querySelectorAll<HTMLOptionElement>('app-location-form select option')[1].value, 'change');
      http.expectOne(isConditions(14)).flush({ nbClesDisponibles: 3, nbClesReserve: 2, loyer: 150 });
      await settle();
      expect(root.querySelector<HTMLInputElement>('[formControlName="nbClesRemises"]')!.value).toBe('3');
      expect(root.querySelector('[formControlName="nbClesRemises"]')!.getAttribute('max')).toBe('3');
      expect(text(root.querySelector('.lf-info'))).toContain('Clés disponibles : 3 (réserve : 2)');
      expect(text(root.querySelector('.lf-info'))).toContain('150,00 €/mois');
    });

    it('redemande les conditions quand la date de début change, sans toucher aux clés', async () => {
      await openCreation();
      type('[formControlName="nbClesRemises"]', '1');
      type('app-date-input input', '01112026');
      const request = http.expectOne(isConditions(12));
      expect(request.request.params.get('dateDebut')).toBe('2026-11-01');
      request.flush({ ...CONDITIONS, loyer: null });
      await settle();
      expect(root.querySelector<HTMLInputElement>('[formControlName="nbClesRemises"]')!.value).toBe('1');
      expect(text(root.querySelector('.lf-info'))).toContain('Loyer à la date de début : —');
    });

    it('envoie le locataire, le garage, le début et les clés, puis bascule sur le filtre de la location créée', async () => {
      await openCreation();
      chooseTenant(1);
      submit();
      const post = http.expectOne((r) => r.method === 'POST' && r.url === '/api/locations');
      expect(post.request.body).toEqual({ locataireId: 3, garageId: 12, dateDebut: '2026-10-25', nbClesRemises: 2 });
      post.flush(locationAVenir());
      render();
      expect(root.querySelector('app-location-form')).toBeNull();

      // « À venir » devient le filtre affiché : une seule requête de liste, les compteurs sont rechargés
      http.expectOne((r) => isList(r) && r.params.get('statut') === 'A_VENIR').flush(pageOf([locationAVenir()]));
      http.expectOne(isCounters).flush(COMPTEURS_LOCATIONS);
      await settle();
      expect(text(root.querySelector('.fb__btn.is-active'))).toBe('À venir (1)');
    });

    it('recharge la liste sans changer de filtre quand la location créée est active', async () => {
      await openCreation();
      chooseTenant(0);
      submit();
      http.expectOne((r) => r.method === 'POST').flush(location());
      await flushReload();
      expect(text(root.querySelector('.fb__btn.is-active'))).toBe('Actives (7)');
    });

    it('surligne le locataire, obligatoire, sans rien envoyer', async () => {
      await openCreation();
      submit();
      const invalid = Array.from(root.querySelectorAll('app-location-form app-form-field.is-invalid')).map((f) => text(f.querySelector('.ff__label')));
      expect(invalid).toEqual(['Locataire *']);
      http.expectNone((r) => r.method === 'POST');
    });

    it('surligne ensemble les champs obligatoires vides', async () => {
      await openCreation();
      type('[formControlName="nbClesRemises"]', '');
      type('app-date-input input', '');
      // sans date de début, le loyer des conditions est absent
      http.expectOne(isConditions(12)).flush({ ...CONDITIONS, loyer: null });
      submit();
      const invalid = Array.from(root.querySelectorAll('app-location-form app-form-field.is-invalid')).map((f) => text(f.querySelector('.ff__label')));
      expect(invalid).toEqual(['Locataire *', 'Début *', 'Clés remises *']);
      http.expectNone((r) => r.method === 'POST');
    });

    it('prévient quand aucun garage n\'est libre', async () => {
      await openCreation([]);
      expect(text(root.querySelector('app-location-form .message-warning'))).toBe('Aucun garage libre pour le moment.');
      expect(root.querySelectorAll('app-location-form select option')).toHaveLength(0);
    });

    it('affiche dans la fenêtre l\'erreur du back sans la fermer', async () => {
      await openCreation();
      chooseTenant(0);
      submit();
      http.expectOne((r) => r.method === 'POST').flush(
        {
          code: 'LOC_CHEVAUCHEMENT',
          message: 'Cette location chevauche une autre location du garage (à partir du 01/12/2026).',
          details: [],
        },
        { status: 409, statusText: 'Conflict' },
      );
      await settle();
      expect(text(root.querySelector('app-location-form .message-error[role="alert"]'))).toBe(
        'Cette location chevauche une autre location du garage (à partir du 01/12/2026).',
      );
      expect(root.querySelector('app-location-form')).not.toBeNull();
    });

    it('affiche les erreurs de champ du back sous chaque champ', async () => {
      await openCreation();
      chooseTenant(0);
      submit();
      http.expectOne((r) => r.method === 'POST').flush(
        {
          code: 'VALIDATION',
          message: 'Des champs obligatoires sont manquants ou invalides.',
          fieldErrors: { nbClesRemises: 'Le nombre de clés remises est obligatoire.' },
          details: [],
        },
        { status: 422, statusText: 'Unprocessable Entity' },
      );
      await settle();
      expect(Array.from(root.querySelectorAll('app-location-form .ff__error')).map((e) => text(e))).toEqual([
        'Le nombre de clés remises est obligatoire.',
      ]);
    });

    it('ferme la fiche avec Annuler sans rien envoyer', async () => {
      await openCreation();
      click(root.querySelector('.modal__foot .btn--secondary'));
      expect(root.querySelector('app-location-form')).toBeNull();
      http.expectNone((r) => r.method !== 'GET');
    });
  });

  describe('fiche de modification', () => {
    const submit = () => {
      root.querySelector('app-location-form form')!.dispatchEvent(new Event('submit'));
      render();
    };
    const type = (selector: string, value: string) => {
      const control = root.querySelector<HTMLInputElement>(`app-location-form ${selector}`)!;
      control.value = value;
      control.dispatchEvent(new Event('input'));
      render();
    };

    it('location active : locataire et garage figés, début, fin et clés modifiables', async () => {
      await open('GESTIONNAIRE', [location({ dateFin: '2026-12-31' })]);
      click(root.querySelector('tbody tr .actions .icon-btn'));
      expect(text(root.querySelector('.modal__title'))).toBe('Modifier la location');
      const disabled = Array.from(root.querySelectorAll<HTMLInputElement>('app-location-form input:disabled'));
      expect(disabled.map((input) => input.value)).toEqual(['Marie Dupont', 'G01']);
      const dates = Array.from(root.querySelectorAll<HTMLInputElement>('app-location-form app-date-input input'));
      expect(dates.map((input) => input.value)).toEqual(['01/03/2025', '31/12/2026']);
      expect(root.querySelector<HTMLInputElement>('[formControlName="nbClesRemises"]')!.value).toBe('2');
      expect(text(root.querySelector('app-location-form .message-info'))).toContain('dernier jour d\'un mois');
    });

    it('envoie le début, les clés et la fin, puis recharge sans changer de filtre', async () => {
      await open('GESTIONNAIRE', [location()]);
      click(root.querySelector('tbody tr .actions .icon-btn'));
      type('app-date-input:nth-of-type(1) input', '01042025');
      type('[formControlName="nbClesRemises"]', '1');
      const dates = root.querySelectorAll<HTMLInputElement>('app-location-form app-date-input input');
      dates[1].value = '31122026';
      dates[1].dispatchEvent(new Event('input'));
      render();
      submit();
      const put = http.expectOne((r) => r.method === 'PUT' && r.url === '/api/locations/1');
      expect(put.request.body).toEqual({ dateDebut: '2025-04-01', nbClesRemises: 1, dateFin: '2026-12-31' });
      put.flush(location({ dateFin: '2026-12-31' }));
      await flushReload();
      expect(root.querySelector('app-location-form')).toBeNull();
      expect(text(root.querySelector('.fb__btn.is-active'))).toBe('Actives (7)');
    });

    it('envoie dateFin à null quand on l\'efface (RG-LOC-26)', async () => {
      await open('GESTIONNAIRE', [location({ dateFin: '2026-12-31' })]);
      click(root.querySelector('tbody tr .actions .icon-btn'));
      const dates = root.querySelectorAll<HTMLInputElement>('app-location-form app-date-input input');
      dates[1].value = '';
      dates[1].dispatchEvent(new Event('input'));
      render();
      submit();
      const put = http.expectOne((r) => r.method === 'PUT');
      expect(put.request.body).toEqual({ dateDebut: '2025-03-01', nbClesRemises: 2, dateFin: null });
      put.flush(location());
      await flushReload();
    });

    it('location à venir : pas de date de fin ni d\'aide sur la fin (RG-LOC-22)', async () => {
      await open('GESTIONNAIRE', [locationAVenir()]);
      click(root.querySelector('tbody tr .actions .icon-btn'));
      expect(root.querySelectorAll('app-location-form app-date-input')).toHaveLength(1);
      expect(root.querySelector('app-location-form .message-info')).toBeNull();
      submit();
      const put = http.expectOne((r) => r.method === 'PUT' && r.url === '/api/locations/2');
      expect(put.request.body).toEqual({ dateDebut: '2026-12-01', nbClesRemises: 2, dateFin: null });
      put.flush(locationAVenir());
      await flushReload();
    });

    it('un début déplacé fait passer une location à venir en active : la liste bascule sur « Actives »', async () => {
      await open('GESTIONNAIRE', [locationAVenir()]);
      click(root.querySelectorAll('.fb__btn')[1]);
      http.expectOne((r) => isList(r) && r.params.get('statut') === 'A_VENIR').flush(pageOf([locationAVenir()]));
      await settle();
      click(root.querySelector('tbody tr .actions .icon-btn'));
      type('app-date-input input', '01102026');
      submit();
      http.expectOne((r) => r.method === 'PUT').flush(locationAVenir({ statut: 'ACTIVE', dateDebut: '2026-10-01' }));
      render();
      http.expectOne((r) => isList(r) && r.params.get('statut') === 'ACTIVE').flush(pageOf([location()]));
      http.expectOne(isCounters).flush(COMPTEURS_LOCATIONS);
      await settle();
      expect(text(root.querySelector('.fb__btn.is-active'))).toBe('Actives (7)');
    });

    it('une location active clôturée reste dans le filtre affiché, qui se recharge', async () => {
      await open('GESTIONNAIRE', [location()]);
      click(root.querySelector('tbody tr .actions .icon-btn'));
      const dates = root.querySelectorAll<HTMLInputElement>('app-location-form app-date-input input');
      dates[1].value = '30092026';
      dates[1].dispatchEvent(new Event('input'));
      render();
      submit();
      http.expectOne((r) => r.method === 'PUT').flush(location({ statut: 'TERMINEE', dateFin: '2026-09-30' }));
      await flushReload([]);
      expect(text(root.querySelector('.fb__btn.is-active'))).toBe('Actives (7)');
    });

    it('affiche l\'erreur du back dans la fenêtre sans la fermer', async () => {
      await open('GESTIONNAIRE', [location()]);
      click(root.querySelector('tbody tr .actions .icon-btn'));
      const dates = root.querySelectorAll<HTMLInputElement>('app-location-form app-date-input input');
      dates[1].value = '15122026';
      dates[1].dispatchEvent(new Event('input'));
      render();
      submit();
      http.expectOne((r) => r.method === 'PUT').flush(
        { code: 'LOC_FIN_PAS_DERNIER_JOUR', message: "La date de fin doit être le dernier jour d'un mois.", details: [] },
        { status: 409, statusText: 'Conflict' },
      );
      await settle();
      expect(text(root.querySelector('app-location-form .message-error[role="alert"]'))).toBe(
        "La date de fin doit être le dernier jour d'un mois.",
      );
      expect(root.querySelector('app-location-form')).not.toBeNull();
    });
  });

  describe('suppression (Admin)', () => {
    const askDelete = async (rows = [location()]) => {
      await open('ADMIN', rows);
      click(root.querySelectorAll('tbody tr .actions .icon-btn')[1]);
    };

    it('demande confirmation avec le locataire et le garage, supprime puis recharge', async () => {
      await askDelete();
      expect(text(root.querySelector('.modal__title'))).toBe('Supprimer la location ?');
      expect(text(root.querySelector('.modal__body'))).toBe(
        'La location de Marie Dupont sur le garage G01 sera supprimée définitivement.',
      );
      click(root.querySelector('.modal__foot .btn--primary'));
      http.expectOne((r) => r.method === 'DELETE' && r.url === '/api/locations/1').flush(null, { status: 204, statusText: 'No Content' });
      await flushReload([]);
      expect(root.querySelector('app-confirm')).toBeNull();
    });

    it('supprime aussi une location à venir', async () => {
      await askDelete([locationAVenir()]);
      expect(text(root.querySelector('.modal__body'))).toContain('Luc Martin sur le garage G12');
      click(root.querySelector('.modal__foot .btn--primary'));
      http.expectOne((r) => r.method === 'DELETE' && r.url === '/api/locations/2').flush(null, { status: 204, statusText: 'No Content' });
      await flushReload([]);
    });

    it('n\'envoie rien quand on répond Non', async () => {
      await askDelete();
      click(root.querySelector('.modal__foot .btn--secondary'));
      expect(root.querySelector('app-confirm')).toBeNull();
      http.expectNone((r) => r.method === 'DELETE');
    });

    it('affiche le refus du back avec son motif et un seul bouton Fermer', async () => {
      await askDelete();
      click(root.querySelector('.modal__foot .btn--primary'));
      http.expectOne((r) => r.method === 'DELETE').flush(
        {
          code: 'LOC_SUPPRESSION_REFUSEE',
          message: '2 paiement(s) ont déjà été effectué(s) pour cette location.',
          details: [],
        },
        { status: 409, statusText: 'Conflict' },
      );
      await settle();
      expect(text(root.querySelector('.modal__title'))).toBe('Suppression impossible');
      expect(text(root.querySelector('.confirm__refus-titre'))).toBe(
        'La location de Marie Dupont sur le garage G01 ne peut pas être supprimée :',
      );
      expect(Array.from(root.querySelectorAll('.confirm__motifs li')).map((li) => text(li))).toEqual([
        '2 paiement(s) ont déjà été effectué(s) pour cette location.',
      ]);
      expect(Array.from(root.querySelectorAll('.modal__foot button')).map((b) => text(b))).toEqual(['Fermer']);
      click(root.querySelector('.modal__foot button'));
      expect(root.querySelector('app-confirm')).toBeNull();
    });

    it('affiche une autre erreur dans la fenêtre sans la fermer', async () => {
      await askDelete();
      click(root.querySelector('.modal__foot .btn--primary'));
      http.expectOne((r) => r.method === 'DELETE').flush(
        { code: 'ACCES_REFUSE', message: 'Droits insuffisants pour cette action.', details: [] },
        { status: 403, statusText: 'Forbidden' },
      );
      await settle();
      expect(text(root.querySelector('app-confirm .message-error'))).toBe('Droits insuffisants pour cette action.');
      expect(root.querySelector('app-confirm')).not.toBeNull();
    });
  });
});
