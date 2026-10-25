import { HttpRequest, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { garage, loyer, pageOf } from '../../../../testing/garage-fixtures';
import { provideTestTranslations } from '../../../../testing/translations';
import { AuthService } from '../../../core/auth/auth-service';
import { Role } from '../../../core/auth/auth.models';
import { LoyerDTO } from '../garage.models';
import { LoyersHistory } from './loyers-history';

const isLoyers = (r: HttpRequest<unknown>) => r.method === 'GET' && r.url === '/api/garages/1/loyers';

const BLOQUE = "Une location a débuté depuis la date de début de ce loyer";
const PAS_A_VENIR = "Seul le dernier loyer, s'il est à venir, peut être supprimé.";

describe('LoyersHistory', () => {
  let fixture: ComponentFixture<LoyersHistory>;
  let http: HttpTestingController;
  let root: HTMLElement;
  let changed: number;

  const text = (element: Element | null) => (element?.textContent ?? '').replace(/\s+/g, ' ').trim();
  const rows = () => Array.from(root.querySelectorAll('app-loyers-history tbody tr, .lh tbody tr'));
  const render = () => fixture.detectChanges();
  const settle = async () => {
    render();
    await fixture.whenStable();
  };
  const click = (element: Element | null) => {
    (element as HTMLElement).click();
    render();
  };
  const buttons = (row: number) => Array.from(rows()[row].querySelectorAll<HTMLButtonElement>('.icon-btn'));

  const create = (role: Role) => {
    TestBed.inject(AuthService).user.set({ id: 1, login: 'u', email: 'u@e.c', role, actif: true });
    fixture = TestBed.createComponent(LoyersHistory);
    fixture.componentRef.setInput('garage', garage());
    changed = 0;
    fixture.componentInstance.changed.subscribe(() => changed++);
    root = fixture.nativeElement;
    render();
  };

  /** Ouvre l'historique et répond à la première page. */
  const open = async (role: Role, content: LoyerDTO[] = [loyer()], total = content.length) => {
    create(role);
    http.expectOne(isLoyers).flush(pageOf(content, total, 0, 5));
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
    it('affiche le chargement, puis la liste', async () => {
      create('ADMIN');
      expect(text(root.querySelector('.lh__state'))).toBe('Chargement…');
      const request = http.expectOne(isLoyers);
      expect(request.request.params.get('page')).toBe('0');
      expect(request.request.params.get('size')).toBe('5');
      request.flush(pageOf([loyer()], 1, 0, 5));
      await settle();
      expect(root.querySelector('.lh__state')).toBeNull();
    });

    it('affiche la liste vide', async () => {
      await open('ADMIN', []);
      expect(text(root.querySelector('.lh__state'))).toBe('Aucun loyer.');
      expect(text(root.querySelector('.pg__count'))).toBe('0–0 sur 0 loyers');
    });

    it('affiche l\'erreur et recharge au clic sur Réessayer', async () => {
      create('ADMIN');
      http.expectOne(isLoyers).flush({ code: 'ERREUR_INTERNE', message: 'Une erreur inattendue est survenue.' }, { status: 500, statusText: 'Server Error' });
      await settle();
      expect(text(root.querySelector('.lh__state--error'))).toContain('Une erreur inattendue est survenue.');
      click(root.querySelector('.lh__state--error button'));
      http.expectOne(isLoyers).flush(pageOf([loyer()], 1, 0, 5));
      await settle();
      expect(root.querySelector('.lh__state--error')).toBeNull();
      expect(rows()).toHaveLength(1);
    });
  });

  describe('liste', () => {
    const history = [
      loyer({ id: 9, montant: 95, dateDebut: '2026-11-01', etat: 'A_VENIR', modifiable: true, supprimable: true, motifSuppression: null }),
      loyer({ id: 8, montant: 90, dateDebut: '2026-01-01', dateFin: '2026-10-31', etat: 'CLOTURE' }),
      loyer({ id: 7, montant: 80, dateDebut: '2025-01-01', dateFin: '2025-12-31', etat: 'EN_VIGUEUR' }),
    ];

    it('affiche montant, dates en jj/mm/aaaa et état de chaque loyer', async () => {
      await open('ADMIN', history);
      expect(rows().map((r) => text(r.querySelector('td:nth-child(1)')))).toEqual(['95,00 €', '90,00 €', '80,00 €']);
      expect(rows().map((r) => text(r.querySelector('td:nth-child(2)')))).toEqual(['01/11/2026', '01/01/2026', '01/01/2025']);
      expect(rows().map((r) => text(r.querySelector('td:nth-child(3)')))).toEqual(['', '31/10/2026', '31/12/2025']);
      expect(rows().map((r) => text(r.querySelector('app-status-badge')))).toEqual(['À venir', 'Clôturé', 'En vigueur']);
      expect(
        rows().map((r) => Array.from(r.querySelector('app-status-badge')!.classList).find((c) => c.startsWith('tone-'))),
      ).toEqual(['tone-info', 'tone-ancien', 'tone-success']);
    });

    it('place les actions sur le dernier loyer seulement', async () => {
      await open('ADMIN', history);
      expect(buttons(0)).toHaveLength(2);
      expect(buttons(1)).toHaveLength(0);
      expect(buttons(2)).toHaveLength(0);
    });

    it('pagine 5 par 5 et ne propose aucune action au-delà de la première page', async () => {
      await open('ADMIN', history, 12);
      expect(text(root.querySelector('.pg__count'))).toBe('1–5 sur 12 loyers');
      click(root.querySelectorAll('.pg__btn')[2]);
      const request = http.expectOne(isLoyers);
      expect(request.request.params.get('page')).toBe('1');
      request.flush(pageOf(history, 12, 1, 5));
      await settle();
      expect(text(root.querySelector('.pg__count'))).toBe('6–10 sur 12 loyers');
      expect(root.querySelectorAll('.lh .icon-btn')).toHaveLength(0);
    });
  });

  describe('droits et blocages décidés par l\'API', () => {
    it('Gestionnaire : modifie le dernier loyer quand l\'API l\'autorise', async () => {
      await open('GESTIONNAIRE', [loyer()]);
      const [edit] = buttons(0);
      expect(edit.getAttribute('aria-disabled')).toBe('false');
      expect(edit.getAttribute('aria-label')).toBe('Modifier le loyer');
      expect(buttons(0)).toHaveLength(1);
      click(edit);
      expect(text(root.querySelector('app-loyer-form .modal__title'))).toBe('Modifier le loyer · G01');
    });

    it('bloque la modification avec le motif de l\'API en info-bulle', async () => {
      await open('GESTIONNAIRE', [loyer({ modifiable: false, motifModification: BLOQUE })]);
      const [edit] = buttons(0);
      expect(edit.getAttribute('aria-disabled')).toBe('true');
      expect(edit.getAttribute('aria-label')).toBe(BLOQUE);
      click(edit);
      expect(root.querySelector('app-loyer-form')).toBeNull();
    });

    it('propose la suppression d\'un loyer à venir seulement, bloquée avec son motif', async () => {
      await open('ADMIN', [loyer({ etat: 'A_VENIR', supprimable: false, motifSuppression: 'Un paiement anticipé existe déjà.' })]);
      const [, remove] = buttons(0);
      expect(remove.getAttribute('aria-disabled')).toBe('true');
      expect(remove.getAttribute('aria-label')).toBe('Un paiement anticipé existe déjà.');
      click(remove);
      http.expectNone((r) => r.method === 'DELETE');
    });

    it('ne propose pas la suppression d\'un loyer en vigueur', async () => {
      await open('ADMIN', [loyer({ etat: 'EN_VIGUEUR', motifSuppression: PAS_A_VENIR })]);
      expect(buttons(0)).toHaveLength(1);
    });

    it('supprime un loyer à venir puis recharge et prévient l\'écran', async () => {
      await open('ADMIN', [loyer({ id: 9, etat: 'A_VENIR', supprimable: true, motifSuppression: null })]);
      click(buttons(0)[1]);
      http.expectOne((r) => r.method === 'DELETE' && r.url === '/api/loyers/9').flush(null, { status: 204, statusText: 'No Content' });
      render();
      http.expectOne(isLoyers).flush(pageOf([loyer()], 1, 0, 5));
      await settle();
      expect(changed).toBe(1);
      expect(root.querySelector('.message-warning')).toBeNull();
    });

    it('affiche dans un encadré l\'erreur du back à la suppression', async () => {
      await open('ADMIN', [loyer({ id: 9, etat: 'A_VENIR', supprimable: true, motifSuppression: null })]);
      click(buttons(0)[1]);
      const message = 'Modification et suppression impossibles : un paiement anticipé est déjà enregistré pour novembre 2026. Annulez d\'abord ce paiement dans l\'écran Paiements.';
      http.expectOne((r) => r.method === 'DELETE').flush(
        { code: 'LOY_PAIEMENT_ANTICIPE', message, details: [] },
        { status: 409, statusText: 'Conflict' },
      );
      await settle();
      expect(text(root.querySelector('.message-warning'))).toBe(message);
      expect(changed).toBe(0);
    });

    it('Lecture seule : pas de nouveau loyer ni de suppression, consultation seulement', async () => {
      await open('LECTURE_SEULE', [loyer({ etat: 'A_VENIR', supprimable: true, motifSuppression: null })]);
      expect(text(root.querySelector('.lh__toolbar'))).toBe('');
      expect(root.querySelector('.lh__toolbar')).toBeNull();
      expect(buttons(0)).toHaveLength(1);
      expect(buttons(0)[0].getAttribute('aria-label')).toBe('Visualiser le loyer');
      expect(buttons(0)[0].querySelector('.fa-eye')).not.toBeNull();
      click(buttons(0)[0]);
      expect(text(root.querySelector('app-loyer-form .modal__title'))).toBe('Visualiser le loyer · G01');
      expect(Array.from(root.querySelectorAll<HTMLInputElement>('app-loyer-form input')).every((i) => i.disabled)).toBe(true);
      expect(root.querySelector('app-loyer-form button[type="submit"]')).toBeNull();
    });
  });

  describe('formulaire de loyer', () => {
    const type = (input: HTMLInputElement, value: string) => {
      input.value = value;
      input.dispatchEvent(new Event('input'));
      render();
    };
    const submit = () => {
      root.querySelector('app-loyer-form form')!.dispatchEvent(new Event('submit'));
      render();
    };
    const montant = () => root.querySelector<HTMLInputElement>('app-loyer-form [formControlName="montant"]')!;
    const date = () => root.querySelector<HTMLInputElement>('app-loyer-form app-date-input input')!;

    it('crée un loyer : champs obligatoires surlignés ensemble, puis envoi, fermeture et rechargement', async () => {
      await open('GESTIONNAIRE');
      click(root.querySelector('.lh__toolbar .btn'));
      expect(text(root.querySelector('app-loyer-form .modal__title'))).toBe('Nouveau loyer · G01');

      submit();
      expect(Array.from(root.querySelectorAll('app-loyer-form app-form-field')).map((f) => f.classList.contains('is-invalid'))).toEqual([true, true]);
      http.expectNone((r) => r.method === 'POST');

      type(montant(), '95.5');
      type(date(), '01122026');
      submit();
      const post = http.expectOne((r) => r.method === 'POST' && r.url === '/api/garages/1/loyers');
      expect(post.request.body).toEqual({ montant: 95.5, dateDebut: '2026-12-01' });
      post.flush(loyer());
      render();
      http.expectOne(isLoyers).flush(pageOf([loyer()], 1, 0, 5));
      await settle();
      expect(root.querySelector('app-loyer-form')).toBeNull();
      expect(changed).toBe(1);
    });

    it('modifie le dernier loyer avec ses valeurs préremplies', async () => {
      await open('GESTIONNAIRE', [loyer({ id: 7, montant: 90, dateDebut: '2026-01-01' })]);
      click(buttons(0)[0]);
      expect(montant().value).toBe('90');
      expect(date().value).toBe('01/01/2026');
      type(montant(), '92');
      submit();
      const put = http.expectOne((r) => r.method === 'PUT' && r.url === '/api/loyers/7');
      expect(put.request.body).toEqual({ montant: 92, dateDebut: '2026-01-01' });
      put.flush(loyer());
      render();
      http.expectOne(isLoyers).flush(pageOf([loyer()], 1, 0, 5));
      await settle();
      expect(root.querySelector('app-loyer-form')).toBeNull();
    });

    it('affiche dans la fenêtre l\'erreur du back sans la fermer', async () => {
      await open('GESTIONNAIRE');
      click(root.querySelector('.lh__toolbar .btn'));
      type(montant(), '95');
      type(date(), '01012025');
      submit();
      const message = 'La date de début doit être postérieure au début du loyer précédent (01/01/2026) : pas de chevauchement.';
      http.expectOne((r) => r.method === 'POST').flush(
        { code: 'LOY_DEBUT_ANTERIEUR', message, details: [] },
        { status: 409, statusText: 'Conflict' },
      );
      await settle();
      expect(text(root.querySelector('app-loyer-form .message-error[role="alert"]'))).toBe(message);
      expect(root.querySelector('app-loyer-form')).not.toBeNull();
      expect(changed).toBe(0);
    });

    it('affiche les erreurs de champ du back', async () => {
      await open('GESTIONNAIRE');
      click(root.querySelector('.lh__toolbar .btn'));
      type(montant(), '-3');
      type(date(), '01122026');
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
      expect(Array.from(root.querySelectorAll('app-loyer-form .ff__error')).map((e) => text(e))).toEqual([
        'Le montant doit être supérieur à 0.',
      ]);
    });
  });

  it('se ferme avec Fermer', async () => {
    await open('ADMIN');
    let closed = 0;
    fixture.componentInstance.closed.subscribe(() => closed++);
    click(root.querySelector('.modal__foot .btn--primary'));
    expect(closed).toBe(1);
  });

  it('affiche les quatre rappels de règles', async () => {
    await open('ADMIN');
    const rules = Array.from(root.querySelectorAll('.lh__aide span')).map((s) => text(s));
    expect(rules).toEqual([
      'Seul le dernier loyer est modifiable.',
      'Un loyer ne peut être supprimé que si sa date de début est dans un mois futur.',
      'Modification et suppression sont bloquées si un paiement est déjà effectué sur la période.',
      'Un nouveau loyer clôture automatiquement le précédent (fin = veille du début).',
    ]);
  });
});
