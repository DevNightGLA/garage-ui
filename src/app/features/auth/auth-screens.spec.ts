import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { provideTestTranslations } from '../../../testing/translations';
import { AuthService } from '../../core/auth/auth-service';
import { LanguageService } from '../../core/language-service';
import { ChangePassword } from './change-password/change-password';
import { ForgotPassword } from './forgot-password/forgot-password';
import { Login } from './login/login';
import { ResetPassword } from './reset-password/reset-password';

function providers(query: Record<string, string> = {}) {
  return [
    provideRouter([]),
    provideHttpClient(),
    provideHttpClientTesting(),
    provideTestTranslations(),
    { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(query) } } },
  ];
}

abstract class Screen<T> {
  fixture!: ComponentFixture<T>;
  http!: HttpTestingController;
  router!: Router;
  navigate!: ReturnType<typeof vi.spyOn>;

  get root(): HTMLElement {
    return this.fixture.nativeElement;
  }

  async setup(component: new () => T, query: Record<string, string> = {}) {
    sessionStorage.clear();
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [component as never], providers: providers(query) }).compileComponents();
    this.http = TestBed.inject(HttpTestingController);
    this.router = TestBed.inject(Router);
    this.navigate = vi.spyOn(this.router, 'navigate').mockResolvedValue(true);
    vi.spyOn(this.router, 'navigateByUrl').mockResolvedValue(true);
    this.fixture = TestBed.createComponent(component);
    await this.fixture.whenStable();
  }

  input(selector: string): HTMLInputElement {
    return this.root.querySelector<HTMLInputElement>(selector)!;
  }

  async type(selector: string, text: string) {
    const field = this.input(selector);
    field.value = text;
    field.dispatchEvent(new Event('input'));
    await this.fixture.whenStable();
  }

  async submit() {
    this.root.querySelector('form')!.dispatchEvent(new Event('submit'));
    await this.fixture.whenStable();
  }

  invalid(): boolean[] {
    return Array.from(this.root.querySelectorAll('app-form-field')).map((f) => f.classList.contains('is-invalid'));
  }

  alert(): string | null {
    return this.root.querySelector('.message-error[role="alert"]')?.textContent?.trim() ?? null;
  }
}

describe('Écrans publics : choix de la langue', () => {
  it.each([
    ['Login', Login],
    ['ForgotPassword', ForgotPassword],
    ['ResetPassword', ResetPassword],
  ] as [string, new () => unknown][])('%s propose FR et EN avant toute connexion', async (_name, component) => {
    const screen = new (class extends Screen<unknown> {})();
    await screen.setup(component);
    const [fr, en] = Array.from(screen.root.querySelectorAll<HTMLButtonElement>('.ls__btn'));
    expect([fr.textContent!.trim(), en.textContent!.trim()]).toEqual(['FR', 'EN']);
    expect(fr.classList.contains('is-active')).toBe(true);

    en.click();
    await screen.fixture.whenStable();
    expect(TestBed.inject(LanguageService).lang()).toBe('en');
    expect(en.classList.contains('is-active')).toBe(true);
    expect(fr.classList.contains('is-active')).toBe(false);
    expect(localStorage.getItem('gg-lang')).toBe('en');
  });
});

describe('Login', () => {
  const screen = new (class extends Screen<Login> {})();
  afterEach(() => screen.http.verify());

  it('affiche la connexion avec le sous-titre d\'accueil', async () => {
    await screen.setup(Login);
    expect(screen.root.querySelector('.auth__title')!.textContent).toBe('Connexion');
    expect(screen.root.querySelector('.auth__subtitle')!.textContent).toContain('Connectez-vous');
    expect(screen.root.querySelector('.ff__star')).toBeNull();
    expect(screen.root.querySelector<HTMLAnchorElement>('a.link-muted')!.textContent).toContain('Mot de passe oublié ?');
  });

  it.each([
    ['deconnecte', 'Votre session a été fermée.'],
    ['expiree', 'Votre session a expiré. Veuillez vous reconnecter.'],
  ])('explique pourquoi l\'utilisateur est revenu ici (%s)', async (raison, text) => {
    await screen.setup(Login, { raison });
    expect(screen.root.querySelector('.auth__subtitle')!.textContent).toBe(text);
  });

  it('confirme un mot de passe réinitialisé', async () => {
    await screen.setup(Login, { info: 'mdp' });
    expect(screen.root.querySelector('.message-info')!.textContent).toContain('Mot de passe modifié.');
  });

  it('surligne ensemble les deux champs vides sans appeler l\'API', async () => {
    await screen.setup(Login);
    await screen.submit();
    expect(screen.invalid()).toEqual([true, true]);
    screen.http.expectNone('/api/auth/connexion');
  });

  it('retire le rouge du champ dans lequel on saisit', async () => {
    await screen.setup(Login);
    await screen.submit();
    await screen.type('input[formControlName="login"]', 'admin');
    expect(screen.invalid()).toEqual([false, true]);
  });

  it('connecte puis retourne à la page demandée', async () => {
    await screen.setup(Login, { retour: '/locations' });
    await screen.type('input[formControlName="login"]', 'admin');
    await screen.type('app-password-input input', 'Garages2026!');
    await screen.submit();

    const request = screen.http.expectOne('/api/auth/connexion');
    expect(request.request.body).toEqual({ login: 'admin', motDePasse: 'Garages2026!' });
    request.flush({
      accessToken: 'jeton-1',
      tokenType: 'Bearer',
      expiresIn: 28800,
      utilisateur: { id: 1, login: 'admin', email: 'admin@example.com', role: 'ADMIN', actif: true },
    });
    await screen.fixture.whenStable();
    expect(TestBed.inject(AuthService).isAuthenticated()).toBe(true);
    expect(screen.router.navigateByUrl).toHaveBeenCalledWith('/locations');
  });

  it('refuse une adresse de retour extérieure à l\'application', async () => {
    await screen.setup(Login, { retour: '//autre-site.example' });
    await screen.type('input[formControlName="login"]', 'admin');
    await screen.type('app-password-input input', 'x');
    await screen.submit();
    screen.http.expectOne('/api/auth/connexion').flush({
      accessToken: 'j',
      tokenType: 'Bearer',
      expiresIn: 1,
      utilisateur: { id: 1, login: 'admin', email: 'a@b.c', role: 'ADMIN', actif: true },
    });
    await screen.fixture.whenStable();
    expect(screen.router.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('affiche tel quel le message du back quand les identifiants sont refusés', async () => {
    await screen.setup(Login);
    await screen.type('input[formControlName="login"]', 'admin');
    await screen.type('app-password-input input', 'mauvais');
    await screen.submit();
    screen.http
      .expectOne('/api/auth/connexion')
      .flush(
        { code: 'AUTH_IDENTIFIANTS_INVALIDES', message: 'Login ou mot de passe incorrect.', details: [] },
        { status: 401, statusText: 'Unauthorized' },
      );
    await screen.fixture.whenStable();
    expect(screen.alert()).toBe('Login ou mot de passe incorrect.');
    expect(TestBed.inject(AuthService).isAuthenticated()).toBe(false);
    expect(screen.router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('affiche les erreurs de champ du back sous chaque champ', async () => {
    await screen.setup(Login);
    await screen.type('input[formControlName="login"]', ' ');
    await screen.type('app-password-input input', 'x');
    await screen.submit();
    screen.http.expectOne('/api/auth/connexion').flush(
      {
        code: 'VALIDATION',
        message: 'Des champs obligatoires sont manquants ou invalides.',
        fieldErrors: { login: 'Le login est obligatoire.' },
        details: [],
      },
      { status: 422, statusText: 'Unprocessable Entity' },
    );
    await screen.fixture.whenStable();
    expect(screen.root.querySelector('.ff__error')!.textContent).toBe('Le login est obligatoire.');
    expect(screen.alert()).toBe('Le login est obligatoire.');
  });

  it('signale un serveur injoignable', async () => {
    await screen.setup(Login);
    await screen.type('input[formControlName="login"]', 'admin');
    await screen.type('app-password-input input', 'x');
    await screen.submit();
    screen.http.expectOne('/api/auth/connexion').error(new ProgressEvent('error'), { status: 0 });
    await screen.fixture.whenStable();
    expect(screen.alert()).toBe('Impossible de joindre le serveur.');
  });

  it('affiche ou masque le mot de passe', async () => {
    await screen.setup(Login);
    expect(screen.input('app-password-input input').type).toBe('password');
    screen.root.querySelector<HTMLButtonElement>('.pi__eye')!.click();
    await screen.fixture.whenStable();
    expect(screen.input('app-password-input input').type).toBe('text');
  });
});

describe('ForgotPassword', () => {
  const screen = new (class extends Screen<ForgotPassword> {})();
  afterEach(() => screen.http.verify());

  it('demande l\'adresse e-mail et remercie sans révéler si le compte existe', async () => {
    await screen.setup(ForgotPassword);
    await screen.type('input[type="email"]', 'marie@example.com');
    await screen.submit();
    const request = screen.http.expectOne('/api/auth/mot-de-passe-oublie');
    expect(request.request.body).toEqual({ email: 'marie@example.com' });
    request.flush(null, { status: 202, statusText: 'Accepted' });
    await screen.fixture.whenStable();
    expect(screen.root.querySelector('.auth__title')!.textContent).toBe('Vérifiez votre messagerie');
    expect(screen.root.querySelector('form')).toBeNull();
  });

  it('surligne le champ vide sans appeler l\'API', async () => {
    await screen.setup(ForgotPassword);
    await screen.submit();
    expect(screen.invalid()).toEqual([true]);
    screen.http.expectNone('/api/auth/mot-de-passe-oublie');
  });

  it('affiche le format d\'e-mail invalide renvoyé par le back', async () => {
    await screen.setup(ForgotPassword);
    await screen.type('input[type="email"]', 'pas-un-email');
    await screen.submit();
    screen.http.expectOne('/api/auth/mot-de-passe-oublie').flush(
      { code: 'VALIDATION', message: 'Des champs obligatoires sont manquants ou invalides.', fieldErrors: { email: 'Format d\'e-mail invalide.' }, details: [] },
      { status: 422, statusText: 'Unprocessable Entity' },
    );
    await screen.fixture.whenStable();
    expect(screen.root.querySelector('.ff__error')!.textContent).toBe('Format d\'e-mail invalide.');
  });
});

describe('ResetPassword', () => {
  const screen = new (class extends Screen<ResetPassword> {})();
  afterEach(() => screen.http.verify());

  const fill = async (nouveau: string, confirmer: string) => {
    const [first, second] = Array.from(screen.root.querySelectorAll<HTMLInputElement>('app-password-input input'));
    for (const [field, text] of [[first, nouveau], [second, confirmer]] as const) {
      field.value = text;
      field.dispatchEvent(new Event('input'));
    }
    await screen.fixture.whenStable();
  };

  it('signale un lien sans jeton', async () => {
    await screen.setup(ResetPassword);
    expect(screen.root.querySelector('.auth__subtitle')!.textContent).toContain('invalide ou incomplet');
    expect(screen.root.querySelector('form')).toBeNull();
  });

  it('refuse deux mots de passe différents sans appeler l\'API', async () => {
    await screen.setup(ResetPassword, { jeton: 'abc' });
    await fill('nouveau-1', 'nouveau-2');
    await screen.submit();
    expect(screen.root.querySelector('.ff__error')!.textContent).toBe('Les deux mots de passe ne sont pas identiques.');
    screen.http.expectNone('/api/auth/reinitialisation');
  });

  it('enregistre le nouveau mot de passe avec le jeton du lien puis renvoie à la connexion', async () => {
    await screen.setup(ResetPassword, { jeton: 'abc' });
    await fill('nouveau-1', 'nouveau-1');
    await screen.submit();
    const request = screen.http.expectOne('/api/auth/reinitialisation');
    expect(request.request.body).toEqual({ jeton: 'abc', nouveauMotDePasse: 'nouveau-1' });
    request.flush(null, { status: 204, statusText: 'No Content' });
    await screen.fixture.whenStable();
    expect(screen.navigate).toHaveBeenCalledWith(['/connexion'], { queryParams: { info: 'mdp' } });
  });

  it('affiche tel quel un lien expiré', async () => {
    await screen.setup(ResetPassword, { jeton: 'abc' });
    await fill('nouveau-1', 'nouveau-1');
    await screen.submit();
    screen.http.expectOne('/api/auth/reinitialisation').flush(
      { code: 'AUTH_JETON_INVALIDE', message: 'Le lien de réinitialisation est invalide ou a expiré.', details: [] },
      { status: 409, statusText: 'Conflict' },
    );
    await screen.fixture.whenStable();
    expect(screen.alert()).toBe('Le lien de réinitialisation est invalide ou a expiré.');
    expect(screen.navigate).not.toHaveBeenCalled();
  });
});

describe('ChangePassword', () => {
  const screen = new (class extends Screen<ChangePassword> {})();
  afterEach(() => screen.http.verify());

  const fill = async (actuel: string, nouveau: string, confirmer: string) => {
    const fields = Array.from(screen.root.querySelectorAll<HTMLInputElement>('app-password-input input'));
    [actuel, nouveau, confirmer].forEach((text, i) => {
      fields[i].value = text;
      fields[i].dispatchEvent(new Event('input'));
    });
    await screen.fixture.whenStable();
  };

  it('affiche les trois champs obligatoires', async () => {
    await screen.setup(ChangePassword);
    expect(screen.root.querySelector('.modal__title')!.textContent).toBe('Modifier mon mot de passe');
    expect(screen.root.querySelectorAll('.ff__star')).toHaveLength(3);
  });

  it('surligne les trois champs vides ensemble', async () => {
    await screen.setup(ChangePassword);
    await screen.submit();
    expect(screen.invalid()).toEqual([true, true, true]);
    screen.http.expectNone('/api/auth/mot-de-passe');
  });

  it('refuse une confirmation différente', async () => {
    await screen.setup(ChangePassword);
    await fill('ancien-1', 'nouveau-1', 'nouveau-2');
    await screen.submit();
    expect(screen.root.querySelector('.ff__error')!.textContent).toBe('Les deux mots de passe ne sont pas identiques.');
    screen.http.expectNone('/api/auth/mot-de-passe');
  });

  it('envoie le changement puis se ferme', async () => {
    await screen.setup(ChangePassword);
    let closed = 0;
    screen.fixture.componentInstance.closed.subscribe(() => closed++);
    await fill('ancien-1', 'nouveau-1', 'nouveau-1');
    await screen.submit();
    const request = screen.http.expectOne('/api/auth/mot-de-passe');
    expect(request.request.body).toEqual({ motDePasseActuel: 'ancien-1', nouveauMotDePasse: 'nouveau-1' });
    request.flush(null, { status: 204, statusText: 'No Content' });
    expect(closed).toBe(1);
  });

  it('affiche l\'erreur du back sans fermer la fenêtre', async () => {
    await screen.setup(ChangePassword);
    let closed = 0;
    screen.fixture.componentInstance.closed.subscribe(() => closed++);
    await fill('mauvais', 'nouveau-1', 'nouveau-1');
    await screen.submit();
    screen.http.expectOne('/api/auth/mot-de-passe').flush(
      { code: 'AUTH_MOT_DE_PASSE_ACTUEL_INCORRECT', message: 'Le mot de passe actuel est incorrect.', details: [] },
      { status: 409, statusText: 'Conflict' },
    );
    await screen.fixture.whenStable();
    expect(screen.alert()).toBe('Le mot de passe actuel est incorrect.');
    expect(closed).toBe(0);
  });

  it('affiche l\'erreur de champ du back sous le nouveau mot de passe', async () => {
    await screen.setup(ChangePassword);
    await fill('ancien-1', 'court', 'court');
    await screen.submit();
    screen.http.expectOne('/api/auth/mot-de-passe').flush(
      {
        code: 'VALIDATION',
        message: 'Des champs obligatoires sont manquants ou invalides.',
        fieldErrors: { nouveauMotDePasse: 'Le mot de passe doit contenir entre 8 et 72 caractères.' },
        details: [],
      },
      { status: 422, statusText: 'Unprocessable Entity' },
    );
    await screen.fixture.whenStable();
    const errors = Array.from(screen.root.querySelectorAll('.ff__error')).map((e) => e.textContent);
    expect(errors).toEqual(['Le mot de passe doit contenir entre 8 et 72 caractères.']);
  });
});
