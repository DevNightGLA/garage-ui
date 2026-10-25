import { HttpRequest, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { pageOf } from '../../../../testing/garage-fixtures';
import {
  SYNTHESE,
  VERSEMENTS,
  paiement,
  paiementPartiel,
  paiementPaye,
} from '../../../../testing/paiement-fixtures';
import { provideTestTranslations } from '../../../../testing/translations';
import { AuthService } from '../../../core/auth/auth-service';
import { Role } from '../../../core/auth/auth.models';
import { TODAY } from '../../../core/today';
import { PaiementDTO } from '../paiement.models';
import { PaiementsPage } from './paiements-page';

const isList = (r: HttpRequest<unknown>) => r.url === '/api/paiements';
const isSummary = (r: HttpRequest<unknown>) => r.url === '/api/paiements/synthese';
const isVersements = (r: HttpRequest<unknown>) => r.url === '/api/paiements/versements';

describe('PaiementsPage', () => {
  let fixture: ComponentFixture<PaiementsPage>;
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
  const click = (element: Element | null) => {
    (element as HTMLElement).click();
    render();
  };
  const signIn = (role: Role | null) =>
    TestBed.inject(AuthService).user.set(
      role ? { id: 1, login: 'u', email: 'u@example.com', role, actif: true } : null,
    );

  /** Crée l'écran avec le rôle voulu et répond aux deux premières requêtes (liste et synthèse). */
  const open = async (
    role: Role | null,
    rows: PaiementDTO[] = [paiement(), paiementPartiel(), paiementPaye()],
    total = rows.length,
  ) => {
    signIn(role);
    fixture = TestBed.createComponent(PaiementsPage);
    root = fixture.nativeElement;
    render();
    http.expectOne(isList).flush(pageOf(rows, total));
    http.expectOne(isSummary).flush(SYNTHESE);
    await settle();
  };

  /** Répond à la liste et à la synthèse rechargées après un paiement ou une annulation. */
  const flushReload = async (rows: PaiementDTO[] = [paiement(), paiementPartiel(), paiementPaye()]) => {
    render();
    http.expectOne(isList).flush(pageOf(rows));
    http.expectOne(isSummary).flush(SYNTHESE);
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
      fixture = TestBed.createComponent(PaiementsPage);
      root = fixture.nativeElement;
      render();
      expect(text(root.querySelector('.dt__state'))).toBe('Chargement…');
      http.expectOne(isList).flush(pageOf([]));
      http.expectOne(isSummary).flush(SYNTHESE);
    });

    it('affiche la liste vide', async () => {
      await open('ADMIN', []);
      expect(text(root.querySelector('.dt__state'))).toBe('Aucun résultat.');
      expect(text(root.querySelector('.pg__count'))).toBe('0–0 sur 0 paiements');
    });

    it('affiche le message d\'erreur et recharge au clic sur Réessayer', async () => {
      signIn('ADMIN');
      fixture = TestBed.createComponent(PaiementsPage);
      root = fixture.nativeElement;
      render();
      http
        .expectOne(isList)
        .flush({ code: 'ERREUR_INTERNE', message: 'Une erreur inattendue est survenue.' }, { status: 500, statusText: 'Server Error' });
      http.expectOne(isSummary).flush(SYNTHESE);
      await settle();
      expect(text(root.querySelector('.dt__state--error'))).toContain('Une erreur inattendue est survenue.');

      click(root.querySelector('.dt__state--error button'));
      http.expectOne(isList).flush(pageOf([paiement()]));
      http.expectOne(isSummary).flush(SYNTHESE);
      await settle();
      expect(root.querySelector('.dt__state--error')).toBeNull();
      expect(rowsText()).toHaveLength(1);
    });
  });

  describe('mois, indicateurs et filtres', () => {
    it('demande le mois courant, tous les statuts, sans tri, 10 par page', async () => {
      signIn('ADMIN');
      fixture = TestBed.createComponent(PaiementsPage);
      root = fixture.nativeElement;
      render();
      const request = http.expectOne(isList);
      expect(request.request.params.get('mois')).toBe('2026-10');
      expect(request.request.params.has('statut')).toBe(false);
      expect(request.request.params.get('page')).toBe('0');
      expect(request.request.params.get('size')).toBe('10');
      expect(request.request.params.has('sort')).toBe(false);
      request.flush(pageOf([paiement()]));
      const summary = http.expectOne(isSummary);
      expect(summary.request.params.get('mois')).toBe('2026-10');
      summary.flush(SYNTHESE);
      await settle();
      expect(text(root.querySelector('.mp__btn'))).toBe('Octobre 2026');
    });

    it('affiche l\'attendu, l\'encaissé ventilé virement et espèces, et le retard', async () => {
      await open('ADMIN');
      const [expected, collected, late] = Array.from(root.querySelectorAll('.kpi')).map((kpi) => text(kpi));
      expect(expected).toBe('Attendu600,00 €');
      expect(collected).toContain('Encaissé');
      expect(collected).toContain('370,00 €');
      expect(collected).toContain('285,00 €');
      expect(collected).toContain('85,00 €');
      expect(late).toBe('En retard120,50 €');
    });

    it('affiche les filtres dans l\'ordre de la maquette avec leurs compteurs, « Tous » actif par défaut', async () => {
      await open('ADMIN');
      const buttons = Array.from(root.querySelectorAll('.fb__btn'));
      expect(buttons.map((b) => text(b))).toEqual(['À payer (2)', 'Partiel (1)', 'Payé (4)', 'Tous (7)']);
      expect(buttons.map((b) => b.classList.contains('is-active'))).toEqual([false, false, false, true]);
    });

    it('envoie le statut du filtre, revient à la page 1 et n\'envoie rien pour « Tous »', async () => {
      await open('ADMIN', [paiement()], 25);
      click(root.querySelectorAll('.pg__btn')[2]);
      http.expectOne((r) => isList(r) && r.params.get('page') === '1').flush(pageOf([paiement()], 25, 1));
      await settle();

      click(root.querySelectorAll('.fb__btn')[1]);
      const partial = http.expectOne(isList);
      expect(partial.request.params.get('statut')).toBe('PARTIEL');
      expect(partial.request.params.get('page')).toBe('0');
      expect(partial.request.params.get('mois')).toBe('2026-10');
      partial.flush(pageOf([paiementPartiel()]));
      await settle();

      click(root.querySelectorAll('.fb__btn')[3]);
      const all = http.expectOne(isList);
      expect(all.request.params.has('statut')).toBe(false);
      all.flush(pageOf([paiement()]));
      await settle();
      expect(text(root.querySelector('.fb__btn.is-active'))).toBe('Tous (7)');
    });

    it('masque la colonne Statut dès qu\'un filtre par statut est choisi', async () => {
      await open('ADMIN');
      expect(headers()).toEqual(['Locataire', 'Garage', 'Montant', 'Payé le', 'Mode', 'Statut', 'Actions']);
      click(root.querySelectorAll('.fb__btn')[0]);
      http.expectOne(isList).flush(pageOf([paiement()]));
      await settle();
      expect(headers()).toEqual(['Locataire', 'Garage', 'Montant', 'Payé le', 'Mode', 'Actions']);
    });

    it('change de mois : nouvelle liste et nouvelle synthèse, retour à la page 1', async () => {
      await open('ADMIN', [paiement()], 25);
      click(root.querySelectorAll('.pg__btn')[2]);
      http.expectOne((r) => isList(r) && r.params.get('page') === '1').flush(pageOf([paiement()], 25, 1));
      await settle();

      click(root.querySelector('.mp__btn'));
      click(root.querySelectorAll('.mp__month')[8]);
      const list = http.expectOne(isList);
      expect(list.request.params.get('mois')).toBe('2026-09');
      expect(list.request.params.get('page')).toBe('0');
      list.flush(pageOf([paiement({ periode: '2026-09-01' })]));
      const summary = http.expectOne(isSummary);
      expect(summary.request.params.get('mois')).toBe('2026-09');
      summary.flush(SYNTHESE);
      await settle();
      expect(text(root.querySelector('.mp__btn'))).toBe('Septembre 2026');
    });

    it('envoie la recherche au serveur et recharge la synthèse', async () => {
      await open('ADMIN');
      const field = root.querySelector<HTMLInputElement>('app-search-input input')!;
      field.value = 'dupont';
      field.dispatchEvent(new Event('input'));
      field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      render();
      const list = http.expectOne(isList);
      expect(list.request.params.get('q')).toBe('dupont');
      expect(list.request.params.get('page')).toBe('0');
      list.flush(pageOf([paiement()]));
      const summary = http.expectOne(isSummary);
      expect(summary.request.params.get('q')).toBe('dupont');
      summary.flush({ ...SYNTHESE, compteurs: { A_PAYER: 1, PARTIEL: 0, PAYE: 0, TOUS: 1 } });
      await settle();
      expect(text(root.querySelectorAll('.fb__btn')[3])).toBe('Tous (1)');
    });

    it('envoie les tris cumulés avec les propriétés de l\'API', async () => {
      await open('ADMIN');
      click(root.querySelectorAll<HTMLButtonElement>('th .dt__sort')[0]);
      http.expectOne(isList).flush(pageOf([paiement()]));
      await settle();
      click(root.querySelectorAll<HTMLButtonElement>('th .dt__sort')[2]);
      const request = http.expectOne(isList);
      expect(request.request.params.getAll('sort')).toEqual(['locataire,asc', 'montantDu,asc']);
      request.flush(pageOf([paiement()]));
      await settle();
      expect(text(root.querySelector('.dt-clear'))).toContain('Annuler les tris (2)');
    });

    it('trie sur le garage, la date de paiement, le mode et le statut avec les bonnes propriétés', async () => {
      await open('ADMIN');
      for (const [index, key] of [
        [1, 'garage'],
        [3, 'dernierVersement'],
        [4, 'modePaiement'],
        [5, 'statut'],
      ] as const) {
        click(root.querySelectorAll<HTMLButtonElement>('th .dt__sort')[index]);
        const request = http.expectOne(isList);
        expect(request.request.params.getAll('sort')?.at(-1)).toBe(`${key},asc`);
        request.flush(pageOf([paiement()]));
        await settle();
      }
    });

    it('pagine côté serveur 10 par 10', async () => {
      await open('ADMIN', [paiement()], 25);
      expect(text(root.querySelector('.pg__count'))).toBe('1–10 sur 25 paiements');
      click(root.querySelectorAll('.pg__btn')[3]);
      const request = http.expectOne(isList);
      expect(request.request.params.get('page')).toBe('2');
      request.flush(pageOf([paiement()], 25, 2));
      await settle();
      expect(text(root.querySelector('.pg__count'))).toBe('21–25 sur 25 paiements');
    });
  });

  describe('lignes', () => {
    it('affiche locataire, garage, montant, date et mode du dernier versement', async () => {
      await open('ADMIN');
      const [toPay, partial, paid] = rowsText();
      expect(toPay).toContain('Marie Dupont');
      expect(toPay).toContain('MD');
      expect(toPay).toContain('G01');
      expect(toPay).toContain('90,00 €');
      expect(partial).toContain('Jan Peeters');
      expect(partial).toContain('80,00 €');
      expect(partial).toContain('06/10/2026');
      expect(paid).toContain('Pieter Janssens');
      expect(paid).toContain('03/10/2026');
      expect(paid).toContain('Payé');
    });

    it('affiche le mode du dernier versement en icône avec info-bulle', async () => {
      await open('ADMIN');
      const [toPay, partial, paid] = Array.from(root.querySelectorAll('tbody tr'));
      expect(toPay.querySelector('.mode')).toBeNull();
      expect(partial.querySelector('.mode.fa-credit-card')?.getAttribute('aria-label')).toBe('Virement');
      expect(paid.querySelector('.mode.fa-coins')?.getAttribute('aria-label')).toBe('Espèces');
    });

    it('affiche le reste dû d\'un paiement partiel sous le montant, en rouge s\'il est en retard', async () => {
      await open('ADMIN', [paiementPartiel(), paiementPartiel({ locationId: 9, enRetard: true })]);
      const rests = Array.from(root.querySelectorAll('.montant__reste'));
      expect(rests.map((r) => text(r))).toEqual(['Reste 50,00 €', 'Reste 50,00 €']);
      expect(rests.map((r) => r.classList.contains('is-late'))).toEqual([false, true]);
    });

    it('n\'affiche pas de reste pour une ligne à payer ou payée', async () => {
      await open('ADMIN', [paiement(), paiementPaye()]);
      expect(root.querySelector('.montant__reste')).toBeNull();
    });

    it('colore le statut : payé en vert, partiel en orange, à payer en orange puis en rouge en retard', async () => {
      await open('ADMIN', [
        paiementPaye(),
        paiementPartiel({ enRetard: true }),
        paiement(),
        paiement({ locationId: 8, enRetard: true, echeanceId: 5 }),
      ]);
      const tones = Array.from(root.querySelectorAll('app-status-badge')).map((b) => ({
        label: text(b),
        tone: Array.from(b.classList).find((c) => c.startsWith('tone-')),
      }));
      expect(tones).toEqual([
        { label: 'Payé', tone: 'tone-success' },
        { label: 'Partiel', tone: 'tone-warning' },
        { label: 'À payer', tone: 'tone-warning' },
        { label: 'À payer', tone: 'tone-danger' },
      ]);
    });
  });

  describe('droits et boutons (RG-PAI-20)', () => {
    const actions = (row: number) =>
      Array.from(root.querySelectorAll('tbody tr')[row].querySelectorAll('.actions .icon-btn')).map((b) =>
        b.getAttribute('aria-label'),
      );

    it('Gestionnaire : payer en totalité et partiel sur une ligne non soldée, détail dès qu\'il y a un versement', async () => {
      await open('GESTIONNAIRE');
      expect(actions(0)).toEqual(['Payer en totalité', 'Paiement partiel']);
      expect(actions(1)).toEqual(['Payer en totalité', 'Paiement partiel', 'Détail des versements']);
      expect(actions(2)).toEqual(['Détail des versements']);
    });

    it('Admin : mêmes boutons que le Gestionnaire', async () => {
      await open('ADMIN');
      expect(actions(0)).toEqual(['Payer en totalité', 'Paiement partiel']);
    });

    it('Lecture seule : aucun bouton de paiement, mais le détail des versements', async () => {
      await open('LECTURE_SEULE');
      expect(actions(0)).toEqual([]);
      expect(actions(1)).toEqual(['Détail des versements']);
      expect(actions(2)).toEqual(['Détail des versements']);
      expect(root.querySelector('tbody tr .actions')!.classList.contains('cell-empty')).toBe(true);
    });
  });

  describe('fiche de paiement', () => {
    const field = (name: string) =>
      root.querySelector<HTMLInputElement | HTMLSelectElement>(`app-paiement-form [formControlName="${name}"]`)!;
    const type = (name: string, value: string, event = 'input') => {
      const control = field(name);
      control.value = value;
      control.dispatchEvent(new Event(event));
      render();
    };
    const submit = () => {
      root.querySelector('app-paiement-form form')!.dispatchEvent(new Event('submit'));
      render();
    };

    it('Payer en totalité : titre, ligne concernée, reste dû, mode et date du jour, sans montant', async () => {
      await open('GESTIONNAIRE', [paiementPartiel()]);
      click(root.querySelectorAll('tbody tr .actions .icon-btn')[0]);
      expect(text(root.querySelector('.modal__title'))).toBe('Payer en totalité');
      expect(text(root.querySelector('.modal__subtitle'))).toBe('Jan Peeters · G02 · Octobre 2026');
      expect(text(root.querySelector('.pf-info'))).toBe('Montant : 50,00 €');
      expect(root.querySelector('app-paiement-form [formControlName="montant"]')).toBeNull();
      expect(field('modePaiement').value).toBe('VIREMENT');
      expect(root.querySelector<HTMLInputElement>('app-paiement-form app-date-input input')!.value).toBe('25/10/2026');
    });

    it('Payer en totalité : envoie le type TOTAL sans montant, puis recharge la liste et la synthèse', async () => {
      await open('GESTIONNAIRE', [paiementPartiel()]);
      click(root.querySelectorAll('tbody tr .actions .icon-btn')[0]);
      type('modePaiement', 'ESPECES', 'change');
      submit();
      const post = http.expectOne((r) => r.method === 'POST' && r.url === '/api/paiements');
      expect(post.request.body).toEqual({
        locationId: 2,
        mois: '2026-10',
        type: 'TOTAL',
        modePaiement: 'ESPECES',
        datePaiement: '2026-10-25',
      });
      post.flush(paiementPaye({ locationId: 2 }));
      await flushReload();
      expect(root.querySelector('app-paiement-form')).toBeNull();
    });

    it('Paiement partiel : le reste dû est en rouge et le montant reçu est demandé', async () => {
      await open('GESTIONNAIRE', [paiementPartiel()]);
      click(root.querySelectorAll('tbody tr .actions .icon-btn')[1]);
      expect(text(root.querySelector('.modal__title'))).toBe('Paiement partiel');
      expect(text(root.querySelector('.pf-info'))).toBe('Reste dû : 50,00 €');
      expect(root.querySelector('.pf-info')!.classList.contains('is-partial')).toBe(true);
      expect(text(root.querySelector('app-paiement-form app-form-field .ff__label'))).toBe('Montant reçu (€) *');
    });

    it('Paiement partiel : envoie le type PARTIEL et le montant', async () => {
      await open('GESTIONNAIRE', [paiement()]);
      click(root.querySelectorAll('tbody tr .actions .icon-btn')[1]);
      type('montant', '30.5');
      submit();
      const post = http.expectOne((r) => r.method === 'POST');
      expect(post.request.body).toEqual({
        locationId: 1,
        mois: '2026-10',
        type: 'PARTIEL',
        montant: 30.5,
        modePaiement: 'VIREMENT',
        datePaiement: '2026-10-25',
      });
      post.flush(paiementPartiel({ locationId: 1 }));
      await flushReload();
    });

    it('Paiement partiel : surligne le montant vide sans rien envoyer', async () => {
      await open('GESTIONNAIRE', [paiement()]);
      click(root.querySelectorAll('tbody tr .actions .icon-btn')[1]);
      submit();
      const invalid = Array.from(root.querySelectorAll('app-paiement-form app-form-field.is-invalid')).map((f) =>
        text(f.querySelector('.ff__label')),
      );
      expect(invalid).toEqual(['Montant reçu (€) *']);
      http.expectNone((r) => r.method === 'POST');
    });

    it('surligne ensemble le montant et la date vides', async () => {
      await open('GESTIONNAIRE', [paiement()]);
      click(root.querySelectorAll('tbody tr .actions .icon-btn')[1]);
      const dateInput = root.querySelector<HTMLInputElement>('app-paiement-form app-date-input input')!;
      dateInput.value = '';
      dateInput.dispatchEvent(new Event('input'));
      render();
      submit();
      const invalid = Array.from(root.querySelectorAll('app-paiement-form app-form-field.is-invalid')).map((f) =>
        text(f.querySelector('.ff__label')),
      );
      expect(invalid).toEqual(['Montant reçu (€) *', 'Payé le *']);
      http.expectNone((r) => r.method === 'POST');
    });

    it('affiche dans la fenêtre l\'erreur du back sur le montant sans la fermer', async () => {
      await open('GESTIONNAIRE', [paiement()]);
      click(root.querySelectorAll('tbody tr .actions .icon-btn')[1]);
      type('montant', '90');
      submit();
      http.expectOne((r) => r.method === 'POST').flush(
        {
          code: 'PAI_MONTANT_PARTIEL',
          message: 'Le montant doit être inférieur au reste dû (90,00 €). Utilisez « Payer en totalité ».',
          details: [],
        },
        { status: 409, statusText: 'Conflict' },
      );
      await settle();
      expect(text(root.querySelector('app-paiement-form .message-error[role="alert"]'))).toBe(
        'Le montant doit être inférieur au reste dû (90,00 €). Utilisez « Payer en totalité ».',
      );
      expect(root.querySelector('app-paiement-form')).not.toBeNull();
    });

    it('affiche les erreurs de champ du back sous chaque champ', async () => {
      await open('GESTIONNAIRE', [paiement()]);
      click(root.querySelectorAll('tbody tr .actions .icon-btn')[1]);
      type('montant', '0');
      submit();
      http.expectOne((r) => r.method === 'POST').flush(
        {
          code: 'VALIDATION',
          message: 'Des champs obligatoires sont manquants ou invalides.',
          fieldErrors: { montant: 'Le montant doit être supérieur à 0.' },
          details: [],
        },
        { status: 422, statusText: 'Unprocessable Entity' },
      );
      await settle();
      expect(Array.from(root.querySelectorAll('app-paiement-form .ff__error')).map((e) => text(e))).toEqual([
        'Le montant doit être supérieur à 0.',
      ]);
    });

    it('ferme la fiche avec Annuler sans rien envoyer', async () => {
      await open('GESTIONNAIRE', [paiement()]);
      click(root.querySelectorAll('tbody tr .actions .icon-btn')[0]);
      click(root.querySelector('.modal__foot .btn--secondary'));
      expect(root.querySelector('app-paiement-form')).toBeNull();
      http.expectNone((r) => r.method !== 'GET');
    });

    it('paie le mois choisi, pas le mois courant', async () => {
      await open('GESTIONNAIRE', [paiement()]);
      click(root.querySelector('.mp__btn'));
      click(root.querySelectorAll('.mp__month')[7]);
      http.expectOne(isList).flush(pageOf([paiement({ periode: '2026-08-01' })]));
      http.expectOne(isSummary).flush(SYNTHESE);
      await settle();
      click(root.querySelectorAll('tbody tr .actions .icon-btn')[0]);
      expect(text(root.querySelector('.modal__subtitle'))).toContain('Août 2026');
      submit();
      const post = http.expectOne((r) => r.method === 'POST');
      expect(post.request.body.mois).toBe('2026-08');
      post.flush(paiementPaye());
      await flushReload();
    });
  });

  describe('détail des versements (RG-PAI-24 et 25)', () => {
    const openDetail = async (role: Role) => {
      await open(role, [paiementPartiel()]);
      click(root.querySelector('tbody tr .fa-list')!.closest('button'));
      http.expectOne(isVersements).flush(VERSEMENTS);
      await settle();
    };
    const cancelButtons = () => Array.from(root.querySelectorAll('app-versements-detail .vd .icon-btn'));

    it('demande les versements de la location et du mois, et affiche dû, reçu et reste dû', async () => {
      await open('ADMIN', [paiementPartiel()]);
      click(root.querySelector('tbody tr .fa-list')!.closest('button'));
      const request = http.expectOne(isVersements);
      expect(request.request.params.get('locationId')).toBe('2');
      expect(request.request.params.get('mois')).toBe('2026-10');
      request.flush(VERSEMENTS);
      await settle();
      expect(text(root.querySelector('.modal__title'))).toBe('Détail des versements');
      expect(text(root.querySelector('.modal__subtitle'))).toBe('Jan Peeters · G02 · Octobre 2026');
      expect(Array.from(root.querySelectorAll('.vd__total')).map((t) => text(t))).toEqual([
        'Montant dû80,00 €',
        'Reçu30,00 €',
        'Reste dû50,00 €',
      ]);
      expect(root.querySelector('.vd__valeur.is-due')).not.toBeNull();
    });

    it('liste chaque versement avec sa date, son mode et son montant', async () => {
      await openDetail('ADMIN');
      const rows = Array.from(root.querySelectorAll('app-versements-detail .vd tbody tr'));
      expect(rows.map((r) => text(r))).toEqual(['02/10/202610,00 €', '06/10/202620,00 €']);
      expect(rows[0].querySelector('.fa-coins')?.getAttribute('aria-label')).toBe('Espèces');
      expect(rows[1].querySelector('.fa-credit-card')?.getAttribute('aria-label')).toBe('Virement');
    });

    it('Admin : peut annuler chaque versement', async () => {
      await openDetail('ADMIN');
      expect(cancelButtons().map((b) => b.getAttribute('aria-label'))).toEqual([
        'Annuler ce versement',
        'Annuler ce versement',
      ]);
    });

    it('Gestionnaire et Lecture seule : ne peuvent pas annuler', async () => {
      await openDetail('GESTIONNAIRE');
      expect(cancelButtons()).toHaveLength(0);
      click(root.querySelector('.modal__foot .btn--primary'));
      expect(root.querySelector('app-versements-detail')).toBeNull();
    });

    it('Lecture seule : consulte le détail', async () => {
      await open('LECTURE_SEULE', [paiementPartiel()]);
      click(root.querySelector('tbody tr .fa-list')!.closest('button'));
      http.expectOne(isVersements).flush(VERSEMENTS);
      await settle();
      expect(cancelButtons()).toHaveLength(0);
      expect(root.querySelectorAll('app-versements-detail .vd tbody tr')).toHaveLength(2);
    });

    it('annule un versement, recharge le détail puis la liste et la synthèse', async () => {
      await openDetail('ADMIN');
      click(cancelButtons()[0]);
      http.expectOne((r) => r.method === 'DELETE' && r.url === '/api/paiements/versements/21').flush(null, {
        status: 204,
        statusText: 'No Content',
      });
      render();
      http.expectOne(isVersements).flush({
        montantDu: 80,
        montantRecu: 20,
        resteDu: 60,
        versements: [VERSEMENTS.versements[1]],
      });
      http.expectOne(isList).flush(pageOf([paiementPartiel({ montantRecu: 20, resteDu: 60 })]));
      http.expectOne(isSummary).flush(SYNTHESE);
      await settle();
      expect(root.querySelectorAll('app-versements-detail .vd tbody tr')).toHaveLength(1);
      expect(text(root.querySelector('app-versements-detail .vd__total:last-child'))).toBe('Reste dû60,00 €');
      expect(root.querySelector('app-versements-detail')).not.toBeNull();
    });

    it('annuler le dernier versement laisse le détail ouvert avec « Aucun versement. »', async () => {
      await open('ADMIN', [paiementPartiel()]);
      click(root.querySelector('tbody tr .fa-list')!.closest('button'));
      http.expectOne(isVersements).flush({
        montantDu: 80,
        montantRecu: 30,
        resteDu: 50,
        versements: [VERSEMENTS.versements[1]],
      });
      await settle();
      click(cancelButtons()[0]);
      http.expectOne((r) => r.method === 'DELETE').flush(null, { status: 204, statusText: 'No Content' });
      render();
      http.expectOne(isVersements).flush({ montantDu: 80, montantRecu: 0, resteDu: 80, versements: [] });
      http.expectOne(isList).flush(pageOf([paiementPartiel({ montantRecu: 0, resteDu: 80, nbVersements: 0, statut: 'A_PAYER' })]));
      http.expectOne(isSummary).flush(SYNTHESE);
      await settle();
      expect(text(root.querySelector('app-versements-detail .vd__state'))).toBe('Aucun versement.');
    });

    it('affiche l\'erreur du back dans la fenêtre quand l\'annulation échoue', async () => {
      await openDetail('ADMIN');
      click(cancelButtons()[1]);
      http.expectOne((r) => r.method === 'DELETE').flush(
        { code: 'PAI_VERSEMENT_INTROUVABLE', message: 'Versement introuvable.', details: [] },
        { status: 404, statusText: 'Not Found' },
      );
      await settle();
      expect(text(root.querySelector('app-versements-detail .message-error[role="alert"]'))).toBe('Versement introuvable.');
      expect(root.querySelectorAll('app-versements-detail .vd tbody tr')).toHaveLength(2);
    });

    it('affiche l\'erreur de chargement et recharge au clic sur Réessayer', async () => {
      await open('ADMIN', [paiementPartiel()]);
      click(root.querySelector('tbody tr .fa-list')!.closest('button'));
      http
        .expectOne(isVersements)
        .flush({ code: 'PAI_LOCATION_NON_COUVERTE', message: 'Aucune location ne couvre ce mois.', details: [] }, { status: 409, statusText: 'Conflict' });
      await settle();
      expect(text(root.querySelector('app-versements-detail .vd__state--error'))).toContain('Aucune location ne couvre ce mois.');
      click(root.querySelector('app-versements-detail .vd__state--error button'));
      http.expectOne(isVersements).flush(VERSEMENTS);
      await settle();
      expect(root.querySelector('app-versements-detail .vd__state--error')).toBeNull();
    });

    it('se ferme avec Fermer', async () => {
      await openDetail('ADMIN');
      click(root.querySelector('.modal__foot .btn--primary'));
      expect(root.querySelector('app-versements-detail')).toBeNull();
    });
  });
});
