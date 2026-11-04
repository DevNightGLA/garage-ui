import { HttpRequest, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { pageOf } from '../../../../testing/garage-fixtures';
import { signInAs } from '../../../../testing/rights';
import { provideTestTranslations } from '../../../../testing/translations';
import { SettingsService } from '../../../core/settings-service';
import { OperationAuditDTO } from '../journal.models';
import { JournalPage } from './journal-page';

function op(overrides: Partial<OperationAuditDTO> = {}): OperationAuditDTO {
  return {
    revisionId: 9,
    dateHeure: '2026-11-04T12:44:32.93',
    action: 'M',
    utilisateurId: 2,
    utilisateurLogin: 'gestionnaire',
    utilisateurNom: 'Bruno Declercq',
    concept: 'LOYER_GARAGE',
    conceptLibelle: 'Loyer',
    enregistrementId: 5,
    libelle: 'Loyer G05 · 85,00 €',
    contexte: null,
    ...overrides,
  };
}

describe('JournalPage', () => {
  let fixture: ComponentFixture<JournalPage>;
  let http: HttpTestingController;
  let root: HTMLElement;

  const isJournal = (req: HttpRequest<unknown>) => req.url === '/api/journal';
  const text = (el: Element) => el.textContent!.replace(/\s+/g, ' ').trim();
  const settle = async () => {
    for (let i = 0; i < 3; i++) {
      await new Promise((resolve) => setTimeout(resolve));
      fixture.detectChanges();
    }
  };
  const button = (label: string) =>
    Array.from(root.querySelectorAll<HTMLButtonElement>('button')).find((b) => text(b).startsWith(label))!;

  const open = async () => {
    TestBed.configureTestingModule({
      imports: [JournalPage],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideTestTranslations()],
    });
    signInAs('ADMIN');
    vi.spyOn(TestBed.inject(SettingsService), 'today').mockReturnValue(new Date(2026, 10, 4));
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(JournalPage);
    root = fixture.nativeElement;
    await settle();
    http.expectOne((r) => r.url === '/api/utilisateurs').flush(
      pageOf([
        { id: 1, nom: 'Verhaegen', prenom: 'Alice' },
        { id: 2, nom: 'Declercq', prenom: 'Bruno' },
      ]),
    );
    await settle();
  };

  afterEach(() => http.verify());

  it('invite à générer, puis groupe les opérations par jour et par révision', async () => {
    await open();
    expect(text(root.querySelector('.jp__prompt')!)).toContain('Choisissez un utilisateur et une période');
    button('Générer l’historique').click();
    const req = http.expectOne(isJournal);
    expect(req.request.params.get('sort')).toBe('dateHeure,desc');
    expect(req.request.params.get('size')).toBe('20');
    req.flush({
      ...pageOf([
        op(),
        op({ concept: 'LOYER_GARAGE', enregistrementId: 6, libelle: 'Loyer G05 · 90,00 €', action: 'C', contexte: 'Clôture automatique.' }),
        op({ revisionId: 3, dateHeure: '2026-11-03T08:00:00', action: 'S', concept: 'GARAGE', libelle: 'Garage G15' }),
      ]),
      totalElements: 25,
    });
    await settle();
    const days = Array.from(root.querySelectorAll('.jl__day-head')).map((h) => Array.from(h.children).map(text));
    expect(days).toEqual([
      ['Mercredi 4 novembre 2026', 'Aujourd’hui'],
      ['Mardi 3 novembre 2026', 'Hier'],
    ]);
    expect(text(root.querySelector('.jl__linked')!)).toBe('2 enregistrements liés');
    expect(text(root.querySelector('.jl__ctx')!)).toBe('Clôture automatique.');
    expect(text(root.querySelector('.jl__foot')!)).toContain('3 sur 25 opérations');

    button('Afficher plus').click();
    const next = http.expectOne(isJournal);
    expect(next.request.params.get('page')).toBe('1');
    next.flush({ ...pageOf([op({ revisionId: 1, dateHeure: '2026-10-01T10:00:00' })]), totalElements: 25 });
    await settle();
    expect(root.querySelectorAll('.jl__entry').length).toBe(4);
  });

  it('filtre par utilisateur ; des critères changés affichent le bandeau « Régénérer »', async () => {
    await open();
    Array.from(root.querySelectorAll<HTMLButtonElement>('.jp__nav-btn')).find((b) => text(b).includes('Declercq Bruno'))!.click();
    await settle();
    button('Générer l’historique').click();
    const req = http.expectOne(isJournal);
    expect(req.request.params.get('utilisateurs')).toBe('2');
    req.flush(pageOf([op()]));
    await settle();
    // Une seule personne : l'auteur n'est pas répété.
    expect(root.querySelector('.jl__user')).toBeNull();

    const select = root.querySelector<HTMLSelectElement>('select.jp__action')!;
    select.value = 'S';
    select.dispatchEvent(new Event('change'));
    await settle();
    expect(text(root.querySelector('.jp__stale')!)).toContain('Les critères ont changé');
    button('Régénérer l’historique').click();
    const again = http.expectOne(isJournal);
    expect(again.request.params.get('action')).toBe('SUPPRESSION');
    again.flush(pageOf([]));
    await settle();
    expect(root.querySelector('.jp__stale')).toBeNull();
    expect(text(root.querySelector('.jl__empty')!)).toBe('Aucune opération ne correspond à ces critères.');
  });

  it('détail avant / après chargé à l\'ouverture, puis fil conducteur de l\'enregistrement', async () => {
    await open();
    button('Générer l’historique').click();
    http.expectOne(isJournal).flush(pageOf([op()]));
    await settle();
    root.querySelector<HTMLButtonElement>('.jl__entry-head')!.click();
    await settle();
    http.expectOne('/api/journal/LOYER_GARAGE/5/9').flush({
      operation: op(),
      valeurs: {},
      champs: [
        { champ: 'montant', avant: '85,00 €', apres: '90,00 €', modifie: true, masque: false },
        { champ: 'date_debut', avant: '01/01/2026', apres: '01/01/2026', modifie: false, masque: false },
      ],
    });
    await settle();
    const rows = Array.from(root.querySelectorAll('app-diff-table tbody tr'));
    expect(rows.length).toBe(1);
    expect(text(rows[0])).toContain('Montant mensuel');

    button('Historique de cet enregistrement').click();
    await settle();
    http.expectOne('/api/journal/LOYER_GARAGE/5').flush([op({ revisionId: 2, action: 'C' }), op()]);
    await settle();
    expect(text(root.querySelector('.jp__title')!)).toBe('Loyer · Loyer G05 · 85,00 €');
    expect(text(root.querySelector('.jp__sub')!)).toBe('Enregistrement n° 5, du plus ancien au plus récent');
    expect(root.querySelectorAll('.jl__entry').length).toBe(2);
    button('Retour au journal').click();
    await settle();
    expect(root.querySelectorAll('.jl__entry').length).toBe(1);
  });

  it('assistant : période, personnes, concepts, nombre d\'opérations, puis résultat', async () => {
    await open();
    Array.from(root.querySelectorAll<HTMLButtonElement>('.sg__btn')).find((b) => text(b) === 'Par critères')!.click();
    await settle();
    Array.from(root.querySelectorAll<HTMLButtonElement>('.jw__preset')).find((b) => text(b) === '7 jours')!.click();
    await settle();
    button('Suivant').click();
    await settle();
    root.querySelectorAll<HTMLButtonElement>('.jw__choice')[1].click();
    await settle();
    button('Suivant').click();
    await settle();
    Array.from(root.querySelectorAll<HTMLButtonElement>('.jw__choice')).find((b) => text(b) === 'Garage')!.click();
    await settle();
    button('Suivant').click();
    await settle();
    const count = http.expectOne(isJournal);
    expect(count.request.params.get('du')).toBe('2026-10-28');
    expect(count.request.params.get('au')).toBe('2026-11-04');
    expect(count.request.params.get('utilisateurs')).toBe('2');
    expect(count.request.params.get('concepts')).toBe('GARAGE');
    expect(count.request.params.get('size')).toBe('1');
    count.flush({ ...pageOf([op()]), totalElements: 4 });
    await settle();
    expect(text(root.querySelector('.jw__recap')!)).toContain('Du 28/10/2026 au 04/11/2026');
    expect(text(root.querySelector('.jw__recap')!)).toContain('Declercq Bruno');
    expect(text(root.querySelector('.jw__count')!)).toBe('4 opérations correspondent à ces critères');

    button('Afficher le fil conducteur').click();
    await settle();
    http.expectOne(isJournal).flush({ ...pageOf([op()]), totalElements: 4 });
    await settle();
    expect(text(root.querySelector('.jp__title')!)).toBe('Fil conducteur de l’audit 4');
    expect(text(root.querySelector('.jp__sub')!)).toBe('Du 28/10/2026 au 04/11/2026 · Declercq Bruno · Garage');
    button('Modifier les critères').click();
    await settle();
    http.expectOne(isJournal).flush({ ...pageOf([]), totalElements: 4 });
    expect(root.querySelector('app-journal-wizard')).not.toBeNull();
  });

  it('assistant : une période à l\'envers est refusée', async () => {
    await open();
    Array.from(root.querySelectorAll<HTMLButtonElement>('.sg__btn')).find((b) => text(b) === 'Par critères')!.click();
    await settle();
    const [du, au] = Array.from(root.querySelectorAll<HTMLInputElement>('app-date-input input'));
    du.value = '10/11/2026';
    du.dispatchEvent(new Event('input'));
    au.value = '01/11/2026';
    au.dispatchEvent(new Event('input'));
    await settle();
    button('Suivant').click();
    await settle();
    expect(text(root.querySelector('.message-error')!)).toBe('La date de début doit précéder la date de fin.');
  });
});
