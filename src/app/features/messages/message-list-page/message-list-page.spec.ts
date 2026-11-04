import { HttpRequest, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { pageOf } from '../../../../testing/garage-fixtures';
import { signInAs } from '../../../../testing/rights';
import { provideTestTranslations } from '../../../../testing/translations';
import { ToastService } from '../../../shared/toast/toast';
import { AvisLoyerDTO, RelanceDTO } from '../messages.models';
import { MessageListPage } from './message-list-page';

@Component({ template: '' })
class Empty {}

function relance(overrides: Partial<RelanceDTO> = {}): RelanceDTO {
  return {
    relanceId: null,
    echeanceId: 10,
    locationId: 1,
    locataireId: 1,
    locataire: 'Dubois Pierre',
    email: 'pierre.dubois@example.com',
    telephone: '0470 00 00 06',
    garageId: 6,
    garage: 'G06',
    periode: '2026-09-01',
    montantDu: 80,
    montantRecu: 40,
    resteDu: 40,
    cas: 'PARTIEL',
    statut: 'A_RELANCER',
    moyen: null,
    dateRelance: null,
    ...overrides,
  };
}

function avis(overrides: Partial<AvisLoyerDTO> = {}): AvisLoyerDTO {
  return {
    avisId: null,
    locationId: 2,
    loyerGarageId: 5,
    locataireId: 2,
    locataire: 'Martin Luc',
    email: 'luc.martin@example.com',
    telephone: null,
    garageId: 2,
    garage: 'G02',
    ancienMontant: 85,
    nouveauMontant: 88,
    ecart: 3,
    dateEffet: '2027-01-01',
    statut: 'A_ENVOYER',
    moyen: null,
    dateEnvoi: null,
    ...overrides,
  };
}

describe('MessageListPage', () => {
  let harness: RouterTestingHarness;
  let http: HttpTestingController;
  let root: HTMLElement;

  const filtre = (url: string, value: string) => (req: HttpRequest<unknown>) =>
    req.url === url && req.params.get('filtre') === value && req.params.get('size') !== '100';
  const all = (url: string, value: string) => (req: HttpRequest<unknown>) =>
    req.url === url && req.params.get('filtre') === value && req.params.get('size') === '100';
  const text = (el: Element) => el.textContent!.replace(/\s+/g, ' ').trim();
  const settle = async () => {
    for (let i = 0; i < 3; i++) {
      await new Promise((resolve) => setTimeout(resolve));
      harness.detectChanges();
    }
  };
  const sendButton = () =>
    Array.from(root.querySelectorAll<HTMLButtonElement>('button.btn--primary')).find((b) => text(b).startsWith('Envoyer ('));
  const checkboxes = () => Array.from(root.querySelectorAll<HTMLInputElement>('tbody input[type="checkbox"]'));

  const open = async (url: string, role: 'ADMIN' | 'CONSULTANT' = 'ADMIN') => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'avis-de-loyer', component: MessageListPage, data: { vue: 'avis' } },
          { path: 'relances', component: MessageListPage, data: { vue: 'relances' } },
          { path: '**', component: Empty },
        ]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTestTranslations(),
      ],
    });
    signInAs(role);
    http = TestBed.inject(HttpTestingController);
    harness = await RouterTestingHarness.create();
    void harness.navigateByUrl(url);
    await settle();
    root = harness.fixture.nativeElement as HTMLElement;
  };

  const openRelances = async (rows: RelanceDTO[], url = '/relances') => {
    await open(url);
    http.expectOne(filtre('/api/messages/relances', 'A_RELANCER')).flush(pageOf(rows));
    http.expectOne(all('/api/messages/relances', 'A_RELANCER')).flush(pageOf(rows));
    http.expectOne('/api/messages/relances/compteurs').flush({ A_RELANCER: rows.length, RELANCES: 1 });
    await settle();
  };

  afterEach(() => http.verify());

  it('relances : montants, compteurs, et toutes les lignes avec e-mail cochées d\'office (maquette)', async () => {
    await openRelances([
      relance(),
      relance({ echeanceId: 11, locataire: 'Peeters Jan', cas: 'TOTAL', resteDu: 100, montantRecu: 0, montantDu: 100 }),
      relance({ echeanceId: 12, locataire: 'Sans Mail', email: null }),
    ]);

    expect(text(root.querySelector('app-filter-buttons')!)).toContain('À relancer (3)');
    expect(text(root.querySelector('app-filter-buttons')!)).toContain('Relancés (1)');
    const rows = Array.from(root.querySelectorAll('tbody tr'));
    expect(text(rows[0])).toContain('Reçu 40,00 € sur 80,00 €');
    expect(text(rows[1])).toContain('Aucun versement');
    expect(text(rows[2])).toContain('Aucun e-mail · 0470 00 00 06');
    expect(checkboxes().map((c) => [c.checked, c.disabled])).toEqual([
      [true, false],
      [true, false],
      [false, true],
    ]);
    expect(text(sendButton()!)).toBe('Envoyer (2)');
    // Sans e-mail : contact manuel et « Renseigner l'e-mail du locataire ».
    expect(rows[2].querySelector('[aria-label="Renseigner l’e-mail du locataire"]')).not.toBeNull();
  });

  it('décocher une ligne et tout décocher mettent à jour « Envoyer (n) »', async () => {
    await openRelances([relance(), relance({ echeanceId: 11, locataire: 'Peeters Jan' })]);

    checkboxes()[0].click();
    await settle();
    expect(text(sendButton()!)).toBe('Envoyer (1)');

    const toggleAll = root.querySelector<HTMLInputElement>('thead input[type="checkbox"]')!;
    expect(toggleAll.indeterminate).toBe(true);
    toggleAll.click(); // indéterminé → tout cocher
    await settle();
    expect(text(sendButton()!)).toBe('Envoyer (2)');
    toggleAll.click();
    await settle();
    expect(text(sendButton()!)).toBe('Envoyer (0)');
    sendButton()!.click();
    await settle();
    expect(root.querySelector('app-modal')).toBeNull();
  });

  it('?echeance= ne coche que la relance demandée (lien du tableau de bord)', async () => {
    await openRelances([relance(), relance({ echeanceId: 11, locataire: 'Peeters Jan' })], '/relances?echeance=11');
    expect(checkboxes().map((c) => c.checked)).toEqual([false, true]);
    expect(TestBed.inject(Router).url).toBe('/relances');
  });

  it('envoie les relances cochées après confirmation, puis recharge', async () => {
    await openRelances([relance(), relance({ echeanceId: 11, locataire: 'Peeters Jan', email: 'jan@example.com' })]);
    const toasts = TestBed.inject(ToastService);

    sendButton()!.click();
    await settle();
    const modal = root.querySelector('app-modal')!;
    expect(text(modal)).toContain('Envoyer 2 relances d’impayé ?');
    expect(text(modal)).toContain('jan@example.com');
    Array.from(modal.querySelectorAll<HTMLButtonElement>('button')).find((b) => text(b) === 'Envoyer')!.click();

    const send = http.expectOne('/api/messages/relances/envoi');
    expect(send.request.body).toEqual({ lignes: [{ echeanceId: 10 }, { echeanceId: 11 }] });
    send.flush({ envoyes: 2, sansEmail: 0, destinataires: [] });
    await settle();
    expect(root.querySelector('app-modal')).toBeNull();
    expect(toasts.current()?.text).toBe('2 relances envoyées avec succès');
    http.expectOne(filtre('/api/messages/relances', 'A_RELANCER')).flush(pageOf([]));
    http.expectOne(all('/api/messages/relances', 'A_RELANCER')).flush(pageOf([]));
    http.expectOne('/api/messages/relances/compteurs').flush({ A_RELANCER: 0, RELANCES: 3 });
    await settle();
    expect(text(root.querySelector('tbody')!)).toContain('Aucun impayé à relancer.');
  });

  it('une erreur d\'envoi reste dans la fenêtre', async () => {
    await openRelances([relance()]);
    sendButton()!.click();
    await settle();
    Array.from(root.querySelectorAll<HTMLButtonElement>('app-modal button')).find((b) => text(b) === 'Envoyer')!.click();
    http
      .expectOne('/api/messages/relances/envoi')
      .flush({ code: 'MAIL_NON_CONFIGURE', message: 'Envoi impossible.' }, { status: 409, statusText: 'Conflict' });
    await settle();
    expect(text(root.querySelector('app-modal')!)).toContain('Envoi impossible.');
  });

  it('aperçu de l\'e-mail d\'une relance à faire', async () => {
    await openRelances([relance()]);
    root.querySelector<HTMLButtonElement>('[aria-label="Aperçu de l’e-mail"]')!.click();
    await settle();
    const req = http.expectOne((r) => r.url === '/api/messages/relances/apercu');
    expect(req.request.params.get('echeanceId')).toBe('10');
    req.flush({ de: 'Gestion <g@x.be>', reponseA: null, cci: null, a: 'pierre.dubois@example.com', objet: 'Solde', texte: '<p>Bonjour</p>' });
    await settle();
    const preview = root.querySelector('app-email-preview')!;
    expect(text(preview)).toContain('Solde');
    expect(text(preview)).toContain('Bonjour');
  });

  it('onglet « Relancés » : moyen et date, pas de cases ni de bouton d\'envoi', async () => {
    await openRelances([relance()]);
    root.querySelectorAll<HTMLButtonElement>('app-filter-buttons button')[1].click();
    await settle();
    http
      .expectOne(filtre('/api/messages/relances', 'RELANCES'))
      .flush(pageOf([relance({ relanceId: 3, statut: 'RELANCE', moyen: 'TELEPHONE', dateRelance: '2026-09-15' })]));
    await settle();
    expect(text(root.querySelector('tbody')!)).toContain('par téléphone · le 15/09/2026');
    expect(checkboxes()).toHaveLength(0);
    expect(sendButton()).toBeUndefined();
    // Contact manuel : pas d'aperçu.
    expect(root.querySelector('[aria-label="Aperçu de l’e-mail"]')).toBeNull();
  });

  it('avis : ancien → nouveau loyer avec l\'écart, et envoi par location et loyer', async () => {
    await open('/avis-de-loyer');
    http.expectOne(filtre('/api/messages/avis', 'A_ENVOYER')).flush(pageOf([avis()]));
    http.expectOne(all('/api/messages/avis', 'A_ENVOYER')).flush(pageOf([avis()]));
    http.expectOne('/api/messages/avis/compteurs').flush({ A_ENVOYER: 1, ENVOYES: 0 });
    await settle();

    const row = root.querySelector('tbody tr')!;
    const change = Array.from(row.querySelectorAll('.change > s, .change > b, .change > span')).map(text);
    expect(change).toEqual(['85,00 €', '88,00 €', '+3,00 €']);
    expect(text(row)).toContain('01/01/2027');
    // Avis avec e-mail : pas de contact manuel sur cet écran (tableau de bord).
    expect(row.querySelector('[aria-label="Marquer comme informé"]')).toBeNull();

    sendButton()!.click();
    await settle();
    expect(text(root.querySelector('app-modal')!)).toContain('Envoyer 1 avis de changement de loyer ?');
    Array.from(root.querySelectorAll<HTMLButtonElement>('app-modal button')).find((b) => text(b) === 'Envoyer')!.click();
    const send = http.expectOne('/api/messages/avis/envoi');
    expect(send.request.body).toEqual({ lignes: [{ locationId: 2, loyerGarageId: 5 }] });
    send.flush({ envoyes: 1, sansEmail: 0, destinataires: ['luc.martin@example.com'] });
    await settle();
    http.expectOne(filtre('/api/messages/avis', 'A_ENVOYER')).flush(pageOf([]));
    http.expectOne(all('/api/messages/avis', 'A_ENVOYER')).flush(pageOf([]));
    http.expectOne('/api/messages/avis/compteurs').flush({ A_ENVOYER: 0, ENVOYES: 1 });
    await settle();
    expect(text(root.querySelector('tbody')!)).toContain('Aucun avis à envoyer.');
  });

  it('consultation seule (sans droit a) : ni cases, ni envoi, ni contact', async () => {
    await open('/relances', 'CONSULTANT');
    http.expectOne(filtre('/api/messages/relances', 'A_RELANCER')).flush(pageOf([relance()]));
    http.expectOne('/api/messages/relances/compteurs').flush({ A_RELANCER: 1, RELANCES: 0 });
    await settle();
    expect(checkboxes()).toHaveLength(0);
    expect(sendButton()).toBeUndefined();
    expect(root.querySelector('[aria-label^="Marquer comme relancé"]')).toBeNull();
    expect(root.querySelector('[aria-label="Aperçu de l’e-mail"]')).not.toBeNull();
  });

  it('affiche l\'erreur de chargement', async () => {
    await open('/relances');
    http
      .expectOne(filtre('/api/messages/relances', 'A_RELANCER'))
      .flush({ code: 'X', message: 'Serveur indisponible.' }, { status: 500, statusText: 'Error' });
    http.expectOne(all('/api/messages/relances', 'A_RELANCER')).flush(pageOf([]));
    http.expectOne('/api/messages/relances/compteurs').flush({ A_RELANCER: 0, RELANCES: 0 });
    await settle();
    expect(text(root)).toContain('Serveur indisponible.');
  });
});
