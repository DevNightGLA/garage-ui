import { HttpRequest, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { pageOf } from '../../../../testing/garage-fixtures';
import { defaultDroits, signInAs, withRight } from '../../../../testing/rights';
import { provideTestTranslations } from '../../../../testing/translations';
import { SettingsService } from '../../../core/settings-service';
import { ToastService } from '../../../shared/toast/toast';
import { UtilisateurDTO } from '../utilisateur.models';
import { UtilisateursPage } from './utilisateurs-page';

function user(overrides: Partial<UtilisateurDTO> = {}): UtilisateurDTO {
  return {
    id: 2,
    login: 'gestionnaire',
    prenom: 'Bruno',
    nom: 'Declercq',
    email: 'bruno@example.com',
    role: 'GESTIONNAIRE',
    locataireId: null,
    locataireNom: null,
    actif: true,
    motDePasseTemporaire: false,
    derniereConnexion: null,
    dateCreation: '2024-01-02T09:05:00',
    vous: false,
    ...overrides,
  };
}

const COUNTERS = { ACTIFS: 3, DESACTIVES: 1, TOUS: 4, ADMIN: 1, GESTIONNAIRE: 2, LOCATAIRE: 0, CONSULTANT: 1 };

describe('UtilisateursPage', () => {
  let fixture: ComponentFixture<UtilisateursPage>;
  let http: HttpTestingController;
  let root: HTMLElement;

  const isList = (req: HttpRequest<unknown>) => req.url === '/api/utilisateurs';
  const text = (el: Element) => el.textContent!.replace(/\s+/g, ' ').trim();
  const settle = async () => {
    for (let i = 0; i < 3; i++) {
      await new Promise((resolve) => setTimeout(resolve));
      fixture.detectChanges();
    }
  };
  const action = (row: Element, label: string) => row.querySelector<HTMLButtonElement>(`[aria-label="${label}"]`);
  const rows = () => Array.from(root.querySelectorAll('tbody tr'));
  const button = (scope: ParentNode, label: string) =>
    Array.from(scope.querySelectorAll<HTMLButtonElement>('button')).find((b) => text(b) === label)!;
  const type = async (name: string, value: string) => {
    const input = root.querySelector<HTMLInputElement>(`input[formcontrolname="${name}"]`)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    await settle();
  };
  const next = async () => {
    root.querySelector<HTMLButtonElement>('button[form="utilisateur-form"]')!.click();
    await settle();
  };

  const USERS = [
    user(),
    user({ id: 1, login: 'admin', prenom: 'Alice', nom: 'Verhaegen', role: 'ADMIN', vous: true, derniereConnexion: '2026-11-03T08:15:00' }),
    user({ id: 5, login: 'ancien', prenom: 'Paul', nom: 'Mertens', actif: false }),
  ];

  const open = async (droits = defaultDroits('ADMIN')) => {
    TestBed.configureTestingModule({
      imports: [UtilisateursPage],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideTestTranslations()],
    });
    signInAs('ADMIN', {}, droits);
    vi.spyOn(TestBed.inject(SettingsService), 'today').mockReturnValue(new Date(2026, 10, 4));
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(UtilisateursPage);
    root = fixture.nativeElement;
    await settle();
    const list = http.expectOne(isList);
    expect(list.request.params.get('statut')).toBe('ACTIFS');
    list.flush(pageOf(USERS));
    http.expectOne('/api/utilisateurs/compteurs').flush(COUNTERS);
    await settle();
  };

  const reload = (content: UtilisateurDTO[] = USERS) => {
    http.expectOne(isList).flush(pageOf(content));
    http.expectOne('/api/utilisateurs/compteurs').flush(COUNTERS);
  };

  afterEach(() => http.verify());

  it('cartes de profil, compteurs, « Vous », dernière connexion relative et compte atténué', async () => {
    await open();
    expect(Array.from(root.querySelectorAll('.up__card-count')).map(text)).toEqual(['1 compte', '2 comptes', '0 compte', '1 compte']);
    expect(text(root.querySelector('app-filter-buttons')!)).toContain('Désactivés (1)');
    const [bruno, alice, paul] = rows();
    expect(text(alice)).toContain('Vous');
    expect(text(alice)).toContain('03/11/2026 · 08:15');
    expect(text(alice)).toContain('Hier');
    expect(text(bruno)).toContain('Jamais connecté');
    expect(paul.classList.contains('is-muted')).toBe(true);
    expect(text(paul)).toContain('Désactivé');
  });

  it('une carte de profil filtre la liste, un second clic retire le filtre', async () => {
    await open();
    root.querySelectorAll<HTMLButtonElement>('.up__card')[0].click();
    await settle();
    const req = http.expectOne(isList);
    expect(req.request.params.get('role')).toBe('ADMIN');
    req.flush(pageOf([USERS[1]]));
    await settle();
    root.querySelectorAll<HTMLButtonElement>('.up__card')[0].click();
    await settle();
    expect(http.expectOne(isList).request.params.has('role')).toBe(false);
  });

  it('« Tous » n\'envoie pas de statut', async () => {
    await open();
    button(root, 'Tous (4)').click();
    await settle();
    expect(http.expectOne(isList).request.params.has('statut')).toBe(false);
  });

  it('son propre compte : réinitialisation, désactivation et suppression grisées avec la raison', async () => {
    await open();
    const alice = rows()[1];
    const reset = alice.querySelector<HTMLButtonElement>('.fa-key')!.closest('button')!;
    expect(reset.getAttribute('aria-disabled')).toBe('true');
    expect(reset.getAttribute('aria-label')).toBe('Pour votre compte, utilisez « Modifier le mot de passe » dans le menu.');
    reset.click();
    await settle();
    expect(root.querySelector('app-confirm')).toBeNull();
    expect(action(alice, 'Vous ne pouvez pas désactiver votre propre compte.')).not.toBeNull();
    expect(action(alice, 'Vous ne pouvez pas supprimer votre propre compte.')).not.toBeNull();
    // Compte désactivé : pas de réinitialisation, réactivation possible.
    const paul = rows()[2];
    expect(action(paul, 'Compte désactivé : réinitialisation impossible.')).not.toBeNull();
    expect(action(paul, 'Réactiver le compte')).not.toBeNull();
  });

  it('réinitialise le mot de passe après confirmation et l\'affiche une fois', async () => {
    await open();
    action(rows()[0], 'Réinitialiser le mot de passe')!.click();
    await settle();
    const confirm = root.querySelector('app-confirm')!;
    expect(text(confirm)).toContain('Réinitialiser le mot de passe ?');
    expect(text(confirm)).toContain('Declercq Bruno');
    button(confirm, 'Réinitialiser').click();
    const req = http.expectOne('/api/utilisateurs/2/reinitialisation');
    expect(req.request.method).toBe('POST');
    req.flush({ utilisateur: USERS[0], motDePasseTemporaire: 'kwCKGunf22ET' });
    await settle();
    reload();
    await settle();
    const dialog = root.querySelector('app-temp-password-dialog')!;
    expect(text(dialog)).toContain('Mot de passe réinitialisé');
    expect(text(dialog.querySelector('.tp__value')!)).toBe('kwCKGunf22ET');
    button(dialog, 'Fermer').click();
    await settle();
    expect(root.querySelector('app-temp-password-dialog')).toBeNull();
    expect(root.textContent).not.toContain('kwCKGunf22ET');
  });

  it('désactive après confirmation ; le refus du back reste dans la fenêtre', async () => {
    await open();
    action(rows()[0], 'Désactiver le compte')!.click();
    await settle();
    button(root.querySelector('app-confirm')!, 'Désactiver').click();
    http
      .expectOne('/api/utilisateurs/2/desactivation')
      .flush({ code: 'USR_DERNIER_ADMIN', message: 'Dernier administrateur actif : désactivation impossible.' }, { status: 409, statusText: 'Conflict' });
    await settle();
    expect(text(root.querySelector('app-confirm')!)).toContain('Dernier administrateur actif');

    button(root.querySelector('app-confirm')!, 'Désactiver').click();
    http.expectOne('/api/utilisateurs/2/desactivation').flush({ ...USERS[0], actif: false });
    await settle();
    expect(TestBed.inject(ToastService).current()?.text).toBe('Compte de Declercq Bruno désactivé');
    reload();
  });

  it('réactive sans confirmation', async () => {
    await open();
    action(rows()[2], 'Réactiver le compte')!.click();
    const req = http.expectOne('/api/utilisateurs/5/desactivation');
    expect(req.request.method).toBe('DELETE');
    req.flush({ ...USERS[2], actif: true });
    await settle();
    expect(TestBed.inject(ToastService).current()?.text).toBe('Compte de Mertens Paul réactivé');
    reload();
  });

  it('supprime un compte (droit d) après confirmation', async () => {
    await open();
    action(rows()[0], 'Supprimer le compte')!.click();
    await settle();
    button(root.querySelector('app-confirm')!, 'Supprimer').click();
    const req = http.expectOne('/api/utilisateurs/2');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
    await settle();
    expect(TestBed.inject(ToastService).current()?.text).toBe('Compte de Declercq Bruno supprimé');
    reload();
  });

  it('création en quatre étapes : champs de l\'étape surlignés, récapitulatif, mot de passe affiché', async () => {
    await open();
    button(root, 'Nouvel utilisateur').click();
    await settle();
    await next();
    expect(root.querySelectorAll('app-form-field.is-invalid').length).toBe(2);
    await type('nom', 'Testeur');
    await type('prenom', 'Zoé');
    await next();
    await type('email', 'Zoe@Example.com');
    await type('login', 'Zoe.T');
    await next();
    // Profil Locataire : la fiche est obligatoire.
    Array.from(root.querySelectorAll<HTMLButtonElement>('.uf__role')).find((b) => text(b).startsWith('Locataire'))!.click();
    await settle();
    http.expectOne((req) => req.url === '/api/locataires').flush(pageOf([]));
    await next();
    expect(root.querySelectorAll('app-form-field.is-invalid').length).toBe(1);
    Array.from(root.querySelectorAll<HTMLButtonElement>('.uf__role')).find((b) => text(b).startsWith('Consultant'))!.click();
    await settle();
    await next();
    const recap = text(root.querySelector('.uf__list')!);
    expect(recap).toContain('zoe@example.com');
    expect(recap).toContain('zoe.t');
    expect(recap).toContain('Consultant');

    await next();
    const req = http.expectOne((r) => r.url === '/api/utilisateurs' && r.method === 'POST');
    expect(req.request.body).toEqual({
      nom: 'Testeur',
      prenom: 'Zoé',
      email: 'Zoe@Example.com',
      login: 'Zoe.T',
      role: 'CONSULTANT',
      locataireId: null,
    });
    req.flush({ utilisateur: user({ id: 9, nom: 'Testeur', prenom: 'Zoé', role: 'CONSULTANT' }), motDePasseTemporaire: 'abcDEF234567' });
    await settle();
    reload();
    await settle();
    expect(root.querySelector('app-utilisateur-form')).toBeNull();
    expect(text(root.querySelector('app-temp-password-dialog')!)).toContain('Compte créé');
    expect(text(root.querySelector('app-temp-password-dialog')!)).toContain('Testeur Zoé');
  });

  it('création : un login déjà pris ramène à l\'étape Connexion avec le message', async () => {
    await open();
    button(root, 'Nouvel utilisateur').click();
    await settle();
    await type('nom', 'A');
    await type('prenom', 'B');
    await next();
    await type('email', 'a@b.be');
    await type('login', 'admin');
    await next();
    await next();
    await next();
    http
      .expectOne((r) => r.url === '/api/utilisateurs' && r.method === 'POST')
      .flush({ code: 'USR_LOGIN_EXISTE', message: 'Ce login existe déjà.' }, { status: 409, statusText: 'Conflict' });
    await settle();
    expect(root.querySelector('input[formcontrolname="login"]')).not.toBeNull();
    expect(text(root.querySelector('.ff__error')!)).toBe('Ce login existe déjà.');
  });

  it('modification : login figé, son propre profil verrouillé', async () => {
    await open();
    action(rows()[1], 'Modifier')!.click();
    await settle();
    expect(root.querySelector<HTMLInputElement>('input[formcontrolname="login"]')!.disabled).toBe(true);
    expect(text(root.querySelector('.uf__field')!)).toContain('Vous ne pouvez pas modifier votre propre profil.');
    const gestionnaire = Array.from(root.querySelectorAll<HTMLButtonElement>('.uf__role')).find((b) => text(b).startsWith('Gestionnaire'))!;
    expect(gestionnaire.disabled).toBe(true);
    await type('prenom', 'Alicia');
    await next();
    const req = http.expectOne('/api/utilisateurs/1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ nom: 'Verhaegen', prenom: 'Alicia', email: 'bruno@example.com', role: 'ADMIN', locataireId: null });
    req.flush(USERS[1]);
    await settle();
    expect(TestBed.inject(ToastService).current()?.text).toBe('Utilisateur enregistré avec succès');
    reload();
  });

  it('consultation seule : « Visualiser », ni création ni actions', async () => {
    await open(withRight(withRight(defaultDroits('ADMIN'), 'USR', { peutModifier: false, peutAjouter: false }), 'USR', { peutSupprimer: false }));
    expect(Array.from(root.querySelectorAll('button')).some((b) => text(b) === 'Nouvel utilisateur')).toBe(false);
    expect(rows()[0].querySelectorAll('.actions button').length).toBe(1);
    action(rows()[0], 'Visualiser')!.click();
    await settle();
    expect(text(root.querySelector('.modal__title')!)).toBe('Visualiser l’utilisateur');
    expect(root.querySelector('button[form="utilisateur-form"]')).toBeNull();
  });
});
