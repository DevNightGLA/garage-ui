import { HttpRequest, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  CIBLE_GARAGE,
  CIBLE_LOCATAIRE,
  autre,
  probleme,
  problemeResolu,
  remarque,
} from '../../../../testing/remarque-fixtures';
import { provideTestTranslations } from '../../../../testing/translations';
import { AuthService } from '../../../core/auth/auth-service';
import { Role } from '../../../core/auth/auth.models';
import { TODAY } from '../../../core/today';
import { RemarqueCible, RemarqueDTO } from '../remarque.models';
import { RemarquesView } from './remarques-view';

const isList = (r: HttpRequest<unknown>) => r.method === 'GET' && r.url === '/api/garages/5/remarques';

describe('RemarquesView', () => {
  let fixture: ComponentFixture<RemarquesView>;
  let http: HttpTestingController;
  let root: HTMLElement;
  let changed: number;

  const text = (element: Element | null) => (element?.textContent ?? '').replace(/\s+/g, ' ').trim();
  const items = () => Array.from(root.querySelectorAll('.rem'));
  /** Attend la stabilité : à n'utiliser qu'une fois toutes les requêtes ouvertes servies. */
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };
  /** Rend l'écran sans attendre : une requête HTTP simulée encore ouverte bloquerait `whenStable`. */
  const render = () => fixture.detectChanges();
  const tick = () => new Promise<void>((resolve) => setTimeout(resolve));
  const click = (element: Element | null) => {
    (element as HTMLElement).click();
    render();
  };
  const signIn = (role: Role) =>
    TestBed.inject(AuthService).user.set({ id: 1, login: 'u', email: 'u@example.com', role, actif: true });
  const buttons = (index: number) =>
    Array.from(items()[index].querySelectorAll('.rem__actions button')).map((b) => b.getAttribute('aria-label'));

  const create = (role: Role, cible: RemarqueCible = CIBLE_GARAGE) => {
    signIn(role);
    fixture = TestBed.createComponent(RemarquesView);
    fixture.componentRef.setInput('cible', cible);
    changed = 0;
    fixture.componentInstance.changed.subscribe(() => changed++);
    root = fixture.nativeElement;
    render();
  };

  /** Ouvre la vue et répond à la liste. */
  const open = async (role: Role, list: RemarqueDTO[] = [probleme(), remarque(), autre()], cible?: RemarqueCible) => {
    create(role, cible);
    http.expectOne((r) => r.method === 'GET' && r.url.endsWith('/remarques')).flush(list);
    await settle();
  };

  /** Répond à la liste rechargée après une modification. */
  const flushReload = async (list: RemarqueDTO[] = [probleme(), remarque(), autre()]) => {
    render();
    http.expectOne((r) => r.method === 'GET' && r.url.endsWith('/remarques')).flush(list);
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
    it('affiche le chargement, puis la liste', async () => {
      create('ADMIN');
      expect(text(root.querySelector('.rv__etat'))).toBe('Chargement…');
      http.expectOne(isList).flush([remarque()]);
      await settle();
      expect(root.querySelector('.rv__etat')).toBeNull();
      expect(items()).toHaveLength(1);
    });

    it('affiche « Aucune remarque. » quand il n\'y en a aucune', async () => {
      await open('ADMIN', []);
      expect(text(root.querySelector('.rv__etat'))).toBe('Aucune remarque.');
    });

    it('affiche l\'erreur et recharge au clic sur Réessayer', async () => {
      create('ADMIN');
      http
        .expectOne(isList)
        .flush({ code: 'GAR_INTROUVABLE', message: 'Garage introuvable.', details: [] }, { status: 404, statusText: 'Not Found' });
      await settle();
      expect(text(root.querySelector('.rv__etat--erreur'))).toContain('Garage introuvable.');
      click(root.querySelector('.rv__etat--erreur button'));
      http.expectOne(isList).flush([remarque()]);
      await settle();
      expect(items()).toHaveLength(1);
    });

    it('demande les remarques du locataire quand la cible est un locataire', async () => {
      create('ADMIN', CIBLE_LOCATAIRE);
      http.expectOne((r) => r.method === 'GET' && r.url === '/api/locataires/4/remarques').flush([]);
      await settle();
    });
  });

  describe('liste', () => {
    it('affiche le type, la date et l\'heure de création, et le texte de chaque remarque', async () => {
      await open('ADMIN');
      const [problem, info, other] = items().map((item) => text(item));
      expect(problem).toContain('Problème');
      expect(problem).toContain('20/09/2026 14:10');
      expect(problem).toContain('Fuite au plafond près de la porte.');
      expect(info).toContain('Information');
      expect(info).toContain('03/07/2026 09:30');
      expect(info).toContain('Télécommande de porte remplacée.');
      expect(other).toContain('Autre');
    });

    it('colore le type : problème en rouge, information en bleu, autre en sombre', async () => {
      await open('ADMIN');
      const tones = Array.from(root.querySelectorAll('.rem app-status-badge')).map((badge) =>
        Array.from(badge.classList).find((c) => c.startsWith('tone-')),
      );
      expect(tones).toEqual(['tone-danger', 'tone-info', 'tone-dark']);
    });

    it('garde la mise en forme enrichie du texte (gras, listes)', async () => {
      await open('ADMIN', [remarque({ texte: '<p>Porte <strong>cassée</strong></p><ul><li>sol</li></ul>' })]);
      const body = root.querySelector('.rem__texte')!;
      expect(body.querySelector('strong')?.textContent).toBe('cassée');
      expect(body.querySelectorAll('li')).toHaveLength(1);
    });

    it('retire les paragraphes vides en tête et en queue du texte', async () => {
      await open('ADMIN', [remarque({ texte: '<p><br></p><p>Utile</p><p> </p>' })]);
      expect(root.querySelector('.rem__texte')!.innerHTML).toBe('<p>Utile</p>');
    });

    it('n\'exécute pas de script placé dans le texte', async () => {
      await open('ADMIN', [remarque({ texte: '<p>Texte<img src=x onerror="window.__piege = true"></p><script>window.__piege = true</script>' })]);
      expect((window as unknown as { __piege?: boolean }).__piege).toBeUndefined();
      expect(root.querySelector('.rem__texte script')).toBeNull();
    });

    it('affiche « Résolu le jj/mm/aaaa » pour un problème résolu, rien pour les autres types', async () => {
      await open('ADMIN', [problemeResolu(), probleme(), remarque()]);
      expect(items().map((item) => item.querySelector('.rem__resolu') !== null)).toEqual([true, false, false]);
      expect(text(items()[0].querySelector('.rem__resolu'))).toBe('Résolu le 28/09/2026');
    });

    it('affiche « Résolu » seul quand l\'API ne donne pas de date', async () => {
      await open('ADMIN', [problemeResolu({ dateResolution: null })]);
      expect(text(root.querySelector('.rem__resolu'))).toBe('Résolu');
    });

    it('ouvre un lien du texte dans un autre onglet sans quitter l\'écran', async () => {
      await open('ADMIN', [remarque({ texte: '<p><a href="https://example.com/aide">aide</a></p>' })]);
      const windowOpen = vi.spyOn(window, 'open').mockReturnValue(null);
      const link = root.querySelector<HTMLAnchorElement>('.rem__texte a')!;
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      link.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);
      expect(windowOpen).toHaveBeenCalledWith('https://example.com/aide', '_blank', 'noopener,noreferrer');
      windowOpen.mockRestore();
    });
  });

  describe('droits (RG-REM-04, 07 et 09)', () => {
    it('Admin : marque résolu un problème, modifie et supprime', async () => {
      await open('ADMIN');
      expect(root.querySelector('.rv__head .btn--primary')).not.toBeNull();
      expect(buttons(0)).toEqual(['Marquer résolu', 'Modifier la remarque', 'Supprimer la remarque']);
    });

    it('Gestionnaire : ajoute, résout et modifie, ne supprime pas', async () => {
      await open('GESTIONNAIRE');
      expect(root.querySelector('.rv__head .btn--primary')).not.toBeNull();
      expect(buttons(0)).toEqual(['Marquer résolu', 'Modifier la remarque']);
    });

    it('seul un problème propose de résoudre ou de rouvrir', async () => {
      await open('ADMIN', [probleme(), problemeResolu(), remarque(), autre()]);
      expect(buttons(0)[0]).toBe('Marquer résolu');
      expect(buttons(1)[0]).toBe('Rouvrir');
      expect(buttons(2)[0]).toBe('Modifier la remarque');
      expect(buttons(3)[0]).toBe('Modifier la remarque');
    });

    it('Lecture seule : ni ajout, ni résolution, ni suppression, « Visualiser » à la place de « Modifier »', async () => {
      await open('LECTURE_SEULE');
      expect(root.querySelector('.rv__head .btn--primary')).toBeNull();
      expect(buttons(0)).toEqual(['Visualiser la remarque']);
      expect(root.querySelector('.rem .fa-eye')).not.toBeNull();
    });

    it('Lecture seule : la fiche s\'ouvre en consultation, champs désactivés et sans Enregistrer', async () => {
      await open('LECTURE_SEULE');
      click(root.querySelector('.rem .icon-btn'));
      expect(text(root.querySelector('.modal__title'))).toBe('Visualiser la remarque · G05');
      expect(root.querySelector<HTMLSelectElement>('app-remarque-form select')!.disabled).toBe(true);
      expect(root.querySelector('app-remarque-form button[type="submit"]')).toBeNull();
      expect(text(root.querySelector('.modal__foot'))).toBe('Annuler');
      http.expectNone((r) => r.method !== 'GET');
    });
  });

  describe('fiche de remarque', () => {
    const setText = async (html: string) => {
      const editor = root.querySelector<HTMLElement>('app-remarque-form .ql-editor')!;
      editor.innerHTML = html;
      await tick();
      render();
    };
    const submit = () => {
      root.querySelector('app-remarque-form form')!.dispatchEvent(new Event('submit'));
      render();
    };
    const selectType = (value: string) => {
      const select = root.querySelector<HTMLSelectElement>('app-remarque-form select')!;
      select.value = value;
      select.dispatchEvent(new Event('change'));
      render();
    };

    it('crée une remarque : type Information par défaut, mention de la date de création', async () => {
      await open('GESTIONNAIRE', []);
      click(root.querySelector('.rv__head .btn--primary'));
      await tick();
      expect(text(root.querySelector('.modal__title'))).toBe('Nouvelle remarque · G05');
      expect(root.querySelector<HTMLSelectElement>('app-remarque-form select')!.value).toBe('INFORMATION');
      expect(root.querySelector('app-remarque-form .ql-toolbar')).not.toBeNull();
      expect(text(root.querySelector('app-remarque-form .message-info'))).toContain('La date de création est ajoutée automatiquement');
    });

    it('envoie le type et le texte, puis recharge la liste et prévient l\'écran', async () => {
      await open('GESTIONNAIRE', []);
      click(root.querySelector('.rv__head .btn--primary'));
      await tick();
      selectType('PROBLEME');
      await setText('<p>Fuite au <strong>plafond</strong></p>');
      submit();
      const post = http.expectOne((r) => r.method === 'POST' && r.url === '/api/garages/5/remarques');
      expect(post.request.body.type).toBe('PROBLEME');
      // Quill remplace les espaces de l'éditeur par des espaces insécables
      expect(post.request.body.texte).toMatch(/^<p>Fuite(&nbsp;| )au(&nbsp;| )<strong>plafond<\/strong><\/p>$/);
      post.flush(probleme());
      await flushReload([probleme()]);
      expect(root.querySelector('app-remarque-form')).toBeNull();
      expect(changed).toBe(1);
      expect(items()).toHaveLength(1);
    });

    it('crée une remarque d\'un locataire', async () => {
      await open('GESTIONNAIRE', [], CIBLE_LOCATAIRE);
      click(root.querySelector('.rv__head .btn--primary'));
      await tick();
      expect(text(root.querySelector('.modal__title'))).toBe('Nouvelle remarque · Nathalie Claes');
      await setText('<p>Paie en espèces</p>');
      submit();
      http.expectOne((r) => r.method === 'POST' && r.url === '/api/locataires/4/remarques').flush(remarque());
      await flushReload([remarque()]);
    });

    it('surligne le texte vide sans rien envoyer', async () => {
      await open('GESTIONNAIRE', []);
      click(root.querySelector('.rv__head .btn--primary'));
      await tick();
      submit();
      const invalid = Array.from(root.querySelectorAll('app-remarque-form app-form-field.is-invalid')).map((f) =>
        text(f.querySelector('.ff__label')),
      );
      expect(invalid).toEqual(['Texte *']);
      http.expectNone((r) => r.method === 'POST');
    });

    it('modifie une remarque : type et texte repris, envoi par PUT', async () => {
      await open('GESTIONNAIRE');
      click(root.querySelectorAll('.rem')[0].querySelector('.icon-btn:not(.icon-btn--round)'));
      await tick();
      render();
      expect(text(root.querySelector('.modal__title'))).toBe('Modifier la remarque · G05');
      expect(root.querySelector<HTMLSelectElement>('app-remarque-form select')!.value).toBe('PROBLEME');
      expect(root.querySelector('app-remarque-form .ql-editor')!.textContent).toBe('Fuite au plafond près de la porte.');
      selectType('AUTRE');
      submit();
      const put = http.expectOne((r) => r.method === 'PUT' && r.url === '/api/remarques/2');
      expect(put.request.body.type).toBe('AUTRE');
      expect(put.request.body.texte).toContain('Fuite au plafond');
      put.flush(autre({ id: 2 }));
      await flushReload();
      expect(root.querySelector('app-remarque-form')).toBeNull();
    });

    it('affiche l\'erreur du back dans la fenêtre sans la fermer', async () => {
      await open('GESTIONNAIRE', []);
      click(root.querySelector('.rv__head .btn--primary'));
      await tick();
      await setText('<p>Texte</p>');
      submit();
      http.expectOne((r) => r.method === 'POST').flush(
        { code: 'ACCES_REFUSE', message: 'Droits insuffisants pour cette action.', details: [] },
        { status: 403, statusText: 'Forbidden' },
      );
      await settle();
      expect(text(root.querySelector('app-remarque-form .message-error[role="alert"]'))).toBe('Droits insuffisants pour cette action.');
      expect(root.querySelector('app-remarque-form')).not.toBeNull();
    });

    it('affiche l\'erreur de champ du back sous le champ', async () => {
      await open('GESTIONNAIRE', []);
      click(root.querySelector('.rv__head .btn--primary'));
      await tick();
      await setText('<p>Texte</p>');
      submit();
      http.expectOne((r) => r.method === 'POST').flush(
        {
          code: 'VALIDATION',
          message: 'Des champs obligatoires sont manquants ou invalides.',
          fieldErrors: { texte: 'Le texte est obligatoire.' },
          details: [],
        },
        { status: 422, statusText: 'Unprocessable Entity' },
      );
      await settle();
      expect(Array.from(root.querySelectorAll('app-remarque-form .ff__error')).map((e) => text(e))).toEqual([
        'Le texte est obligatoire.',
      ]);
    });

    it('ferme la fiche avec Annuler sans rien envoyer', async () => {
      await open('GESTIONNAIRE');
      click(root.querySelector('.rv__head .btn--primary'));
      await tick();
      click(root.querySelector('.modal__foot .btn--secondary'));
      expect(root.querySelector('app-remarque-form')).toBeNull();
      http.expectNone((r) => r.method !== 'GET');
    });
  });

  describe('résolution (RG-REM-05 et 06)', () => {
    const typeDate = (digits: string) => {
      const input = root.querySelector<HTMLInputElement>('app-resolution-form app-date-input input')!;
      input.value = digits;
      input.dispatchEvent(new Event('input'));
      render();
    };
    const submit = () => {
      root.querySelector('app-resolution-form form')!.dispatchEvent(new Event('submit'));
      render();
    };
    const openResolution = async () => {
      await open('GESTIONNAIRE', [probleme()]);
      click(root.querySelector('.rem .icon-btn--round'));
    };

    it('propose la date du jour dans la fenêtre « Marquer résolu »', async () => {
      await openResolution();
      expect(text(root.querySelector('.modal__title'))).toBe('Marquer résolu');
      expect(text(root.querySelector('app-resolution-form .ff__label'))).toBe('Date de résolution *');
      expect(root.querySelector<HTMLInputElement>('app-resolution-form app-date-input input')!.value).toBe('25/10/2026');
    });

    it('envoie la date de résolution, puis recharge la liste et prévient l\'écran', async () => {
      await openResolution();
      typeDate('22102026');
      submit();
      const post = http.expectOne((r) => r.method === 'POST' && r.url === '/api/remarques/2/resolution');
      expect(post.request.body).toEqual({ dateResolution: '2026-10-22' });
      post.flush(probleme({ resolu: true, dateResolution: '2026-10-22' }));
      await flushReload([probleme({ resolu: true, dateResolution: '2026-10-22' })]);
      expect(root.querySelector('app-resolution-form')).toBeNull();
      expect(changed).toBe(1);
      expect(text(root.querySelector('.rem__resolu'))).toBe('Résolu le 22/10/2026');
    });

    it('surligne la date vide sans rien envoyer', async () => {
      await openResolution();
      typeDate('');
      submit();
      expect(root.querySelector('app-resolution-form app-form-field.is-invalid')).not.toBeNull();
      http.expectNone((r) => r.method === 'POST');
    });

    it('affiche le refus du back (date future ou avant la création) sans fermer la fenêtre', async () => {
      await openResolution();
      submit();
      http.expectOne((r) => r.method === 'POST').flush(
        { code: 'REM_RESOLUTION_FUTURE', message: 'La date de résolution ne peut pas être dans le futur.', details: [] },
        { status: 409, statusText: 'Conflict' },
      );
      await settle();
      expect(text(root.querySelector('app-resolution-form .message-error[role="alert"]'))).toBe(
        'La date de résolution ne peut pas être dans le futur.',
      );
      expect(root.querySelector('app-resolution-form')).not.toBeNull();
    });

    it('rouvre un problème résolu tout de suite, puis recharge la liste', async () => {
      await open('GESTIONNAIRE', [problemeResolu()]);
      click(root.querySelector('.rem .icon-btn--round'));
      http
        .expectOne((r) => r.method === 'DELETE' && r.url === '/api/remarques/3/resolution')
        .flush(probleme({ id: 3 }));
      await flushReload([probleme({ id: 3 })]);
      expect(root.querySelector('.rem__resolu')).toBeNull();
      expect(changed).toBe(1);
    });

    it('affiche l\'erreur du back quand la réouverture échoue', async () => {
      await open('GESTIONNAIRE', [problemeResolu()]);
      click(root.querySelector('.rem .icon-btn--round'));
      http.expectOne((r) => r.method === 'DELETE').flush(
        { code: 'REM_INTROUVABLE', message: 'Remarque introuvable.', details: [] },
        { status: 404, statusText: 'Not Found' },
      );
      await settle();
      expect(text(root.querySelector('.rv .message-warning'))).toBe('Remarque introuvable.');
      expect(items()).toHaveLength(1);
    });
  });

  describe('suppression (Admin, RG-REM-07)', () => {
    it('supprime la remarque, recharge la liste et prévient l\'écran', async () => {
      await open('ADMIN', [probleme(), remarque()]);
      click(items()[1].querySelector('.fa-trash-can')!.closest('button'));
      http
        .expectOne((r) => r.method === 'DELETE' && r.url === '/api/remarques/1')
        .flush(null, { status: 204, statusText: 'No Content' });
      await flushReload([probleme()]);
      expect(items()).toHaveLength(1);
      expect(changed).toBe(1);
    });

    it('affiche l\'erreur du back quand la suppression échoue', async () => {
      await open('ADMIN', [probleme()]);
      click(root.querySelector('.rem .fa-trash-can')!.closest('button'));
      http.expectOne((r) => r.method === 'DELETE').flush(
        { code: 'ACCES_REFUSE', message: 'Droits insuffisants pour cette action.', details: [] },
        { status: 403, statusText: 'Forbidden' },
      );
      await settle();
      expect(text(root.querySelector('.rv .message-warning'))).toBe('Droits insuffisants pour cette action.');
      expect(items()).toHaveLength(1);
    });
  });
});
