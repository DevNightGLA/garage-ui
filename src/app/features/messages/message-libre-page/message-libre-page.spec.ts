import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signInAs } from '../../../../testing/rights';
import { provideTestTranslations } from '../../../../testing/translations';
import { ToastService } from '../../../shared/toast/toast';
import { DestinatairesLibre } from '../messages.models';
import { MessageLibrePage } from './message-libre-page';

const RECIPIENTS: DestinatairesLibre = {
  actuels: 3,
  actuelsSansEmail: 1,
  locataires: [
    { id: 1, nom: 'Dubois Pierre', email: 'pierre@example.com', ancien: false },
    { id: 2, nom: 'Lambert Sophie', email: 'sophie@example.com', ancien: false },
    { id: 3, nom: 'Sans Mail', email: null, ancien: false },
    { id: 4, nom: 'Leroy Claire', email: 'claire@example.com', ancien: true },
  ],
};

describe('MessageLibrePage', () => {
  let fixture: ComponentFixture<MessageLibrePage>;
  let http: HttpTestingController;
  let root: HTMLElement;

  const text = (el: Element) => el.textContent!.replace(/\s+/g, ' ').trim();
  const settle = async () => {
    for (let i = 0; i < 3; i++) {
      await new Promise((resolve) => setTimeout(resolve));
      fixture.detectChanges();
    }
  };
  const button = (label: string) =>
    Array.from(root.querySelectorAll<HTMLButtonElement>('button')).find((b) => text(b).startsWith(label))!;
  const select = () => root.querySelector<HTMLSelectElement>('select')!;
  const choose = async (index: number) => {
    select().selectedIndex = index;
    select().dispatchEvent(new Event('change'));
    await settle();
  };
  const type = async (selector: string, value: string) => {
    const input = root.querySelector<HTMLInputElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    await settle();
  };
  const write = async (html: string) => {
    root.querySelector<HTMLElement>('.ql-editor')!.innerHTML = html;
    await settle();
  };

  const open = async (role: 'ADMIN' | 'CONSULTANT' = 'ADMIN') => {
    TestBed.configureTestingModule({
      imports: [MessageLibrePage],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideTestTranslations()],
    });
    signInAs(role);
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(MessageLibrePage);
    root = fixture.nativeElement;
    await settle();
    http.expectOne('/api/messages/libre/destinataires').flush(RECIPIENTS);
    await settle();
  };

  afterEach(() => http.verify());

  it('propose un locataire (anciens marqués) ou tous les locataires actuels', async () => {
    await open();
    expect(Array.from(root.querySelectorAll('.sg__btn')).map(text)).toEqual(['Un locataire', 'Tous les locataires actuels (3)']);
    expect(Array.from(select().options).map((o) => o.textContent!.trim())).toEqual([
      'Choisir un locataire',
      'Dubois Pierre',
      'Lambert Sophie',
      'Sans Mail',
      'Leroy Claire (ancien)',
    ]);
    expect(root.querySelectorAll('.vc__chip').length).toBe(8);
  });

  it('à l\'envoi, les champs obligatoires vides se surlignent ensemble', async () => {
    await open();
    button('Envoyer (').click();
    await settle();
    expect(root.querySelectorAll('app-form-field.is-invalid').length).toBe(3);
    expect(root.querySelector('app-modal')).toBeNull();
  });

  it('signale le locataire sans e-mail et bloque l\'envoi', async () => {
    await open();
    await choose(3);
    expect(text(root.querySelector('.message-warning')!)).toBe('1 locataire sans e-mail ne recevra pas le message.');
    expect(button('Envoyer (').getAttribute('aria-disabled')).toBe('true');
  });

  it('aperçu pour le locataire choisi', async () => {
    await open();
    await choose(1);
    await type('input[formcontrolname="objet"]', ' Parking ');
    await write('<p>Bonjour {civilite}</p>');
    button('Aperçu').click();
    await settle();
    const req = http.expectOne('/api/messages/libre/apercu');
    // jsdom : Quill écrit les espaces saisis en &nbsp;.
    const body = { ...req.request.body, texte: req.request.body.texte.replaceAll('&nbsp;', ' ') };
    expect(body).toEqual({ destinataires: 'UN', locataireId: 1, objet: 'Parking', texte: '<p>Bonjour {civilite}</p>' });
    req.flush({ de: 'G <g@x.be>', reponseA: null, cci: null, a: 'pierre@example.com', objet: 'Parking', texte: '<p>Bonjour M.</p>' });
    await settle();
    expect(text(root.querySelector('app-email-preview')!)).toContain('Bonjour M.');
    expect(root.querySelector('app-modal app-modal')).toBeNull();
  });

  it('envoie à tous les locataires actuels avec e-mail après confirmation, puis vide le message', async () => {
    await open();
    root.querySelectorAll<HTMLButtonElement>('.sg__btn')[1].click();
    await settle();
    expect(root.querySelector('select')).toBeNull();
    expect(text(root.querySelector('.message-warning')!)).toBe('1 locataire sans e-mail ne recevra pas le message.');
    await type('input[formcontrolname="objet"]', 'Fermeture');
    await write('<p>Le parking ferme.</p>');
    expect(text(button('Envoyer ('))).toBe('Envoyer (2)');
    button('Envoyer (').click();
    await settle();

    const modal = root.querySelector('app-modal')!;
    expect(text(modal)).toContain('Envoyer le message à 2 locataires ?');
    expect(text(modal)).toContain('sophie@example.com');
    expect(text(modal)).not.toContain('claire@example.com');
    Array.from(modal.querySelectorAll<HTMLButtonElement>('button')).find((b) => text(b) === 'Envoyer')!.click();
    const send = http.expectOne('/api/messages/libre/envoi');
    expect({ ...send.request.body, texte: send.request.body.texte.replaceAll('&nbsp;', ' ') }).toEqual({
      destinataires: 'TOUS_ACTUELS',
      locataireId: null,
      objet: 'Fermeture',
      texte: '<p>Le parking ferme.</p>',
    });
    send.flush({ envoyes: 2, sansEmail: 1, destinataires: [] });
    await settle();

    expect(root.querySelector('app-modal')).toBeNull();
    expect(TestBed.inject(ToastService).current()?.text).toBe('2 messages envoyés avec succès');
    expect(root.querySelector<HTMLInputElement>('input[formcontrolname="objet"]')!.value).toBe('');
    expect(root.querySelector('.sg__btn.is-active')!.textContent).toContain('Tous');
  });

  it('une erreur d\'envoi reste dans la fenêtre de confirmation', async () => {
    await open();
    await choose(1);
    await type('input[formcontrolname="objet"]', 'X');
    await write('<p>Y</p>');
    button('Envoyer (').click();
    await settle();
    Array.from(root.querySelectorAll<HTMLButtonElement>('app-modal button')).find((b) => text(b) === 'Envoyer')!.click();
    http
      .expectOne('/api/messages/libre/envoi')
      .flush({ code: 'MAIL_NON_CONFIGURE', message: 'Envoi des e-mails impossible.' }, { status: 409, statusText: 'Conflict' });
    await settle();
    expect(text(root.querySelector('app-modal')!)).toContain('Envoi des e-mails impossible.');
  });

  it('consultation seule (sans droit a) : formulaire désactivé, ni variables ni envoi', async () => {
    await open('CONSULTANT');
    expect(select().disabled).toBe(true);
    expect(root.querySelector('app-variable-chips')).toBeNull();
    expect(root.querySelector('.ml__actions')).toBeNull();
  });
});
