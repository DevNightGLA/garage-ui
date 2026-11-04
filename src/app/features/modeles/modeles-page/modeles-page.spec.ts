import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { defaultDroits, signInAs, withRight } from '../../../../testing/rights';
import { provideTestTranslations } from '../../../../testing/translations';
import { ToastService } from '../../../shared/toast/toast';
import { ParametreDTO } from '../../parametres/parametres.models';
import { ModelesPage } from './modeles-page';

function modele(cle: string, valeur: string, type: ParametreDTO['type'] = 'TEXTE'): ParametreDTO {
  return {
    nature: 'METIER',
    categorie: 'modeles_messages',
    cle,
    libelle: cle,
    type,
    valeur,
    obligatoire: cle !== 'signature',
    ordre: 1,
    min: null,
    max: null,
    choix: null,
    dateModification: '2026-11-04T08:00:00',
  };
}

const MODELES: ParametreDTO[] = [
  modele('modele_avis_objet', 'Changement du loyer {garage}'),
  modele('modele_avis_texte', '<p>Bonjour {nom}</p>', 'TEXTE_RICHE'),
  modele('modele_relance_total_objet', 'Loyer impayé {garage}'),
  modele('modele_relance_total_texte', '<p>Impayé</p>', 'TEXTE_RICHE'),
  modele('modele_relance_partiel_objet', 'Solde {garage}'),
  modele('modele_relance_partiel_texte', '<p>Partiel</p>', 'TEXTE_RICHE'),
  modele('signature', '<p>Cordialement,<br>{expediteur}</p>', 'TEXTE_RICHE'),
];

describe('ModelesPage', () => {
  let fixture: ComponentFixture<ModelesPage>;
  let http: HttpTestingController;
  let root: HTMLElement;

  const text = (el: Element) => el.textContent!.replace(/\s+/g, ' ').trim();
  const settle = async () => {
    for (let i = 0; i < 3; i++) {
      await new Promise((resolve) => setTimeout(resolve));
      fixture.detectChanges();
    }
  };
  const buttons = () => Array.from(root.querySelectorAll<HTMLButtonElement>('.mp__btn'));

  const open = async (droits = defaultDroits('ADMIN')) => {
    TestBed.configureTestingModule({
      imports: [ModelesPage],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideTestTranslations()],
    });
    signInAs('ADMIN', {}, droits);
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ModelesPage);
    root = fixture.nativeElement;
    await settle();
    http.expectOne('/api/modeles-messages').flush(MODELES);
    await settle();
  };

  afterEach(() => http.verify());

  it('liste les trois modèles avec leur objet, puis la signature', async () => {
    await open();
    const rows = Array.from(root.querySelectorAll('.mp__text')).map((row) => [
      text(row.querySelector('.mp__label')!),
      text(row.querySelector('.mp__subject')!),
    ]);
    expect(rows).toEqual([
      ['Avis de loyer', 'Objet : Changement du loyer {garage}'],
      ['Relance · Impayé total', 'Objet : Loyer impayé {garage}'],
      ['Relance · Paiement partiel', 'Objet : Solde {garage}'],
    ]);
    expect(root.querySelector('.mp__signature')!.innerHTML).toContain('{expediteur}');
    expect(buttons().map(text)).toEqual(['Modifier', 'Modifier', 'Modifier', 'Modifier']);
  });

  it('modifie un modèle : objet et texte envoyés, objet mis à jour, message de succès', async () => {
    await open();
    buttons()[1].click();
    await settle();
    const modal = root.querySelector('app-modal')!;
    expect(text(modal.querySelector('.modal__title')!)).toBe('Modèle · Impayé total');
    expect(modal.querySelectorAll('.vc__chip').length).toBe(12);
    const objet = modal.querySelector<HTMLInputElement>('input[formcontrolname="objet"]')!;
    expect(objet.value).toBe('Loyer impayé {garage}');
    objet.value = 'Rappel {garage}';
    objet.dispatchEvent(new Event('input'));
    root.querySelector<HTMLButtonElement>('button[form="modele-form"]')!.click();
    const req = http.expectOne('/api/modeles-messages');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.parametres.map((p: { cle: string }) => p.cle)).toEqual([
      'modele_relance_total_objet',
      'modele_relance_total_texte',
    ]);
    expect(req.request.body.parametres[0].valeur).toBe('Rappel {garage}');
    req.flush(MODELES.map((p) => (p.cle === 'modele_relance_total_objet' ? { ...p, valeur: 'Rappel {garage}' } : p)));
    await settle();
    expect(root.querySelector('app-modal')).toBeNull();
    expect(text(root.querySelectorAll('.mp__subject')[1])).toBe('Objet : Rappel {garage}');
    expect(TestBed.inject(ToastService).current()?.text).toBe('Modèle du message enregistré avec succès');
  });

  it('objet vide : surligné, rien n\'est envoyé', async () => {
    await open();
    buttons()[0].click();
    await settle();
    const objet = root.querySelector<HTMLInputElement>('input[formcontrolname="objet"]')!;
    objet.value = '';
    objet.dispatchEvent(new Event('input'));
    root.querySelector<HTMLButtonElement>('button[form="modele-form"]')!.click();
    await settle();
    expect(root.querySelectorAll('app-form-field.is-invalid').length).toBe(1);
  });

  it('signature : message seul, variables de l\'expéditeur et de l\'organisation', async () => {
    await open();
    buttons()[3].click();
    await settle();
    expect(root.querySelector('input[formcontrolname="objet"]')).toBeNull();
    expect(Array.from(root.querySelectorAll('.vc__chip')).map(text)).toEqual(['{expediteur}', '{entreprise}', '{coordonnees}', '{iban}']);
    root.querySelector<HTMLButtonElement>('button[form="modele-form"]')!.click();
    const req = http.expectOne('/api/modeles-messages');
    expect(req.request.body.parametres.map((p: { cle: string }) => p.cle)).toEqual(['signature']);
    req.flush(MODELES);
    await settle();
    expect(TestBed.inject(ToastService).current()?.text).toBe('Signature enregistrée avec succès');
  });

  it('sans droit m : « Visualiser » ouvre la fenêtre en consultation', async () => {
    await open(withRight(defaultDroits('ADMIN'), 'TPL', { peutModifier: false }));
    expect(text(buttons()[0])).toBe('Visualiser');
    buttons()[0].click();
    await settle();
    expect(root.querySelector<HTMLInputElement>('input[formcontrolname="objet"]')!.disabled).toBe(true);
    expect(root.querySelector('button[form="modele-form"]')).toBeNull();
    expect(root.querySelector('app-variable-chips')).toBeNull();
  });
});
