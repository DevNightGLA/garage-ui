import { HttpRequest, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { pageOf } from '../../../../testing/garage-fixtures';
import { revokeRight, signInAs } from '../../../../testing/rights';
import {
  avisLoyer,
  impaye,
  impayeTotal,
  relance,
  remarqueATraiter,
  tableauDeBord,
} from '../../../../testing/tableau-de-bord-fixtures';
import { provideTestTranslations } from '../../../../testing/translations';
import { Role } from '../../../core/auth/auth.models';
import { TODAY } from '../../../core/today';
import { TableauDeBordPage } from './tableau-de-bord-page';

const url = (path: string) => (r: HttpRequest<unknown>) => r.method === 'GET' && r.url === path;
const isDashboard = url('/api/tableau-de-bord');
const isUnpaid = url('/api/tableau-de-bord/impayes');
const isTodo = url('/api/tableau-de-bord/remarques');
const isNotices = url('/api/tableau-de-bord/avis');
const isReminders = url('/api/messages/relances');

describe('TableauDeBordPage', () => {
  let fixture: ComponentFixture<TableauDeBordPage>;
  let http: HttpTestingController;
  let root: HTMLElement;
  let navigate: ReturnType<typeof vi.spyOn>;

  const text = (element: Element | null) => (element?.textContent ?? '').replace(/\s+/g, ' ').trim();
  const settle = async () => {
    for (let i = 0; i < 3; i++) {
      await new Promise((resolve) => setTimeout(resolve));
      fixture.detectChanges();
    }
  };
  const cards = () => Array.from(root.querySelectorAll('app-task-card'));

  /** Ouvre l'écran et répond aux cinq requêtes de départ. */
  const open = async (role: Role = 'ADMIN', options: { unpaid?: unknown[]; todo?: unknown[]; notices?: unknown[] } = {}) => {
    signInAs(role);
    fixture = TestBed.createComponent(TableauDeBordPage);
    root = fixture.nativeElement;
    fixture.detectChanges();
    http.expectOne(isDashboard).flush(tableauDeBord());
    const unpaid = options.unpaid ?? [impaye(), impayeTotal()];
    http.expectOne(isUnpaid).flush(pageOf(unpaid, unpaid.length, 0, 5));
    const todo = options.todo ?? [remarqueATraiter()];
    http.expectOne(isTodo).flush(pageOf(todo, todo.length, 0, 5));
    http.expectOne(isNotices).flush(options.notices ?? [avisLoyer()]);
    if (role !== 'LOCATAIRE') {
      http.expectOne(isReminders).flush(pageOf([relance(), relance({ echeanceId: 11, garageId: 3, periode: '2026-08-01', email: null })]));
    }
    await settle();
  };

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTestTranslations(),
        { provide: TODAY, useValue: () => new Date(2026, 10, 1) },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });

  afterEach(() => http.verify());

  it('quatre indicateurs, puis les trois cartes de la maquette v2, sans graphique', async () => {
    await open();
    expect(Array.from(root.querySelectorAll('.kpi__valeur')).map(text)).toEqual(['58 %', '600,00 €', '120,00 €', '4']);
    expect(cards().map((card) => text(card.querySelector('.tc__title')))).toEqual([
      'Impayés à relancer (2)',
      'Remarques à traiter (1)',
      'Avis de loyer à communiquer (1)',
    ]);
    expect(root.querySelector('app-bar-chart')).toBeNull();
  });

  it('lignes par carte : paramètre lignes_hist', async () => {
    signInAs('ADMIN');
    fixture = TestBed.createComponent(TableauDeBordPage);
    fixture.detectChanges();
    expect(http.expectOne(isUnpaid).request.params.get('size')).toBe('5');
    expect(http.expectOne(isTodo).request.params.get('size')).toBe('5');
    http.expectOne(isDashboard).flush(tableauDeBord());
    http.expectOne(isNotices).flush([]);
    http.expectOne(isReminders).flush(pageOf([]));
  });

  describe('impayés à relancer (RG-DAS-06)', () => {
    it('locataire, garage et période, type et reste dû, « Reçu x sur y » pour un partiel', async () => {
      await open();
      const row = cards()[0].querySelector('.task-row')!;
      expect(text(row.querySelector('.impaye__textes b'))).toBe('Pierre Dubois');
      expect(text(row.querySelector('.impaye__textes span'))).toBe('G06 · Septembre 2026');
      expect(text(row.querySelector('.montant-pill__type'))).toBe('Partiel');
      expect(text(row.querySelector('.montant-pill__valeur'))).toBe('40,00 €');
    });

    it('avec e-mail : « E-mail » ouvre l\'écran Relances sur l\'échéance ; sans e-mail : « Relancé » seul', async () => {
      await open();
      const [first, second] = Array.from(cards()[0].querySelectorAll('.task-row'));
      expect(Array.from(first.querySelectorAll('.actions-pile button')).map(text)).toEqual(['E-mail', 'Relancé']);
      expect(Array.from(second.querySelectorAll('.actions-pile button')).map(text)).toEqual(['Relancé']);
      (first.querySelector('.actions-pile button') as HTMLButtonElement).click();
      expect(navigate).toHaveBeenCalledWith(['/relances'], { queryParams: { echeance: 10 } });
    });

    it('« Relancé » enregistre le contact manuel puis recharge la carte', async () => {
      await open();
      const row = cards()[0].querySelectorAll('.task-row')[1];
      (row.querySelector('.actions-pile button') as HTMLButtonElement).click();
      await settle();
      expect(text(root.querySelector('app-contact-dialog .modal__title'))).toBe('Marquer comme relancé');
      root.querySelector('#contact-form')!.dispatchEvent(new Event('submit'));
      await settle();
      const post = http.expectOne('/api/messages/relances/manuelle');
      expect(post.request.body).toEqual({ echeanceId: 11, moyen: 'TELEPHONE', date: '2026-11-01' });
      post.flush({});
      await settle();
      http.expectOne(isUnpaid).flush(pageOf([impaye()], 1, 0, 5));
      http.expectOne(isReminders).flush(pageOf([relance()]));
      await settle();
      expect(root.querySelector('app-contact-dialog')).toBeNull();
    });

    it('sans le droit d\'ajout des relances : pas d\'actions', async () => {
      await open('GESTIONNAIRE');
      revokeRight('REL', { peutAjouter: false });
      await settle();
      http.match(isReminders).forEach((request) => request.flush(pageOf([relance()])));
      await settle();
      expect(cards()[0].querySelector('.actions-pile')).toBeNull();
    });
  });

  describe('remarques à traiter', () => {
    it('garage ou locataire, texte sans balises, ancienneté, ouverture des remarques', async () => {
      await open('ADMIN', {
        todo: [
          remarqueATraiter(),
          remarqueATraiter({ id: 7, garageId: null, garage: null, locataireId: 6, locataire: 'Dubois Pierre', dateCreation: '2026-11-01T10:00:00' }),
        ],
      });
      const [garage, locataire] = Array.from(cards()[1].querySelectorAll('.task-row'));
      expect(text(garage.querySelector('.todo__texte b'))).toBe('Garage G06');
      expect(text(garage.querySelector('.todo__texte p'))).toBe('Porte difficile à ouvrir .');
      expect(text(garage.querySelector('.todo__meta'))).toBe('depuis 30 j');
      expect(text(locataire.querySelector('.avatar-rond'))).toBe('DP');
      expect(text(locataire.querySelector('.todo__meta'))).toBe('aujourd’hui');

      (garage.querySelector('.todo__ouvrir') as HTMLButtonElement).click();
      expect(navigate).toHaveBeenCalledWith(['/garages'], { queryParams: { remarques: 6 } });
      (locataire.querySelector('.todo__ouvrir') as HTMLButtonElement).click();
      expect(navigate).toHaveBeenCalledWith(['/locataires'], { queryParams: { remarques: 6 } });
    });

    it('« Aucune remarque à traiter. » quand il n\'y en a pas', async () => {
      await open('ADMIN', { todo: [] });
      expect(text(cards()[1].querySelector('.tc__state'))).toBe('Aucune remarque à traiter.');
    });
  });

  describe('avis de loyer à communiquer (RG-DAS-07)', () => {
    it('quatre avis au plus et « n autres avis »', async () => {
      await open('ADMIN', {
        notices: Array.from({ length: 6 }, (_, i) => avisLoyer({ locationId: i + 1, email: i % 2 ? 'a@example.com' : null })),
      });
      expect(cards()[2].querySelectorAll('.task-row')).toHaveLength(4);
      expect(text(cards()[2].querySelector('.avis__autres'))).toBe('2 autre(s) avis');
    });

    it('ancien et nouveau loyer avec l\'écart ; sans e-mail : téléphone et « Marquer informé »', async () => {
      await open();
      const row = cards()[2].querySelector('.task-row')!;
      expect(Array.from(row.querySelectorAll('.avis__infos span')).map(text)).toEqual(['G05', 'dès le 01/12/2026', '0470 00 00 05']);
      expect(Array.from(row.querySelectorAll('.avis__loyer > s, .avis__loyer > b, .avis__loyer > span')).map(text)).toEqual([
        '75,00 €',
        '78,00 €',
        '+3,00 €',
      ]);
      (row.querySelector('.avis__action') as HTMLButtonElement).click();
      await settle();
      root.querySelector('#contact-form')!.dispatchEvent(new Event('submit'));
      await settle();
      const post = http.expectOne('/api/messages/avis/informe');
      expect(post.request.body).toEqual({ locationId: 5, loyerGarageId: 18, moyen: 'TELEPHONE', date: '2026-11-01' });
      post.flush({});
      await settle();
      http.expectOne(isNotices).flush([]);
      await settle();
      expect(text(cards()[2].querySelector('.tc__state'))).toBe('Aucun avis de loyer à communiquer.');
    });

    it('avec e-mail : « Envoyer l\'e-mail » ouvre l\'écran Avis de loyer ; Consultant : aucune action', async () => {
      await open('ADMIN', { notices: [avisLoyer({ email: 'eva@example.com' })] });
      (cards()[2].querySelector('.avis__action') as HTMLButtonElement).click();
      expect(navigate).toHaveBeenCalledWith(['/avis-de-loyer']);
    });

    it('Consultant : aucune action dans les cartes', async () => {
      await open('CONSULTANT');
      expect(root.querySelector('.actions-pile')).toBeNull();
      expect(root.querySelector('.avis__action')).toBeNull();
    });
  });

  it('affiche l\'erreur des indicateurs et recharge tout au clic sur Réessayer', async () => {
    signInAs('ADMIN');
    fixture = TestBed.createComponent(TableauDeBordPage);
    root = fixture.nativeElement;
    fixture.detectChanges();
    http
      .expectOne(isDashboard)
      .flush({ code: 'ERREUR_INTERNE', message: 'Une erreur inattendue est survenue.' }, { status: 500, statusText: 'Server Error' });
    http.expectOne(isUnpaid).flush(pageOf([]));
    http.expectOne(isTodo).flush(pageOf([]));
    http.expectOne(isNotices).flush([]);
    http.expectOne(isReminders).flush(pageOf([]));
    await settle();
    expect(text(root.querySelector('.td__erreur'))).toContain('Une erreur inattendue est survenue.');
    (root.querySelector('.td__erreur button') as HTMLButtonElement).click();
    await new Promise((resolve) => setTimeout(resolve));
    http.expectOne(isDashboard).flush(tableauDeBord());
    http.expectOne(isUnpaid).flush(pageOf([]));
    http.expectOne(isTodo).flush(pageOf([]));
    http.expectOne(isNotices).flush([]);
    await settle();
    expect(root.querySelector('.td__erreur')).toBeNull();
  });
});
