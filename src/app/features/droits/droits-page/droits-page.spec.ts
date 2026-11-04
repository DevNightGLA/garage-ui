import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { defaultDroits, signInAs, withRight } from '../../../../testing/rights';
import { provideTestTranslations } from '../../../../testing/translations';
import { DroitAppareil, DroitProfil, DroitsMoi } from '../../../core/rights/rights.models';
import { ToastService } from '../../../shared/toast/toast';
import { DroitsPage } from './droits-page';

/** Grille des quatre profils, d'après les droits par défaut. */
function grid(): DroitProfil[] {
  return (['ADMIN', 'GESTIONNAIRE', 'LOCATAIRE', 'CONSULTANT'] as const).flatMap((p) => defaultDroits(p).ecrans);
}

function devices(): DroitAppareil[] {
  return defaultDroits('ADMIN').appareils;
}

describe('DroitsPage', () => {
  let fixture: ComponentFixture<DroitsPage>;
  let http: HttpTestingController;
  let root: HTMLElement;

  const text = (el: Element) => el.textContent!.replace(/\s+/g, ' ').trim();
  const settle = async () => {
    for (let i = 0; i < 3; i++) {
      await new Promise((resolve) => setTimeout(resolve));
      fixture.detectChanges();
    }
  };
  const pill = (label: string) => Array.from(root.querySelectorAll<HTMLButtonElement>('.sg__btn')).find((b) => text(b) === label)!;
  const section = async (label: string) => {
    Array.from(root.querySelectorAll<HTMLButtonElement>('.dp__nav-btn')).find((b) => text(b) === label)!.click();
    await settle();
  };
  const cell = (label: string) =>
    Array.from(root.querySelectorAll<HTMLButtonElement>('app-toggle-cell button')).find((b) => text(b) === label)!;
  const draft = () => text(root.querySelector('.dp__draft')!);
  const saveButton = () => Array.from(root.querySelectorAll<HTMLButtonElement>('.dp__save button')).find((b) => text(b) === 'Enregistrer')!;

  const open = async (droits: DroitsMoi = defaultDroits('ADMIN')) => {
    TestBed.configureTestingModule({
      imports: [DroitsPage],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideTestTranslations()],
    });
    signInAs(droits.profil, {}, droits);
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(DroitsPage);
    root = fixture.nativeElement;
    await settle();
    http.expectOne('/api/droits/profils').flush(grid());
    if (droits.profil === 'ADMIN') {
      http.expectOne('/api/droits/appareils').flush(devices());
    }
    await settle();
  };

  afterEach(() => http.verify());

  it('accès aux écrans : compteur par profil, colonne Admin et écrans réservés verrouillés', async () => {
    await open();
    expect(Array.from(root.querySelectorAll('.dp__head-count')).map(text)).toEqual([
      '19 sur 19 écrans',
      '13 sur 19 écrans',
      '5 sur 19 écrans',
      '13 sur 19 écrans',
    ]);
    expect(text(root.querySelector('.dp__scope')!)).toBe('Ses propres données uniquement');
    await section('Configuration');
    expect(cell('Retirer l’accès · Admin · Journal d’audit').getAttribute('aria-disabled')).toBe('true');
    const reserved = cell('Autoriser l’accès · Gestionnaire · Journal d’audit');
    expect(reserved.getAttribute('aria-disabled')).toBe('true');
    reserved.click();
    await settle();
    expect(draft()).toBe('Aucune modification');
  });

  it('une case modifiée passe en brouillon (pastille, compteur) ; Annuler revient en arrière', async () => {
    await open();
    await section('Garages');
    const consultant = cell('Retirer l’accès · Consultant · Liste des garages');
    consultant.click();
    await settle();
    expect(draft()).toBe('1 modification non enregistrée');
    expect(cell('Autoriser l’accès · Consultant · Liste des garages').classList.contains('is-changed')).toBe(true);
    expect(root.querySelector('.dp__nav-btn.is-on .dp__nav-dot')).not.toBeNull();
    // Rétablir la valeur enregistrée retire la modification.
    cell('Autoriser l’accès · Consultant · Liste des garages').click();
    await settle();
    expect(draft()).toBe('Aucune modification');
    expect(saveButton().disabled).toBe(true);

    cell('Retirer l’accès · Consultant · Liste des garages').click();
    await settle();
    Array.from(root.querySelectorAll<HTMLButtonElement>('.dp__save button')).find((b) => text(b) === 'Annuler')!.click();
    await settle();
    expect(draft()).toBe('Aucune modification');
    expect(cell('Retirer l’accès · Consultant · Liste des garages')).not.toBeNull();
  });

  it('actions autorisées : sans accès, les actions sont désactivées ; l\'enregistrement envoie les lignes modifiées', async () => {
    await open();
    pill('Actions autorisées').click();
    await settle();
    await section('Garages');
    expect(Array.from(root.querySelectorAll('.dp__tr:nth-child(2) .dp__cap')).map(text)).toEqual([
      'Consulter l’écran',
      'Créer un garage',
      'Modifier un garage',
      'Supprimer un garage',
    ]);
    // Historique des locations : actions non proposées.
    expect(root.querySelectorAll('.dp__tr:nth-child(4) .dp__na').length).toBe(3);

    cell('Retirer : Supprimer un garage · Gestionnaire · Liste des garages').click();
    cell('Retirer l’accès · Gestionnaire · Historique des loyers').click();
    await settle();
    expect(draft()).toBe('2 modifications non enregistrées');
    expect(cell('Retirer : Créer un loyer · Gestionnaire · Historique des loyers').getAttribute('aria-disabled')).toBe('true');

    saveButton().click();
    const req = http.expectOne('/api/droits/profils');
    expect(req.request.method).toBe('PUT');
    const body = req.request.body as DroitProfil[];
    expect(body.map((r) => [r.profil, r.ecran])).toEqual([
      ['GESTIONNAIRE', 'GAR'],
      ['GESTIONNAIRE', 'LOY'],
    ]);
    expect(body[0].peutSupprimer).toBe(false);
    expect(body[1]).toMatchObject({ peutVoir: false, peutAjouter: false, peutModifier: false, peutSupprimer: false });
    req.flush(grid().map((r) => body.find((b) => b.profil === r.profil && b.ecran === r.ecran) ?? r));
    await settle();
    http.expectOne('/api/droits/moi').flush(defaultDroits('ADMIN'));
    await settle();
    expect(draft()).toBe('Aucune modification');
    expect(TestBed.inject(ToastService).current()?.text).toBe('Droits d’accès enregistrés avec succès');
  });

  it('accès selon l\'appareil : ordinateur et Droits d\'accès toujours disponibles', async () => {
    await open();
    pill('Accès selon l’appareil').click();
    await settle();
    expect(Array.from(root.querySelectorAll('.dp__head-count')).map(text)).toEqual([
      '19 sur 19 écrans',
      '19 sur 19 écrans',
      '14 sur 19 écrans',
    ]);
    await section('Configuration');
    expect(cell('Droits d’accès reste disponible sur tous les appareils.').getAttribute('aria-disabled')).toBe('true');
    cell('Autoriser l’accès · Smartphone · Paramètres').click();
    await settle();
    saveButton().click();
    const req = http.expectOne('/api/droits/appareils');
    expect(req.request.body).toEqual([{ appareil: 'SMARTPHONE', ecran: 'PAR', autorise: true }]);
    req.flush(devices());
    await settle();
    http.expectOne('/api/droits/moi').flush(defaultDroits('ADMIN'));
  });

  it('une erreur d\'enregistrement reste affichée avec le brouillon', async () => {
    await open();
    await section('Garages');
    cell('Retirer l’accès · Consultant · Liste des garages').click();
    await settle();
    saveButton().click();
    http
      .expectOne('/api/droits/profils')
      .flush({ code: 'DRO_RESERVE_ADMIN', message: 'Réservé à l’Admin.' }, { status: 409, statusText: 'Conflict' });
    await settle();
    expect(text(root.querySelector('.dp__save')!)).toContain('Réservé à l’Admin.');
    expect(draft()).toBe('1 modification non enregistrée');
  });

  it('hors Admin : pas d\'onglet appareils ; sans droit m, pas de barre d\'enregistrement', async () => {
    await open(withRight(defaultDroits('GESTIONNAIRE'), 'DRO', { peutVoir: true, peutModifier: false }));
    expect(Array.from(root.querySelectorAll('.sg__btn')).map(text).slice(0, 2)).toEqual(['Accès aux écrans', 'Actions autorisées']);
    expect(Array.from(root.querySelectorAll('.sg__btn')).map(text)).not.toContain('Accès selon l’appareil');
    expect(root.querySelector('.dp__save')).toBeNull();
    await section('Garages');
    expect(cell('Retirer l’accès · Consultant · Liste des garages').getAttribute('aria-disabled')).toBe('true');
  });
});
