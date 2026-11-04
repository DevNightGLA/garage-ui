import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { defaultDroits, signInAs, withRight } from '../../../../testing/rights';
import { provideTestTranslations } from '../../../../testing/translations';
import { ToastService } from '../../../shared/toast/toast';
import { ParametreDTO } from '../parametres.models';
import { ParametresPage } from './parametres-page';

function param(overrides: Partial<ParametreDTO>): ParametreDTO {
  return {
    nature: 'APPLICATION',
    categorie: 'securite',
    cle: 'mdp_min',
    libelle: 'Longueur minimale du mot de passe',
    type: 'ENTIER',
    valeur: '8',
    obligatoire: true,
    ordre: 1,
    min: 6,
    max: 32,
    choix: null,
    dateModification: '2026-11-04T08:00:00',
    ...overrides,
  };
}

const ALL: ParametreDTO[] = [
  param({ categorie: 'affichage', cle: 'langue_defaut', type: 'LISTE', valeur: 'fr', choix: ['fr', 'en'], ordre: 4, min: null, max: null }),
  param({ categorie: 'expediteur', cle: 'expediteur_email', type: 'EMAIL', valeur: 'g@x.be', ordre: 2, min: null, max: null }),
  param({ categorie: 'expediteur', cle: 'expediteur_nom', type: 'TEXTE', valeur: 'Sophie', ordre: 1, min: null, max: null }),
  param({ nature: 'METIER', categorie: 'organisation', cle: 'org_nom', type: 'TEXTE', valeur: null, obligatoire: false, min: null, max: null }),
  param({ nature: 'METIER', categorie: 'paiements_impayes', cle: 'jour_limite', valeur: '31', min: 1, max: 31 }),
  param({ cle: 'inactivite_min', valeur: '0', ordre: 1, min: 0, max: 240 }),
  param({ cle: 'mdp_min', ordre: 2 }),
  param({ cle: 'maintenance_verif_sec', valeur: '15', ordre: 3, min: 5, max: 300 }),
];

describe('ParametresPage', () => {
  let fixture: ComponentFixture<ParametresPage>;
  let http: HttpTestingController;
  let root: HTMLElement;

  const text = (el: Element) => el.textContent!.replace(/\s+/g, ' ').trim();
  const settle = async () => {
    for (let i = 0; i < 3; i++) {
      await new Promise((resolve) => setTimeout(resolve));
      fixture.detectChanges();
    }
  };
  const pills = () => Array.from(root.querySelectorAll<HTMLButtonElement>('.sg__btn'));
  const pill = (label: string) => pills().find((b) => text(b) === label)!;
  const labels = () => Array.from(root.querySelectorAll('.ff__label')).map(text);
  const field = (cle: string) => root.querySelector<HTMLInputElement>(`[name="${cle}"]`)!;

  const open = async (droits = defaultDroits('ADMIN')) => {
    TestBed.configureTestingModule({
      imports: [ParametresPage],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideTestTranslations()],
    });
    signInAs('ADMIN', {}, droits);
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ParametresPage);
    root = fixture.nativeElement;
    await settle();
    http.expectOne('/api/parametres').flush(ALL);
    await settle();
  };

  afterEach(() => http.verify());

  it('onglets métier / application et catégories dans l\'ordre de la maquette', async () => {
    await open();
    expect(pills().map(text)).toEqual([
      'Paramètres métier',
      'Paramètres de l’application',
      'Organisation',
      'Paiements et impayés',
    ]);
    expect(labels()).toEqual(['Nom de l’entreprise ou du bailleur']);
    pill('Paramètres de l’application').click();
    await settle();
    expect(pills().slice(2).map(text)).toEqual(['Expéditeur', 'Affichage', 'Sécurité']);
    // Champs dans l'ordre, obligatoires marqués, avec l'aide.
    expect(labels()).toEqual(['Nom de l’expéditeur *', 'Adresse e-mail d’envoi *']);
    expect(text(root.querySelector('.ff__hint')!)).toContain('{expediteur}');
  });

  it('liste de choix traduite et champ entier borné', async () => {
    await open();
    pill('Paramètres de l’application').click();
    await settle();
    pill('Affichage').click();
    await settle();
    expect(Array.from(root.querySelectorAll('select option')).map(text)).toEqual(['Français', 'English']);
    pill('Sécurité').click();
    await settle();
    expect(field('maintenance_verif_sec').value).toBe('15');
    expect(field('maintenance_verif_sec').getAttribute('min')).toBe('5');
    expect(field('maintenance_verif_sec').getAttribute('max')).toBe('300');
  });

  it('enregistre la catégorie, affiche le message, recharge le contexte', async () => {
    await open();
    pill('Paramètres de l’application').click();
    await settle();
    pill('Sécurité').click();
    await settle();
    field('mdp_min').value = '10';
    field('mdp_min').dispatchEvent(new Event('input'));
    root.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    const req = http.expectOne('/api/parametres/securite');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({
      parametres: [
        { cle: 'inactivite_min', valeur: '0' },
        { cle: 'mdp_min', valeur: '10' },
        { cle: 'maintenance_verif_sec', valeur: '15' },
      ],
    });
    req.flush(ALL.filter((p) => p.categorie === 'securite').map((p) => (p.cle === 'mdp_min' ? { ...p, valeur: '10' } : p)));
    await settle();
    http.expectOne('/api/contexte').flush({});
    expect(TestBed.inject(ToastService).current()?.text).toBe('Paramètres enregistrés avec succès');
    expect(field('mdp_min').value).toBe('10');
  });

  it('champ obligatoire vide : surligné, rien n\'est envoyé ; erreurs du back sous les champs', async () => {
    await open();
    pill('Paramètres de l’application').click();
    await settle();
    field('expediteur_nom').value = '';
    field('expediteur_nom').dispatchEvent(new Event('input'));
    root.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    await settle();
    expect(root.querySelectorAll('app-form-field.is-invalid').length).toBe(1);

    field('expediteur_nom').value = 'Sophie';
    field('expediteur_nom').dispatchEvent(new Event('input'));
    root.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    http.expectOne('/api/parametres/expediteur').flush(
      { code: 'VALIDATION', message: 'Invalide', fieldErrors: { expediteur_email: 'Format d’e-mail invalide : Adresse e-mail d’envoi.' } },
      { status: 422, statusText: 'Unprocessable Entity' },
    );
    await settle();
    expect(text(root.querySelector('.ff__error')!)).toBe('Format d’e-mail invalide : Adresse e-mail d’envoi.');
  });

  it('sans droit m : champs désactivés, pas de bouton Enregistrer', async () => {
    await open(withRight(defaultDroits('ADMIN'), 'PAR', { peutModifier: false }));
    expect(field('org_nom').disabled).toBe(true);
    expect(root.querySelector('button[type="submit"]')).toBeNull();
  });
});
