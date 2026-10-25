import { HttpRequest, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { pageOf } from '../../../../testing/garage-fixtures';
import {
  COMPTEURS_LOCATAIRES,
  locataire,
  locataireAJour,
  locataireAVenir,
  locataireAncien,
  locataireSansLocation,
} from '../../../../testing/locataire-fixtures';
import { probleme, remarque } from '../../../../testing/remarque-fixtures';
import { provideTestTranslations } from '../../../../testing/translations';
import { AuthService } from '../../../core/auth/auth-service';
import { Role } from '../../../core/auth/auth.models';
import { LocataireDTO } from '../locataire.models';
import { LocatairesPage } from './locataires-page';

const isList = (r: HttpRequest<unknown>) => r.url === '/api/locataires';
const isCounters = (r: HttpRequest<unknown>) => r.url === '/api/locataires/compteurs';
const DUPLICATE = {
  code: 'LOCT_DOUBLON',
  message: 'Un locataire avec le même nom et prénom existe déjà. Vous pouvez enregistrer quand même.',
  details: [],
};

describe('LocatairesPage', () => {
  let fixture: ComponentFixture<LocatairesPage>;
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

  /** Crée l'écran avec le rôle voulu et répond aux deux premières requêtes (liste et compteurs). */
  const open = async (
    role: Role | null,
    rows: LocataireDTO[] = [locataire(), locataireAJour()],
    total = rows.length,
  ) => {
    signIn(role);
    fixture = TestBed.createComponent(LocatairesPage);
    root = fixture.nativeElement;
    render();
    http.expectOne(isList).flush(pageOf(rows, total));
    http.expectOne(isCounters).flush(COMPTEURS_LOCATAIRES);
    await settle();
  };

  /** Répond à la liste et aux compteurs rechargés après une modification. */
  const flushReload = async (rows: LocataireDTO[] = [locataire(), locataireAJour()]) => {
    render();
    http.expectOne(isList).flush(pageOf(rows));
    http.expectOne(isCounters).flush(COMPTEURS_LOCATAIRES);
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
    it('affiche le chargement tant que la liste n\'est pas arrivée', () => {
      signIn('ADMIN');
      fixture = TestBed.createComponent(LocatairesPage);
      root = fixture.nativeElement;
      render();
      expect(text(root.querySelector('.dt__state'))).toBe('Chargement…');
      http.expectOne(isList).flush(pageOf([]));
      http.expectOne(isCounters).flush(COMPTEURS_LOCATAIRES);
    });

    it('affiche la liste vide', async () => {
      await open('ADMIN', []);
      expect(text(root.querySelector('.dt__state'))).toBe('Aucun résultat.');
      expect(text(root.querySelector('.pg__count'))).toBe('0–0 sur 0 locataires');
    });

    it('affiche le message d\'erreur et recharge au clic sur Réessayer', async () => {
      signIn('ADMIN');
      fixture = TestBed.createComponent(LocatairesPage);
      root = fixture.nativeElement;
      render();
      http
        .expectOne(isList)
        .flush({ code: 'ERREUR_INTERNE', message: 'Une erreur inattendue est survenue.' }, { status: 500, statusText: 'Server Error' });
      http.expectOne(isCounters).flush(COMPTEURS_LOCATAIRES);
      await settle();
      expect(text(root.querySelector('.dt__state--error'))).toContain('Une erreur inattendue est survenue.');

      click(root.querySelector('.dt__state--error button'));
      http.expectOne(isList).flush(pageOf([locataire()]));
      http.expectOne(isCounters).flush(COMPTEURS_LOCATAIRES);
      await settle();
      expect(root.querySelector('.dt__state--error')).toBeNull();
      expect(rowsText()).toHaveLength(1);
    });
  });

  describe('liste', () => {
    it('demande les locataires actuels par défaut', async () => {
      signIn('ADMIN');
      fixture = TestBed.createComponent(LocatairesPage);
      root = fixture.nativeElement;
      render();
      const request = http.expectOne(isList);
      expect(request.request.params.get('statut')).toBe('ACTUEL');
      expect(request.request.params.get('page')).toBe('0');
      expect(request.request.params.get('size')).toBe('10');
      request.flush(pageOf([locataire()]));
      http.expectOne(isCounters).flush(COMPTEURS_LOCATAIRES);
      await settle();
    });

    it('affiche le nom, le téléphone, l\'adresse, les garages loués et le solde', async () => {
      await open('ADMIN');
      const [late, upToDate] = rowsText();
      expect(late).toContain('Marie Dupont');
      expect(late).toContain('MD');
      expect(late).toContain('0470 00 00 01');
      expect(late).toContain('14 Rue de la Station, 1050 Ixelles');
      expect(late).toContain('G01, G12');
      expect(late).toContain('En retard');
      expect(upToDate).toContain('Jan Peeters');
      expect(upToDate).toContain('G02');
      expect(upToDate).toContain('À jour');
    });

    it('affiche les statuts à venir, ancien et sans location, et atténue les anciens', async () => {
      await open('ADMIN', [locataireAVenir(), locataireAncien(), locataireSansLocation()]);
      const rows = Array.from(root.querySelectorAll('tbody tr'));
      expect(rows.map((row) => text(row.querySelector('app-status-badge')))).toEqual(['À venir', 'Ancien', 'Sans location']);
      expect(rows.map((row) => row.classList.contains('is-dimmed'))).toEqual([false, true, false]);
      expect(rows.map((row) => text(row.querySelector('.garages')))).toEqual(['', '', '']);
    });

    it('affiche le nombre de remarques en pastille, sans pastille pour zéro', async () => {
      await open('ADMIN');
      const [first, second] = Array.from(root.querySelectorAll('tbody tr'));
      expect(text(first.querySelector('.remarques__n'))).toBe('2');
      expect(second.querySelector('.remarques__n')).toBeNull();
    });

    it('affiche les filtres avec leurs compteurs, « Actuels » actif par défaut', async () => {
      await open('ADMIN');
      const buttons = Array.from(root.querySelectorAll('.fb__btn'));
      expect(buttons.map((b) => text(b))).toEqual([
        'Actuels (6)',
        'À venir (1)',
        'Anciens (2)',
        'Sans location (1)',
        'Tous (10)',
      ]);
      expect(buttons.map((b) => b.classList.contains('is-active'))).toEqual([true, false, false, false, false]);
    });

    it('envoie le statut du filtre, revient à la page 1 et n\'envoie rien pour « Tous »', async () => {
      await open('ADMIN', [locataire(), locataireAJour()], 25);
      click(root.querySelectorAll('.pg__btn')[2]);
      http.expectOne((r) => isList(r) && r.params.get('page') === '1').flush(pageOf([locataire()], 25, 1));
      await settle();

      click(root.querySelectorAll('.fb__btn')[2]);
      const former = http.expectOne(isList);
      expect(former.request.params.get('statut')).toBe('ANCIEN');
      expect(former.request.params.get('page')).toBe('0');
      former.flush(pageOf([locataireAncien()]));
      await settle();

      click(root.querySelectorAll('.fb__btn')[4]);
      const all = http.expectOne(isList);
      expect(all.request.params.has('statut')).toBe(false);
      all.flush(pageOf([locataire()]));
      await settle();
      expect(text(root.querySelector('.fb__btn.is-active'))).toBe('Tous (10)');
    });

    it('demande les locataires à venir', async () => {
      await open('ADMIN');
      click(root.querySelectorAll('.fb__btn')[1]);
      const request = http.expectOne(isList);
      expect(request.request.params.get('statut')).toBe('A_VENIR');
      request.flush(pageOf([locataireAVenir()]));
      await settle();
      expect(rowsText()[0]).toContain('Luc Martin');
    });

    it('garde la colonne Statut pour les actuels et « Tous », la masque pour les autres filtres', async () => {
      await open('ADMIN');
      expect(headers()).toEqual(['Locataire', 'Remarques', 'Garage', 'Statut', 'Actions']);

      for (const [index, expected] of [
        [2, ['Locataire', 'Remarques', 'Garage', 'Actions']],
        [3, ['Locataire', 'Remarques', 'Garage', 'Actions']],
        [4, ['Locataire', 'Remarques', 'Garage', 'Statut', 'Actions']],
      ] as const) {
        click(root.querySelectorAll('.fb__btn')[index]);
        http.expectOne(isList).flush(pageOf([locataire()]));
        await settle();
        expect(headers()).toEqual(expected);
      }
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
      list.flush(pageOf([locataire()]));
      const counters = http.expectOne(isCounters);
      expect(counters.request.params.get('q')).toBe('dupont');
      counters.flush({ ACTUEL: 1, A_VENIR: 0, ANCIEN: 0, SANS_LOCATION: 0, TOUS: 1 });
      await settle();
      expect(text(root.querySelectorAll('.fb__btn')[4])).toBe('Tous (1)');
    });

    it('envoie les tris cumulés avec les propriétés de l\'API', async () => {
      await open('ADMIN');
      click(root.querySelectorAll<HTMLButtonElement>('th .dt__sort')[0]);
      http.expectOne(isList).flush(pageOf([locataire()]));
      await settle();
      click(root.querySelectorAll<HTMLButtonElement>('th .dt__sort')[2]);
      const request = http.expectOne(isList);
      expect(request.request.params.getAll('sort')).toEqual(['locataire,asc', 'garages,asc']);
      request.flush(pageOf([locataire()]));
      await settle();
      expect(text(root.querySelector('.dt-clear'))).toContain('Annuler les tris (2)');
    });

    it('pagine côté serveur 10 par 10', async () => {
      await open('ADMIN', [locataire()], 25);
      expect(text(root.querySelector('.pg__count'))).toBe('1–10 sur 25 locataires');
      click(root.querySelectorAll('.pg__btn')[3]);
      const request = http.expectOne(isList);
      expect(request.request.params.get('page')).toBe('2');
      expect(request.request.params.get('size')).toBe('10');
      request.flush(pageOf([locataire()], 25, 2));
      await settle();
      expect(text(root.querySelector('.pg__count'))).toBe('21–25 sur 25 locataires');
    });
  });

  describe('droits', () => {
    const actionTitles = () =>
      Array.from(root.querySelectorAll('tbody tr:first-child .actions .icon-btn')).map((b) => b.getAttribute('aria-label'));

    it('Admin : crée, modifie et supprime', async () => {
      await open('ADMIN');
      expect(root.querySelector('[dtToolbarEnd]')).not.toBeNull();
      expect(actionTitles()).toEqual(['Modifier le locataire', 'Supprimer le locataire']);
    });

    it('Gestionnaire : crée et modifie, ne supprime pas', async () => {
      await open('GESTIONNAIRE');
      expect(root.querySelector('[dtToolbarEnd]')).not.toBeNull();
      expect(actionTitles()).toEqual(['Modifier le locataire']);
    });

    it('Lecture seule : ni création ni suppression, « Visualiser » à la place de « Modifier »', async () => {
      await open('LECTURE_SEULE');
      expect(root.querySelector('[dtToolbarEnd]')).toBeNull();
      expect(actionTitles()).toEqual(['Visualiser le locataire']);
      expect(root.querySelector('tbody tr:first-child .actions .fa-eye')).not.toBeNull();
    });

    it('Lecture seule : la fiche s\'ouvre en consultation, champs désactivés et sans Enregistrer', async () => {
      await open('LECTURE_SEULE');
      click(root.querySelector('tbody tr:first-child .actions .icon-btn'));
      expect(text(root.querySelector('.modal__title'))).toBe('Visualiser le locataire');
      const controls = Array.from(root.querySelectorAll<HTMLInputElement | HTMLSelectElement>('app-locataire-form input, app-locataire-form select'));
      expect(controls).toHaveLength(10);
      expect(controls.every((control) => control.disabled)).toBe(true);
      expect(root.querySelector('app-locataire-form button[type="submit"]')).toBeNull();
      expect(text(root.querySelector('.modal__foot'))).toBe('Annuler');
      http.expectNone((r) => r.method !== 'GET');
    });
  });

  describe('fiche locataire', () => {
    const field = (name: string) =>
      root.querySelector<HTMLInputElement | HTMLSelectElement>(`app-locataire-form [formControlName="${name}"]`)!;
    const type = (name: string, value: string) => {
      const control = field(name);
      control.value = value;
      control.dispatchEvent(new Event(control instanceof HTMLSelectElement ? 'change' : 'input'));
      render();
    };
    const fillRequired = () => {
      type('nom', 'Dupont');
      type('prenom', 'Marie');
      type('rue', 'Rue de la Station');
      type('numeroRue', '14');
      type('codePostal', '1050');
      type('localite', 'Ixelles');
      type('tel1', '0470 00 00 01');
    };
    const submit = () => {
      root.querySelector('app-locataire-form form')!.dispatchEvent(new Event('submit'));
      render();
    };
    const saveLabel = () => text(root.querySelector('app-locataire-form button[type="submit"]'));
    const alert = () => text(root.querySelector('app-locataire-form .message-warning'));

    it('crée un locataire : champs vides, envoi sans force, puis rechargement', async () => {
      await open('GESTIONNAIRE');
      click(root.querySelector('[dtToolbarEnd]'));
      expect(text(root.querySelector('.modal__title'))).toBe('Nouveau locataire');
      expect(field('nom').value).toBe('');
      expect(saveLabel()).toBe('Enregistrer');

      type('civilite', 'MME');
      fillRequired();
      type('email', ' marie@example.com ');
      submit();
      const post = http.expectOne((r) => r.method === 'POST' && r.url === '/api/locataires');
      expect(post.request.params.has('force')).toBe(false);
      expect(post.request.body).toEqual({
        civilite: 'MME',
        nom: 'Dupont',
        prenom: 'Marie',
        rue: 'Rue de la Station',
        numeroRue: '14',
        codePostal: '1050',
        localite: 'Ixelles',
        tel1: '0470 00 00 01',
        tel2: null,
        email: 'marie@example.com',
      });
      post.flush(locataire());
      await flushReload();
      expect(root.querySelector('app-locataire-form')).toBeNull();
    });

    it('envoie une civilité, un téléphone 2 et un e-mail vides comme absents', async () => {
      await open('GESTIONNAIRE');
      click(root.querySelector('[dtToolbarEnd]'));
      fillRequired();
      submit();
      const post = http.expectOne((r) => r.method === 'POST');
      expect(post.request.body).toMatchObject({ civilite: null, tel2: null, email: null });
      post.flush(locataire());
      await flushReload();
    });

    it('surligne ensemble les champs obligatoires vides sans rien envoyer', async () => {
      await open('GESTIONNAIRE');
      click(root.querySelector('[dtToolbarEnd]'));
      type('nom', 'Dupont');
      type('tel1', '0470 00 00 01');
      submit();
      const invalid = Array.from(root.querySelectorAll('app-locataire-form app-form-field')).map((f) => f.classList.contains('is-invalid'));
      // civilité, nom (rempli), prénom, rue, n°, code postal, localité, téléphone 1 (rempli), téléphone 2, e-mail
      expect(invalid).toEqual([false, false, true, true, true, true, true, false, false, false]);
      http.expectNone((r) => r.method === 'POST');
    });

    it('le rouge d\'un champ disparaît dès que l\'on y saisit', async () => {
      await open('GESTIONNAIRE');
      click(root.querySelector('[dtToolbarEnd]'));
      submit();
      expect(root.querySelectorAll('app-locataire-form app-form-field.is-invalid')).toHaveLength(7);
      type('prenom', 'M');
      expect(root.querySelectorAll('app-locataire-form app-form-field.is-invalid')).toHaveLength(6);
    });

    it('affiche sous le champ l\'erreur de validation du back', async () => {
      await open('GESTIONNAIRE');
      click(root.querySelector('[dtToolbarEnd]'));
      fillRequired();
      type('email', 'pas-un-mail');
      submit();
      http.expectOne((r) => r.method === 'POST').flush(
        {
          code: 'VALIDATION',
          message: 'Des champs obligatoires sont manquants ou invalides.',
          fieldErrors: { email: "Format d'e-mail invalide." },
          details: [],
        },
        { status: 422, statusText: 'Unprocessable Entity' },
      );
      await settle();
      expect(Array.from(root.querySelectorAll('app-locataire-form .ff__error')).map((e) => text(e))).toEqual([
        "Format d'e-mail invalide.",
      ]);
      expect(root.querySelector('app-locataire-form')).not.toBeNull();
    });

    it('affiche une autre erreur du back dans la fenêtre sans la fermer', async () => {
      await open('GESTIONNAIRE');
      click(root.querySelector('[dtToolbarEnd]'));
      fillRequired();
      submit();
      http
        .expectOne((r) => r.method === 'POST')
        .flush({ code: 'ACCES_REFUSE', message: 'Droits insuffisants pour cette action.', details: [] }, { status: 403, statusText: 'Forbidden' });
      await settle();
      expect(text(root.querySelector('app-locataire-form .message-error[role="alert"]'))).toBe('Droits insuffisants pour cette action.');
      expect(root.querySelector('app-locataire-form')).not.toBeNull();
    });

    it('modifie un locataire : champs remplis, envoi par PUT sans les champs calculés', async () => {
      await open('GESTIONNAIRE', [locataireSansLocation({ tel2: '02 345 67 89', email: 'julie@example.com', civilite: 'MME' })]);
      click(root.querySelector('tbody tr .actions .icon-btn'));
      expect(text(root.querySelector('.modal__title'))).toBe('Modifier le locataire');
      expect(field('civilite').value).toBe('MME');
      expect(field('nom').value).toBe('Maes');
      expect(field('numeroRue').value).toBe('14');
      expect(field('tel2').value).toBe('02 345 67 89');
      expect(field('email').value).toBe('julie@example.com');

      type('localite', 'Bruxelles');
      submit();
      const put = http.expectOne((r) => r.method === 'PUT' && r.url === '/api/locataires/5');
      expect(put.request.params.has('force')).toBe(false);
      expect(put.request.body).toEqual({
        civilite: 'MME',
        nom: 'Maes',
        prenom: 'Julie',
        rue: 'Rue de la Station',
        numeroRue: '14',
        codePostal: '1050',
        localite: 'Bruxelles',
        tel1: '0470 00 00 01',
        tel2: '02 345 67 89',
        email: 'julie@example.com',
      });
      put.flush(locataireSansLocation());
      await flushReload();
      expect(root.querySelector('app-locataire-form')).toBeNull();
    });

    it('ferme la fiche avec Annuler sans rien envoyer', async () => {
      await open('GESTIONNAIRE');
      click(root.querySelector('tbody tr:first-child .actions .icon-btn'));
      click(root.querySelector('.modal__foot .btn--secondary'));
      expect(root.querySelector('app-locataire-form')).toBeNull();
      http.expectNone((r) => r.method !== 'GET');
    });

    describe('alerte de doublon (RG-LOCT-04)', () => {
      const openAndFill = async () => {
        await open('GESTIONNAIRE');
        click(root.querySelector('[dtToolbarEnd]'));
        fillRequired();
      };
      const submitUntilDuplicate = async () => {
        submit();
        http.expectOne((r) => r.method === 'POST').flush(DUPLICATE, { status: 409, statusText: 'Conflict' });
        await settle();
      };

      it('affiche l\'alerte sans fermer la fenêtre et transforme le bouton en « Enregistrer quand même »', async () => {
        await openAndFill();
        await submitUntilDuplicate();
        expect(alert()).toBe(DUPLICATE.message);
        expect(saveLabel()).toBe('Enregistrer quand même');
        expect(root.querySelector('app-locataire-form .message-error')).toBeNull();
      });

      it('le second clic renvoie la même requête avec ?force=true', async () => {
        await openAndFill();
        await submitUntilDuplicate();

        submit();
        const forced = http.expectOne((r) => r.method === 'POST' && r.params.get('force') === 'true');
        expect(forced.request.body).toMatchObject({ nom: 'Dupont', prenom: 'Marie', tel1: '0470 00 00 01' });
        forced.flush(locataire());
        await flushReload();
        expect(root.querySelector('app-locataire-form')).toBeNull();
      });

      it('toute modification d\'un champ réarme l\'alerte : le renvoi se fait sans force', async () => {
        await openAndFill();
        await submitUntilDuplicate();
        type('prenom', 'Marion');
        expect(alert()).toBe('');
        expect(saveLabel()).toBe('Enregistrer');

        submit();
        const again = http.expectOne((r) => r.method === 'POST');
        expect(again.request.params.has('force')).toBe(false);
        expect(again.request.body).toMatchObject({ prenom: 'Marion' });
        again.flush(DUPLICATE, { status: 409, statusText: 'Conflict' });
        await settle();
        expect(saveLabel()).toBe('Enregistrer quand même');
      });

      it('s\'applique aussi à la modification', async () => {
        await open('GESTIONNAIRE');
        click(root.querySelector('tbody tr:first-child .actions .icon-btn'));
        submit();
        http.expectOne((r) => r.method === 'PUT').flush(DUPLICATE, { status: 409, statusText: 'Conflict' });
        await settle();
        expect(saveLabel()).toBe('Enregistrer quand même');

        submit();
        const forced = http.expectOne((r) => r.method === 'PUT' && r.url === '/api/locataires/1' && r.params.get('force') === 'true');
        forced.flush(locataire());
        await flushReload();
        expect(root.querySelector('app-locataire-form')).toBeNull();
      });
    });
  });

  describe('suppression (Admin)', () => {
    const askDelete = async () => {
      await open('ADMIN', [locataireSansLocation()]);
      click(root.querySelectorAll('tbody tr .actions .icon-btn')[1]);
    };

    it('demande confirmation, supprime puis recharge', async () => {
      await askDelete();
      expect(text(root.querySelector('.modal__title'))).toBe('Supprimer Julie Maes ?');
      expect(text(root.querySelector('.modal__body'))).toContain(
        'Cette action est définitive : le locataire et ses remarques seront supprimés.',
      );
      click(root.querySelector('.modal__foot .btn--primary'));
      http.expectOne((r) => r.method === 'DELETE' && r.url === '/api/locataires/5').flush(null, { status: 204, statusText: 'No Content' });
      await flushReload([]);
      expect(root.querySelector('app-confirm')).toBeNull();
    });

    it('n\'envoie rien quand on répond Non', async () => {
      await askDelete();
      click(root.querySelector('.modal__foot .btn--secondary'));
      expect(root.querySelector('app-confirm')).toBeNull();
      http.expectNone((r) => r.method === 'DELETE');
    });

    it('liste les motifs d\'un refus du back avec un seul bouton Fermer', async () => {
      await askDelete();
      click(root.querySelector('.modal__foot .btn--primary'));
      http.expectOne((r) => r.method === 'DELETE').flush(
        {
          code: 'LOCT_SUPPRESSION_REFUSEE',
          message: 'Ce locataire ne peut pas être supprimé.',
          details: [
            'Le locataire a été assigné à un garage (2 locations : G02, G10).',
            'Des paiements ont été effectués pour ce locataire (6 versements).',
          ],
        },
        { status: 409, statusText: 'Conflict' },
      );
      await settle();
      expect(text(root.querySelector('.modal__title'))).toBe('Suppression impossible');
      expect(text(root.querySelector('.confirm__refus-titre'))).toBe('Ce locataire ne peut pas être supprimé.');
      expect(Array.from(root.querySelectorAll('.confirm__motifs li')).map((li) => text(li))).toEqual([
        'Le locataire a été assigné à un garage (2 locations : G02, G10).',
        'Des paiements ont été effectués pour ce locataire (6 versements).',
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

  describe('remarques (RG-REM-01)', () => {
    const isRemarques = (r: HttpRequest<unknown>) => r.method === 'GET' && r.url === '/api/locataires/1/remarques';
    const openRemarks = async (role: Role = 'ADMIN', rows: LocataireDTO[] = [locataire(), locataireAJour()]) => {
      await open(role, rows);
      click(root.querySelector('tbody tr:first-child .remarques'));
      http.expectOne((r) => r.method === 'GET' && r.url === `/api/locataires/${rows[0].id}/remarques`).flush([probleme(), remarque()]);
      await settle();
    };

    it('la pastille ouvre les remarques du locataire à la place de la liste', async () => {
      await openRemarks();
      expect(root.querySelector('app-data-table')).toBeNull();
      expect(root.querySelector('app-filter-buttons')).toBeNull();
      expect(text(root.querySelector('.back-link'))).toBe('Retour aux locataires');
      expect(root.querySelectorAll('app-remarques-view .rem')).toHaveLength(2);
    });

    it('résume le locataire : civilité et nom, adresse, téléphones, e-mail, garages loués', async () => {
      await openRemarks();
      expect(text(root.querySelector('.sc__kicker'))).toBe('Locataire');
      expect(text(root.querySelector('.sc__title'))).toBe('Mme Marie Dupont');
      expect(text(root.querySelector('.sc__avatar'))).toBe('MD');
      expect(Array.from(root.querySelectorAll('.sc__field')).map((f) => text(f))).toEqual([
        'Adresse14 Rue de la Station, 1050 Ixelles',
        'Téléphone 10470 00 00 01',
        'Téléphone 2—',
        'E-mailmarie.dupont@example.com',
        'Garages loués' + 'G01, G12',
      ]);
    });

    it('affiche des tirets pour un locataire sans e-mail ni garage', async () => {
      await openRemarks('ADMIN', [locataireSansLocation()]);
      const fields = Array.from(root.querySelectorAll('.sc__field')).map((f) => text(f));
      expect(fields).toContain('E-mail—');
      expect(fields).toContain('Garages loués—');
    });

    it('« Retour aux locataires » revient à la liste, avec son filtre', async () => {
      await openRemarks();
      click(root.querySelector('.back-link'));
      expect(root.querySelector('app-remarques-view')).toBeNull();
      expect(rowsText()).toHaveLength(2);
      expect(text(root.querySelector('.fb__btn.is-active'))).toBe('Actuels (6)');
    });

    it('recharge la liste et les compteurs quand une remarque change, pour que la pastille suive', async () => {
      await openRemarks();
      click(root.querySelector('app-remarques-view .rem .fa-trash-can')!.closest('button'));
      http.expectOne((r) => r.method === 'DELETE' && r.url === '/api/remarques/2').flush(null, { status: 204, statusText: 'No Content' });
      render();
      http.expectOne(isRemarques).flush([remarque()]);
      await flushReload();
    });
  });
});
