import { HttpRequest, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { COMPTEURS, garage, libre, loyer, pageOf } from '../../../../testing/garage-fixtures';
import { location } from '../../../../testing/location-fixtures';
import { probleme, remarque } from '../../../../testing/remarque-fixtures';
import { provideTestTranslations } from '../../../../testing/translations';
import { AuthService } from '../../../core/auth/auth-service';
import { Role } from '../../../core/auth/auth.models';
import { GarageDTO } from '../garage.models';
import { GaragesPage } from './garages-page';

const isList = (r: HttpRequest<unknown>) => r.url === '/api/garages';
const isCounters = (r: HttpRequest<unknown>) => r.url === '/api/garages/compteurs';

describe('GaragesPage', () => {
  let fixture: ComponentFixture<GaragesPage>;
  let http: HttpTestingController;
  let root: HTMLElement;

  const text = (element: Element | null) => (element?.textContent ?? '').replace(/\s+/g, ' ').trim();
  const rowsText = () => Array.from(root.querySelectorAll('tbody tr')).map((tr) => text(tr));
  /** Attend la stabilité : à n'utiliser qu'une fois toutes les requêtes ouvertes servies. */
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };
  /** Rend l'écran sans attendre : une requête HTTP simulée encore ouverte bloquerait `whenStable`. */
  const render = () => fixture.detectChanges();
  const click = (element: Element | null) => {
    (element as HTMLElement).click();
    render();
  };

  /** Crée l'écran avec le rôle voulu et répond aux deux premières requêtes (liste et compteurs). */
  const open = async (role: Role | null, rows: GarageDTO[] = [garage(), libre()], total = rows.length) => {
    TestBed.inject(AuthService).user.set(
      role ? { id: 1, login: 'u', email: 'u@example.com', role, actif: true } : null,
    );
    fixture = TestBed.createComponent(GaragesPage);
    root = fixture.nativeElement;
    render();
    http.expectOne(isList).flush(pageOf(rows, total));
    http.expectOne(isCounters).flush(COMPTEURS);
    await settle();
  };

  /** Répond à la liste et aux compteurs rechargés après une modification. */
  const flushReload = async (rows: GarageDTO[] = [garage(), libre()]) => {
    render();
    http.expectOne(isList).flush(pageOf(rows));
    http.expectOne(isCounters).flush(COMPTEURS);
    await settle();
  };

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideTestTranslations()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  describe('états', () => {
    it('affiche le chargement tant que la liste n\'est pas arrivée', async () => {
      TestBed.inject(AuthService).user.set({ id: 1, login: 'u', email: 'u@e.c', role: 'ADMIN', actif: true });
      fixture = TestBed.createComponent(GaragesPage);
      root = fixture.nativeElement;
      render();
      expect(text(root.querySelector('.dt__state'))).toBe('Chargement…');
      http.expectOne(isList).flush(pageOf([]));
      http.expectOne(isCounters).flush(COMPTEURS);
    });

    it('affiche la liste vide', async () => {
      await open('ADMIN', []);
      expect(text(root.querySelector('.dt__state'))).toBe('Aucun résultat.');
      expect(text(root.querySelector('.pg__count'))).toBe('0–0 sur 0 garages');
    });

    it('affiche le message d\'erreur et recharge au clic sur Réessayer', async () => {
      TestBed.inject(AuthService).user.set({ id: 1, login: 'u', email: 'u@e.c', role: 'ADMIN', actif: true });
      fixture = TestBed.createComponent(GaragesPage);
      root = fixture.nativeElement;
      render();
      http.expectOne(isList).flush({ code: 'ERREUR_INTERNE', message: 'Une erreur inattendue est survenue.' }, { status: 500, statusText: 'Server Error' });
      http.expectOne(isCounters).flush(COMPTEURS);
      await settle();
      expect(text(root.querySelector('.dt__state--error'))).toContain('Une erreur inattendue est survenue.');

      await click(root.querySelector('.dt__state--error button'));
      http.expectOne(isList).flush(pageOf([garage()]));
      http.expectOne(isCounters).flush(COMPTEURS);
      await settle();
      expect(root.querySelector('.dt__state--error')).toBeNull();
      expect(rowsText()).toHaveLength(1);
    });
  });

  describe('liste', () => {
    it('affiche une ligne par garage avec clés, loyer, locataire et statut', async () => {
      await open('ADMIN');
      const [rented, free] = rowsText();
      expect(rented).toContain('G01');
      expect(rented).toContain('3');
      expect(rented).toContain('90,00 €');
      expect(rented).toContain('MD');
      expect(rented).toContain('Marie Dupont');
      expect(rented).toContain('Loué');
      expect(free).toContain('G02');
      expect(free).toContain('85,00 €');
      expect(free).toContain('Libre');
      expect(free).not.toContain('Marie');
    });

    it('affiche le nombre de remarques en pastille, sans pastille pour zéro', async () => {
      await open('ADMIN');
      const [rented, free] = Array.from(root.querySelectorAll('tbody tr'));
      expect(text(rented.querySelector('.remarques__n'))).toBe('2');
      expect(free.querySelector('.remarques__n')).toBeNull();
    });

    it('affiche les filtres avec leurs compteurs, « Tous » actif par défaut', async () => {
      await open('ADMIN');
      const buttons = Array.from(root.querySelectorAll('.fb__btn'));
      expect(buttons.map((b) => text(b))).toEqual(['Loué (4)', 'Libre (6)', 'Indisponible (1)', 'Tous (11)']);
      expect(buttons.map((b) => b.classList.contains('is-active'))).toEqual([false, false, false, true]);
    });

    it('envoie le statut du filtre et revient à la page 1', async () => {
      await open('ADMIN', [garage(), libre()], 25);
      await click(root.querySelectorAll('.pg__btn')[2]);
      http.expectOne((r) => isList(r) && r.params.get('page') === '1').flush(pageOf([garage()], 25, 1));
      await settle();

      await click(root.querySelectorAll('.fb__btn')[1]);
      const request = http.expectOne(isList);
      expect(request.request.params.get('statut')).toBe('LIBRE');
      expect(request.request.params.get('page')).toBe('0');
      request.flush(pageOf([libre()]));
      await settle();
    });

    it('masque les colonnes devenues inutiles selon le filtre', async () => {
      const headers = () => Array.from(root.querySelectorAll('thead th')).map((th) => text(th).replace(/[↕▲▼]/g, '').trim());
      await open('ADMIN');
      expect(headers()).toEqual(['Garage', 'Clés', 'Réserve', 'Loyer', 'Remarques', 'Locataire', 'Statut', 'Historique', 'Actions']);

      await click(root.querySelectorAll('.fb__btn')[0]);
      http.expectOne(isList).flush(pageOf([garage()]));
      await settle();
      expect(headers()).toEqual(['Garage', 'Clés', 'Réserve', 'Loyer', 'Remarques', 'Locataire', 'Historique', 'Actions']);

      await click(root.querySelectorAll('.fb__btn')[1]);
      http.expectOne(isList).flush(pageOf([libre()]));
      await settle();
      expect(headers()).toEqual(['Garage', 'Clés', 'Réserve', 'Loyer', 'Remarques', 'Historique', 'Actions']);
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
      list.flush(pageOf([garage()]));
      const counters = http.expectOne(isCounters);
      expect(counters.request.params.get('q')).toBe('dupont');
      counters.flush({ LOUE: 1, LIBRE: 0, INDISPONIBLE: 0, TOUS: 1 });
      await settle();
      expect(text(root.querySelectorAll('.fb__btn')[3])).toBe('Tous (1)');
    });

    it('envoie les tris cumulés avec les propriétés de l\'API', async () => {
      await open('ADMIN');
      const sortButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('th .dt__sort'));
      await click(sortButtons[0]);
      http.expectOne(isList).flush(pageOf([garage()]));
      await settle();
      await click(root.querySelectorAll<HTMLButtonElement>('th .dt__sort')[3]);
      const request = http.expectOne(isList);
      expect(request.request.params.getAll('sort')).toEqual(['numero,asc', 'loyerCourant,asc']);
      request.flush(pageOf([garage()]));
      await settle();
      expect(text(root.querySelector('.dt-clear'))).toContain('Annuler les tris (2)');
    });

    it('pagine côté serveur 10 par 10', async () => {
      await open('ADMIN', [garage()], 25);
      expect(text(root.querySelector('.pg__count'))).toBe('1–10 sur 25 garages');
      await click(root.querySelectorAll('.pg__btn')[3]);
      const request = http.expectOne(isList);
      expect(request.request.params.get('page')).toBe('2');
      expect(request.request.params.get('size')).toBe('10');
      request.flush(pageOf([garage()], 25, 2));
      await settle();
      expect(text(root.querySelector('.pg__count'))).toBe('21–25 sur 25 garages');
    });
  });

  describe('droits', () => {
    const actionTitles = () =>
      Array.from(root.querySelectorAll('tbody tr:first-child .actions .icon-btn')).map((b) => b.getAttribute('aria-label'));

    it('Admin : crée, modifie et supprime', async () => {
      await open('ADMIN');
      expect(root.querySelector('[dtToolbarEnd]')).not.toBeNull();
      expect(actionTitles()).toEqual(['Modifier le garage', 'Supprimer le garage']);
    });

    it('Gestionnaire : crée et modifie, ne supprime pas', async () => {
      await open('GESTIONNAIRE');
      expect(root.querySelector('[dtToolbarEnd]')).not.toBeNull();
      expect(actionTitles()).toEqual(['Modifier le garage']);
    });

    it('Lecture seule : ni création ni suppression, « Visualiser » à la place de « Modifier »', async () => {
      await open('LECTURE_SEULE');
      expect(root.querySelector('[dtToolbarEnd]')).toBeNull();
      expect(actionTitles()).toEqual(['Visualiser le garage']);
      expect(root.querySelector('tbody tr:first-child .actions .fa-eye')).not.toBeNull();
    });

    it('Lecture seule : la fiche s\'ouvre en consultation, champs désactifs et sans Enregistrer', async () => {
      await open('LECTURE_SEULE');
      await click(root.querySelector('tbody tr:first-child .actions .icon-btn'));
      expect(text(root.querySelector('.modal__title'))).toBe('Visualiser le garage · G01');
      expect(Array.from(root.querySelectorAll<HTMLInputElement>('app-garage-form input')).every((i) => i.disabled)).toBe(true);
      expect(root.querySelector('app-garage-form button[type="submit"]')).toBeNull();
      expect(text(root.querySelector('.modal__foot'))).toBe('Annuler');
    });
  });

  describe('fiche garage', () => {
    const field = (name: string) => root.querySelector<HTMLInputElement>(`app-garage-form [formControlName="${name}"]`)!;
    const type = (input: HTMLInputElement, value: string) => {
      input.value = value;
      input.dispatchEvent(new Event('input'));
      render();
    };
    const submit = () => {
      root.querySelector('app-garage-form form')!.dispatchEvent(new Event('submit'));
      render();
    };

    it('crée un garage : numéro proposé, valeurs par défaut, envoi puis rechargement', async () => {
      await open('GESTIONNAIRE');
      await click(root.querySelector('[dtToolbarEnd]'));
      http.expectOne('/api/garages/prochain-numero').flush({ numero: 'G13' });
      await settle();

      expect(text(root.querySelector('.modal__title'))).toBe('Nouveau garage');
      expect(field('numero').value).toBe('G13');
      expect(field('nbClesTotal').value).toBe('2');
      expect(field('nbClesReserve').value).toBe('0');
      expect(root.querySelector<HTMLSelectElement>('app-garage-form select')!.value).toBe('LIBRE');
      expect(text(root.querySelector('app-garage-form .message-info'))).toContain('premier enregistrement');

      await type(field('loyerMontant'), '80');
      await type(root.querySelector<HTMLInputElement>('app-date-input input')!, '01112026');
      await submit();
      const post = http.expectOne((r) => r.method === 'POST' && r.url === '/api/garages');
      expect(post.request.body).toEqual({
        numero: 'G13',
        nbClesTotal: 2,
        nbClesReserve: 0,
        statutModifiable: 'LIBRE',
        loyerMontant: 80,
        loyerDateDebut: '2026-11-01',
      });
      post.flush(garage({ id: 13, numero: 'G13' }));
      await flushReload();
      expect(root.querySelector('app-garage-form')).toBeNull();
    });

    it('surligne ensemble les champs obligatoires vides sans rien envoyer', async () => {
      await open('GESTIONNAIRE');
      await click(root.querySelector('[dtToolbarEnd]'));
      http.expectOne('/api/garages/prochain-numero').flush({ numero: 'G13' });
      await settle();
      await type(field('nbClesTotal'), '');
      await submit();
      const invalid = Array.from(root.querySelectorAll('app-garage-form app-form-field')).map((f) => f.classList.contains('is-invalid'));
      // numéro (rempli), clés (vide), réserve (remplie), statut, loyer (vide), début du loyer (rempli)
      expect(invalid).toEqual([false, true, false, false, true, false]);
      http.expectNone((r) => r.method === 'POST');
    });

    it('affiche dans la fenêtre l\'erreur du back sans la fermer', async () => {
      await open('GESTIONNAIRE');
      await click(root.querySelector('[dtToolbarEnd]'));
      http.expectOne('/api/garages/prochain-numero').flush({ numero: 'G01' });
      await settle();
      await type(field('loyerMontant'), '80');
      await submit();
      http
        .expectOne((r) => r.method === 'POST')
        .flush({ code: 'GAR_NUM_EXISTE', message: 'Ce numéro de garage existe déjà.', details: [] }, { status: 409, statusText: 'Conflict' });
      await settle();
      expect(text(root.querySelector('app-garage-form .message-error[role="alert"]'))).toBe('Ce numéro de garage existe déjà.');
      expect(root.querySelector('app-garage-form')).not.toBeNull();
    });

    it('affiche les erreurs de champ du back sous chaque champ', async () => {
      await open('GESTIONNAIRE');
      await click(root.querySelector('[dtToolbarEnd]'));
      http.expectOne('/api/garages/prochain-numero').flush({ numero: 'G13' });
      await settle();
      await type(field('loyerMontant'), '80');
      await submit();
      http.expectOne((r) => r.method === 'POST').flush(
        {
          code: 'VALIDATION',
          message: 'Des champs obligatoires sont manquants ou invalides.',
          fieldErrors: { nbClesReserve: 'La réserve doit être comprise entre 0 et le nombre de clés.' },
          details: [],
        },
        { status: 422, statusText: 'Unprocessable Entity' },
      );
      await settle();
      expect(Array.from(root.querySelectorAll('app-garage-form .ff__error')).map((e) => text(e))).toEqual([
        'La réserve doit être comprise entre 0 et le nombre de clés.',
      ]);
    });

    it('modifie un garage libre : numéro figé, pas de loyer, statut modifiable', async () => {
      await open('GESTIONNAIRE', [libre({ statutModifiable: 'INDISPONIBLE', statut: 'INDISPONIBLE' })]);
      await click(root.querySelector('tbody tr .actions .icon-btn'));
      expect(text(root.querySelector('.modal__title'))).toBe('Modifier le garage · G02');
      expect(field('numero').disabled).toBe(true);
      expect(field('numero').value).toBe('G02');
      expect(root.querySelector('app-garage-form [formControlName="loyerMontant"]')).toBeNull();
      expect(text(root.querySelector('app-garage-form .message-info'))).toContain('historique des loyers');

      await type(field('nbClesTotal'), '4');
      await submit();
      const put = http.expectOne((r) => r.method === 'PUT' && r.url === '/api/garages/2');
      expect(put.request.body).toEqual({ nbClesTotal: 4, nbClesReserve: 1, statutModifiable: 'INDISPONIBLE' });
      put.flush(libre());
      await flushReload();
      expect(root.querySelector('app-garage-form')).toBeNull();
    });

    it('verrouille le statut d\'un garage loué et ne l\'envoie pas', async () => {
      await open('GESTIONNAIRE');
      await click(root.querySelector('tbody tr:first-child .actions .icon-btn'));
      const select = root.querySelector<HTMLSelectElement>('app-garage-form select')!;
      expect(select.disabled).toBe(true);
      expect(text(select)).toBe('Loué');
      await submit();
      const put = http.expectOne((r) => r.method === 'PUT');
      expect(put.request.body).toEqual({ nbClesTotal: 3, nbClesReserve: 1 });
      put.flush(garage());
      await flushReload();
    });

    it('ferme la fiche avec Annuler sans rien envoyer', async () => {
      await open('GESTIONNAIRE');
      await click(root.querySelector('tbody tr:first-child .actions .icon-btn'));
      await click(root.querySelector('.modal__foot .btn--secondary'));
      expect(root.querySelector('app-garage-form')).toBeNull();
    });
  });

  describe('suppression (Admin)', () => {
    const askDelete = async () => {
      await open('ADMIN', [libre()]);
      await click(root.querySelectorAll('tbody tr .actions .icon-btn')[1]);
    };

    it('demande confirmation, supprime puis recharge', async () => {
      await askDelete();
      expect(text(root.querySelector('.modal__title'))).toBe('Supprimer le garage G02 ?');
      expect(text(root.querySelector('.modal__body'))).toContain('Cette action est définitive');
      await click(root.querySelector('.modal__foot .btn--primary'));
      const del = http.expectOne((r) => r.method === 'DELETE' && r.url === '/api/garages/2');
      del.flush(null, { status: 204, statusText: 'No Content' });
      await flushReload([]);
      expect(root.querySelector('app-confirm')).toBeNull();
    });

    it('n\'envoie rien quand on répond Non', async () => {
      await askDelete();
      await click(root.querySelector('.modal__foot .btn--secondary'));
      expect(root.querySelector('app-confirm')).toBeNull();
      http.expectNone((r) => r.method === 'DELETE');
    });

    it('liste les motifs d\'un refus du back avec un seul bouton Fermer', async () => {
      await askDelete();
      await click(root.querySelector('.modal__foot .btn--primary'));
      http.expectOne((r) => r.method === 'DELETE').flush(
        {
          code: 'GAR_SUPPRESSION_REFUSEE',
          message: 'Ce garage ne peut pas être supprimé.',
          details: ['Le garage est actuellement loué (Marie Dupont).', 'Le garage a un historique de 2 location(s).'],
        },
        { status: 409, statusText: 'Conflict' },
      );
      await settle();
      expect(text(root.querySelector('.modal__title'))).toBe('Suppression impossible');
      expect(Array.from(root.querySelectorAll('.confirm__motifs li')).map((li) => text(li))).toEqual([
        'Le garage est actuellement loué (Marie Dupont).',
        'Le garage a un historique de 2 location(s).',
      ]);
      expect(Array.from(root.querySelectorAll('.modal__foot button')).map((b) => text(b))).toEqual(['Fermer']);
      await click(root.querySelector('.modal__foot button'));
      expect(root.querySelector('app-confirm')).toBeNull();
    });

    it('affiche une autre erreur dans la fenêtre sans la fermer', async () => {
      await askDelete();
      await click(root.querySelector('.modal__foot .btn--primary'));
      http.expectOne((r) => r.method === 'DELETE').flush(
        { code: 'ACCES_REFUSE', message: 'Droits insuffisants pour cette action.', details: [] },
        { status: 403, statusText: 'Forbidden' },
      );
      await settle();
      expect(text(root.querySelector('app-confirm .message-error'))).toBe('Droits insuffisants pour cette action.');
      expect(root.querySelector('app-confirm')).not.toBeNull();
    });
  });

  describe('historique des loyers', () => {
    const expectLoyers = (request: TestRequest | null = null) =>
      request ?? http.expectOne((r) => r.url === '/api/garages/1/loyers');

    it('s\'ouvre au clic sur la ligne, 5 loyers par page, et met la ligne en évidence', async () => {
      await open('ADMIN');
      await click(root.querySelector('tbody tr:first-child'));
      const request = expectLoyers();
      expect(request.request.params.get('size')).toBe('5');
      request.flush(pageOf([loyer()], 1, 0, 5));
      await settle();
      expect(text(root.querySelector('.modal__title'))).toBe('Historique des prix de loyers · G01');
      expect(root.querySelector('tbody tr.is-selected')).not.toBeNull();
    });

    it('s\'ouvre depuis le menu (…) de la ligne', async () => {
      await open('ADMIN');
      await click(root.querySelector('tbody tr:first-child td:nth-last-child(2) .icon-btn'));
      expect(text(root.querySelector('.pm__item'))).toBe('Historique des loyers');
      await click(root.querySelector('.pm__item'));
      expectLoyers().flush(pageOf([loyer()], 1, 0, 5));
      await settle();
      expect(root.querySelector('app-loyers-history')).not.toBeNull();
      expect(root.querySelector('.pm')).toBeNull();
    });

    it('propose aussi l\'historique des locations, qui s\'ouvre au clic', async () => {
      await open('ADMIN');
      await click(root.querySelector('tbody tr:first-child td:nth-last-child(2) .icon-btn'));
      expect(Array.from(root.querySelectorAll('.pm__item')).map((item) => text(item))).toEqual([
        'Historique des loyers',
        'Historique des locations',
      ]);
      await click(root.querySelectorAll('.pm__item')[1]);
      const request = http.expectOne((r) => r.url === '/api/garages/1/locations');
      expect(request.request.params.get('size')).toBe('5');
      request.flush(pageOf([location()], 1, 0, 5));
      await settle();
      expect(text(root.querySelector('.modal__title'))).toBe('Historique des locations · G01');
      expect(root.querySelector('app-loyers-history')).toBeNull();
      expect(root.querySelector('.pm')).toBeNull();

      await click(root.querySelector('.modal__foot .btn--primary'));
      expect(root.querySelector('app-locations-history')).toBeNull();
    });

    it('recharge la liste quand un loyer change', async () => {
      await open('ADMIN');
      await click(root.querySelector('tbody tr:first-child'));
      expectLoyers().flush(pageOf([loyer({ id: 9, etat: 'A_VENIR', supprimable: true, motifSuppression: null })], 1, 0, 5));
      await settle();
      await click(root.querySelector('app-loyers-history .lh__actions .icon-btn:last-child'));
      http.expectOne((r) => r.method === 'DELETE' && r.url === '/api/loyers/9').flush(null, { status: 204, statusText: 'No Content' });
      render();
      expectLoyers().flush(pageOf([loyer()], 1, 0, 5));
      await flushReload();
    });
  });

  describe('remarques (RG-REM-01)', () => {
    const isRemarques = (r: HttpRequest<unknown>) => r.method === 'GET' && r.url === '/api/garages/1/remarques';
    const openRemarks = async (role: Role = 'ADMIN') => {
      await open(role);
      await click(root.querySelector('tbody tr:first-child .remarques'));
      http.expectOne(isRemarques).flush([probleme(), remarque()]);
      await settle();
    };

    it('la pastille ouvre les remarques du garage à la place de la liste, sans ouvrir l\'historique des loyers', async () => {
      await openRemarks();
      expect(root.querySelector('app-data-table')).toBeNull();
      expect(root.querySelector('app-filter-buttons')).toBeNull();
      expect(root.querySelector('app-loyers-history')).toBeNull();
      http.expectNone((r) => r.url === '/api/garages/1/loyers');
      expect(text(root.querySelector('.back-link'))).toBe('Retour aux garages');
      expect(Array.from(root.querySelectorAll('app-remarques-view .rem')).map((item) => text(item.querySelector('.rem__texte')))).toEqual([
        'Fuite au plafond près de la porte.',
        'Télécommande de porte remplacée.',
      ]);
    });

    it('résume le garage : statut, locataire actuel, clés et réserve, loyer actuel', async () => {
      await openRemarks();
      expect(text(root.querySelector('.sc__kicker'))).toBe('Garage');
      expect(text(root.querySelector('.sc__title'))).toBe('G01');
      expect(Array.from(root.querySelectorAll('.sc__field')).map((f) => text(f))).toEqual([
        'StatutLoué',
        'Locataire actuelMarie Dupont',
        'Clés / réserve3 / 1',
        'Loyer actuel90,00 €',
      ]);
    });

    it('affiche des tirets pour un garage libre, sans locataire ni loyer', async () => {
      await open('ADMIN', [libre({ loyerCourant: null })]);
      await click(root.querySelector('tbody tr:first-child .remarques'));
      http.expectOne((r) => r.url === '/api/garages/2/remarques').flush([]);
      await settle();
      const fields = Array.from(root.querySelectorAll('.sc__field')).map((f) => text(f));
      expect(fields).toContain('Locataire actuel—');
      expect(fields).toContain('Loyer actuel—');
      expect(text(root.querySelector('app-remarques-view .rv__etat'))).toBe('Aucune remarque.');
    });

    it('« Retour aux garages » revient à la liste', async () => {
      await openRemarks();
      await click(root.querySelector('.back-link'));
      expect(root.querySelector('app-remarques-view')).toBeNull();
      expect(root.querySelector('app-data-table')).not.toBeNull();
      expect(rowsText()).toHaveLength(2);
    });

    it('recharge la liste et les compteurs quand une remarque change, pour que la pastille suive', async () => {
      await openRemarks();
      await click(root.querySelector('app-remarques-view .rem .fa-trash-can')!.closest('button'));
      http.expectOne((r) => r.method === 'DELETE' && r.url === '/api/remarques/2').flush(null, { status: 204, statusText: 'No Content' });
      render();
      http.expectOne(isRemarques).flush([remarque()]);
      await flushReload();
    });

    it('Lecture seule : consulte les remarques sans pouvoir en ajouter', async () => {
      await openRemarks('LECTURE_SEULE');
      expect(root.querySelector('app-remarques-view .rv__head .btn--primary')).toBeNull();
    });
  });
});
