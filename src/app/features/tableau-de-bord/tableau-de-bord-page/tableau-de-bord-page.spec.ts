import { HttpRequest, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { pageOf } from '../../../../testing/garage-fixtures';
import { impaye, impayeTotal, tableauDeBord } from '../../../../testing/tableau-de-bord-fixtures';
import { provideTestTranslations } from '../../../../testing/translations';
import { AuthService } from '../../../core/auth/auth-service';
import { Role } from '../../../core/auth/auth.models';
import { BarChart } from '../../../shared/bar-chart/bar-chart';
import { ImpayeARelancer, TableauDeBord } from '../tableau-de-bord.models';
import { TableauDeBordPage } from './tableau-de-bord-page';

const isDashboard = (r: HttpRequest<unknown>) => r.method === 'GET' && r.url === '/api/tableau-de-bord';
const isUnpaid = (r: HttpRequest<unknown>) => r.method === 'GET' && r.url === '/api/tableau-de-bord/impayes';

describe('TableauDeBordPage', () => {
  let fixture: ComponentFixture<TableauDeBordPage>;
  let http: HttpTestingController;
  let root: HTMLElement;

  const text = (element: Element | null) => (element?.textContent ?? '').replace(/\s+/g, ' ').trim();
  /** Attend la stabilité : à n'utiliser qu'une fois toutes les requêtes ouvertes servies. */
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };
  const render = () => fixture.detectChanges();
  const click = (element: Element | null) => {
    (element as HTMLElement).click();
    render();
  };
  const signIn = (role: Role) =>
    TestBed.inject(AuthService).user.set({ id: 1, login: 'u', email: 'u@example.com', role, actif: true });
  const stub = () => root.querySelector('.bar-chart-stub')!;
  const items = () => Array.from(root.querySelectorAll('.impaye'));

  const create = (role: Role = 'ADMIN') => {
    signIn(role);
    fixture = TestBed.createComponent(TableauDeBordPage);
    root = fixture.nativeElement;
    render();
  };

  /** Ouvre l'écran et répond aux indicateurs et à la première page des impayés. */
  const open = async (
    role: Role = 'ADMIN',
    data: TableauDeBord = tableauDeBord(),
    unpaid: ImpayeARelancer[] = [impaye(), impayeTotal()],
    total = unpaid.length,
  ) => {
    create(role);
    http.expectOne(isDashboard).flush(data);
    http.expectOne(isUnpaid).flush(pageOf(unpaid, total, 0, 3));
    await settle();
  };

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideTestTranslations()],
    }).overrideComponent(BarChart, {
      // jsdom ne dessine pas de canvas : le graphique est remplacé par un témoin de ce qu'on lui passe
      set: {
        providers: [],
        imports: [],
        template: `<p class="bar-chart-stub" [attr.data-labels]="labels().join()" [attr.data-values]="values().join()" [attr.data-first]="format()(values()[0])" [attr.data-caption]="caption()"></p>`,
      },
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  describe('états', () => {
    it('affiche des tirets et le chargement tant que rien n\'est arrivé', () => {
      create();
      expect(Array.from(root.querySelectorAll('.kpi__valeur')).map((v) => text(v))).toEqual(['—', '—', '—', '—']);
      expect(text(root.querySelector('.graphique .td__etat'))).toBe('Chargement…');
      expect(text(root.querySelector('.impayes .td__etat'))).toBe('Chargement…');
      http.expectOne(isDashboard).flush(tableauDeBord());
      http.expectOne(isUnpaid).flush(pageOf([], 0, 0, 3));
    });

    it('affiche l\'erreur des indicateurs et recharge tout au clic sur Réessayer', async () => {
      create();
      http
        .expectOne(isDashboard)
        .flush({ code: 'ERREUR_INTERNE', message: 'Une erreur inattendue est survenue.' }, { status: 500, statusText: 'Server Error' });
      http.expectOne(isUnpaid).flush(pageOf([impaye()], 1, 0, 3));
      await settle();
      expect(text(root.querySelector('.td__erreur'))).toContain('Une erreur inattendue est survenue.');

      click(root.querySelector('.td__erreur button'));
      http.expectOne(isDashboard).flush(tableauDeBord());
      http.expectOne(isUnpaid).flush(pageOf([impaye()], 1, 0, 3));
      await settle();
      expect(root.querySelector('.td__erreur')).toBeNull();
      expect(text(root.querySelector('.kpi__valeur'))).toBe('58 %');
    });

    it('affiche l\'erreur des impayés dans leur carte et la recharge seule', async () => {
      create();
      http.expectOne(isDashboard).flush(tableauDeBord());
      http
        .expectOne(isUnpaid)
        .flush({ code: 'ERREUR_INTERNE', message: 'Une erreur inattendue est survenue.' }, { status: 500, statusText: 'Server Error' });
      await settle();
      expect(text(root.querySelector('.impayes .td__etat--erreur'))).toContain('Une erreur inattendue est survenue.');
      expect(root.querySelector('.td__erreur')).toBeNull();

      click(root.querySelector('.impayes .td__etat--erreur button'));
      http.expectOne(isUnpaid).flush(pageOf([impaye()], 1, 0, 3));
      await settle();
      expect(items()).toHaveLength(1);
    });

    it('affiche « Aucun impayé à relancer. » quand il n\'y en a aucun', async () => {
      await open('ADMIN', tableauDeBord(), []);
      expect(text(root.querySelector('.impayes__titre'))).toBe('Impayés à relancer (0)');
      expect(text(root.querySelector('.impayes .td__etat'))).toBe('Aucun impayé à relancer.');
      expect(root.querySelector('.impayes__pied')).toBeNull();
    });
  });

  describe('indicateurs (RG-DAS-01 à 04)', () => {
    it('affiche taux d\'occupation, loyers mensuels, impayés et garages libres avec leur note', async () => {
      await open();
      const cards = Array.from(root.querySelectorAll('.kpi')).map((card) => ({
        titre: text(card.querySelector('.kpi__label')),
        valeur: text(card.querySelector('.kpi__valeur')),
        note: text(card.querySelector('.kpi__note')),
      }));
      expect(cards).toEqual([
        { titre: 'Taux d’occupation', valeur: '58 %', note: '7 garages loués sur 12' },
        { titre: 'Loyers mensuels', valeur: '600,00 €', note: 'Locations actives' },
        { titre: 'Impayés', valeur: '120,00 €', note: '1 impayés totaux · 1 partiels' },
        { titre: 'Garages libres', valeur: '4', note: '1 indisponible' },
      ]);
    });

    it('suit les valeurs de l\'API', async () => {
      await open(
        'ADMIN',
        tableauDeBord({
          tauxOccupation: { pourcentage: 100, garagesLoues: 3, garagesTotal: 3 },
          loyersMensuels: 1234.5,
          impayes: { montant: 0, nbTotaux: 0, nbPartiels: 0 },
          garagesLibres: { nombre: 0, nombreIndisponibles: 0 },
        }),
      );
      expect(Array.from(root.querySelectorAll('.kpi__valeur')).map((v) => text(v))).toEqual(['100 %', '1 234,50 €', '0,00 €', '0']);
    });
  });

  describe('graphiques sur 12 mois (RG-DAS-05)', () => {
    it('montre d\'abord les loyers encaissés : titre, légende, mois et montants', async () => {
      await open();
      expect(text(root.querySelector('.graphique__titre'))).toBe('Loyers encaissés');
      expect(text(root.querySelector('.graphique__legende'))).toBe('12 derniers mois, en euros');
      expect(text(root.querySelector('.graphique__numero'))).toBe('1/2');
      expect(stub().getAttribute('data-labels')).toBe('Nov,Déc,Janv,Févr,Mars,Avr,Mai,Juin,Juil,Août,Sept,Oct');
      expect(stub().getAttribute('data-values')).toBe('400,420,440,460,480,500,520,540,560,580,600,620');
      expect(stub().getAttribute('data-first')?.replace(/\s/g, ' ')).toBe('400 €');
      expect(stub().getAttribute('data-caption')).toBe('12 derniers mois, en euros');
    });

    it('passe au taux d\'occupation avec la flèche suivante, en pourcentage', async () => {
      await open();
      click(root.querySelectorAll('.graphique__fleche')[1]);
      expect(text(root.querySelector('.graphique__titre'))).toBe('Taux d’occupation');
      expect(text(root.querySelector('.graphique__legende'))).toBe('Garages loués, 12 derniers mois, en %');
      expect(text(root.querySelector('.graphique__numero'))).toBe('2/2');
      expect(stub().getAttribute('data-values')).toBe('40,42,44,46,48,50,52,54,56,58,60,62');
      expect(stub().getAttribute('data-first')).toBe('40 %');
    });

    it('les flèches font le tour des deux graphiques', async () => {
      await open();
      const [previous, next] = Array.from(root.querySelectorAll('.graphique__fleche'));
      click(previous);
      expect(text(root.querySelector('.graphique__numero'))).toBe('2/2');
      click(next);
      expect(text(root.querySelector('.graphique__numero'))).toBe('1/2');
      click(next);
      click(next);
      expect(text(root.querySelector('.graphique__titre'))).toBe('Loyers encaissés');
    });

    it('les flèches ont une info-bulle', async () => {
      await open();
      expect(Array.from(root.querySelectorAll('.graphique__fleche')).map((b) => b.getAttribute('aria-label'))).toEqual([
        'Graphique précédent',
        'Graphique suivant',
      ]);
    });

    it('le dernier point des deux séries est celui du mois courant', async () => {
      const data = tableauDeBord();
      expect(data.loyersEncaisses12Mois.at(-1)!.mois).toBe('2026-10');
      expect(data.tauxOccupation12Mois).toHaveLength(12);
      await open('ADMIN', data);
      expect(stub().getAttribute('data-labels')!.split(',').at(-1)).toBe('Oct');
    });
  });

  describe('impayés à relancer (RG-DAS-06)', () => {
    it('demande la première page de 3, sans tri', async () => {
      create();
      http.expectOne(isDashboard).flush(tableauDeBord());
      const request = http.expectOne(isUnpaid);
      expect(request.request.params.get('page')).toBe('0');
      expect(request.request.params.get('size')).toBe('3');
      expect(request.request.params.has('sort')).toBe(false);
      request.flush(pageOf([impaye()], 1, 0, 3));
      await settle();
    });

    it('affiche locataire, reste dû, garage, période et badge Total ou Partiel', async () => {
      await open('ADMIN', tableauDeBord(), [impaye(), impayeTotal()], 2);
      expect(text(root.querySelector('.impayes__titre'))).toBe('Impayés à relancer (2)');
      const [partial, total] = items();
      expect(text(partial.querySelector('.impaye__locataire'))).toBe('Pierre Dubois');
      expect(text(partial.querySelector('.impaye__montant'))).toBe('40,00 €');
      expect(text(partial.querySelector('.impaye__periode'))).toBe('G06 · Septembre 2026');
      expect(text(partial.querySelector('app-status-badge'))).toBe('Partiel');
      expect(text(total.querySelector('.impaye__locataire'))).toBe('Sophie Lambert');
      expect(text(total.querySelector('.impaye__montant'))).toBe('80,00 €');
      expect(text(total.querySelector('.impaye__periode'))).toBe('G03 · Août 2026');
      expect(text(total.querySelector('app-status-badge'))).toBe('Total');
    });

    it('colore le badge : Total en rouge, Partiel en orange', async () => {
      await open();
      const tones = Array.from(root.querySelectorAll('.impaye app-status-badge')).map((badge) =>
        Array.from(badge.classList).find((c) => c.startsWith('tone-')),
      );
      expect(tones).toEqual(['tone-warning', 'tone-danger']);
    });

    it('donne « Reçu x sur y » en info-bulle d\'un impayé partiel, rien pour un total', async () => {
      await open();
      const [partial, total] = items();
      const bubble = () => document.querySelector<HTMLElement>('[role="tooltip"]');
      partial.querySelector('.impaye__badge')!.dispatchEvent(new Event('mouseenter'));
      expect(bubble()!.style.display).toBe('block');
      expect(bubble()!.textContent?.replace(/\s/g, ' ')).toBe('Reçu 40,00 € sur 80,00 €');
      partial.querySelector('.impaye__badge')!.dispatchEvent(new Event('mouseleave'));
      total.querySelector('.impaye__badge')!.dispatchEvent(new Event('mouseenter'));
      expect(bubble()!.style.display).toBe('none');
    });

    it('n\'affiche pas de pagination pour 3 impayés ou moins', async () => {
      await open('ADMIN', tableauDeBord(), [impaye(), impayeTotal(), impaye()], 3);
      expect(root.querySelector('.impayes__pied')).toBeNull();
    });

    it('pagine par 3 : compteur, flèches et demande de la page suivante', async () => {
      await open('ADMIN', tableauDeBord(), [impaye(), impayeTotal(), impaye()], 5);
      expect(text(root.querySelector('.impayes__pied span'))).toBe('1–3 sur 5');
      const [previous, next] = Array.from(root.querySelectorAll<HTMLButtonElement>('.impayes__page'));
      expect(previous.disabled).toBe(true);
      expect(next.disabled).toBe(false);

      click(next);
      const request = http.expectOne(isUnpaid);
      expect(request.request.params.get('page')).toBe('1');
      expect(request.request.params.get('size')).toBe('3');
      request.flush(pageOf([impayeTotal(), impaye()], 5, 1, 3));
      await settle();
      expect(text(root.querySelector('.impayes__pied span'))).toBe('4–5 sur 5');
      expect(items()).toHaveLength(2);
      expect(root.querySelectorAll<HTMLButtonElement>('.impayes__page')[0].disabled).toBe(false);
      expect(root.querySelectorAll<HTMLButtonElement>('.impayes__page')[1].disabled).toBe(true);

      click(root.querySelectorAll('.impayes__page')[0]);
      const back = http.expectOne(isUnpaid);
      expect(back.request.params.get('page')).toBe('0');
      back.flush(pageOf([impaye(), impayeTotal(), impaye()], 5, 0, 3));
      await settle();
      expect(text(root.querySelector('.impayes__pied span'))).toBe('1–3 sur 5');
    });
  });

  describe('droits', () => {
    for (const role of ['ADMIN', 'GESTIONNAIRE', 'LECTURE_SEULE'] as const) {
      it(`${role} : consulte indicateurs, graphiques et impayés, sans action de modification`, async () => {
        await open(role);
        expect(root.querySelectorAll('.kpi')).toHaveLength(4);
        expect(stub()).not.toBeNull();
        expect(items()).toHaveLength(2);
        expect(root.querySelector('.btn--primary')).toBeNull();
        expect(root.querySelector('.icon-btn')).toBeNull();
      });
    }
  });
});
