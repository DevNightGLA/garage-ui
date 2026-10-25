import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import en from '../../../assets/i18n/en.json';
import { provideTestTranslations } from '../../../testing/translations';
import { LanguageService } from '../language-service';
import { ApiError } from './api-error';
import { ErrorMessageService } from './error-message-service';
import { FIXED_MESSAGES, PARAMETERIZED_MESSAGES } from './message-patterns';

const error = (over: Partial<ApiError> = {}): ApiError => ({
  status: 409,
  code: 'ERREUR_INCONNUE',
  message: '',
  fieldErrors: {},
  details: [],
  ...over,
});

describe('ErrorMessageService', () => {
  let service: ErrorMessageService;
  let language: LanguageService;

  const useEnglish = () => {
    TestBed.inject(TranslateService).setTranslation('en', en);
    language.use('en');
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideTestTranslations()] });
    service = TestBed.inject(ErrorMessageService);
    language = TestBed.inject(LanguageService);
  });

  describe('en français', () => {
    it('affiche le message du back tel quel, ses erreurs de champ et ses motifs', () => {
      const apiError = error({
        code: 'LOC_CLES_MAX',
        message: 'Maximum 2 clés remises (hors réserve).',
        fieldErrors: { nom: 'Le nom est obligatoire.' },
        details: ['Le garage est actuellement loué (Marie Dupont).'],
      });
      expect(service.text(apiError)).toBe('Maximum 2 clés remises (hors réserve).');
      expect(service.fields(apiError)).toEqual({ nom: 'Le nom est obligatoire.' });
      expect(service.details(apiError)).toEqual(['Le garage est actuellement loué (Marie Dupont).']);
    });
  });

  describe('en anglais', () => {
    beforeEach(useEnglish);

    it('traduit par code d\'erreur quand le message n\'a pas de paramètre', () => {
      expect(service.text(error({ code: 'GAR_NUM_EXISTE', message: 'Ce numéro de garage existe déjà.' }))).toBe(
        'This garage number already exists.',
      );
      expect(service.text(error({ code: 'ERREUR_INTERNE', message: 'Une erreur interne est survenue.' }))).toBe(
        'An internal error occurred.',
      );
    });

    it('traduit par texte les messages à paramètres, en gardant les nombres, noms et dates', () => {
      const cases: [string, string, string][] = [
        ['GAR_CLES_LOCATION', 'La location active a 2 clé(s) remise(s) : clés moins réserve doit rester supérieur ou égal.', 'The active lease has 2 key(s) issued: keys minus reserve must remain greater than or equal.'],
        ['GAR_MAX_ATTEINT', 'Le nombre maximum de 20 garages est atteint.', 'The maximum number of 20 garages has been reached.'],
        ['LOY_DEBUT_ANTERIEUR', 'La date de début doit être postérieure au début du loyer précédent (01/01/2026) : pas de chevauchement.', 'The start date must be after the start of the previous rent (01/01/2026): no overlap.'],
        ['LOC_CLES_MAX', 'Maximum 3 clés remises (hors réserve).', 'Maximum 3 keys issued (excluding reserve).'],
        ['LOC_CHEVAUCHEMENT', 'Cette location chevauche une autre location du garage (du 01/01/2025 au 31/12/2025).', 'This lease overlaps another lease of the garage (from 01/01/2025 to 31/12/2025).'],
        ['LOC_CHEVAUCHEMENT', 'Cette location chevauche une autre location du garage (à partir du 01/11/2026).', 'This lease overlaps another lease of the garage (from 01/11/2026 onwards).'],
        ['LOC_SUPPRESSION_REFUSEE', '2 paiement(s) ont déjà été effectué(s) pour cette location.', '2 payment(s) already made for this lease.'],
        ['PAI_MONTANT_PARTIEL', 'Le montant doit être inférieur au reste dû (1 500,25 €). Utilisez « Payer en totalité ».', 'The amount must be less than the remaining due (1 500,25 €). Use “Pay in full”.'],
        ['REM_RESOLUTION_AVANT_CREATION', 'La date de résolution ne peut pas précéder la création de la remarque (20/09/2026).', 'The resolution date cannot precede the creation of the remark (20/09/2026).'],
        ['REQUETE_INVALIDE', 'Tri impossible sur « nom ».', 'Cannot sort on “nom”.'],
        ['REQUETE_INVALIDE', 'Valeur invalide pour « type ».', 'Invalid value for “type”.'],
      ];
      for (const [code, message, expected] of cases) {
        expect(service.text(error({ code: `${code}_SANS_CLE`, message }))).toBe(expected);
      }
    });

    it('traduit le nom du mois français des messages de paiement anticipé', () => {
      const advance = (month: string) =>
        service.message(`Modification et suppression impossibles : un paiement anticipé est déjà enregistré pour ${month}. Annulez d'abord ce paiement dans l'écran Paiements.`);
      expect(advance('novembre 2026')).toBe(
        'Editing and deletion not possible: an advance payment is already recorded for November 2026. Cancel this payment first in the Payments screen.',
      );
      expect(advance('août 2026')).toContain('August 2026');
      expect(service.message('La date de fin ne peut pas précéder septembre 2026 : un paiement est déjà enregistré pour ce mois. Annulez d\'abord ce paiement dans l\'écran Paiements.')).toBe(
        'The end date cannot precede September 2026: a payment is already recorded for this month. Cancel this payment first in the Payments screen.',
      );
      expect(service.message('La date de début ne peut pas suivre juin 2026 : un paiement est déjà enregistré pour ce mois. Annulez d\'abord ce paiement dans l\'écran Paiements.')).toContain('June 2026');
    });

    it('traduit les erreurs de champ du back', () => {
      expect(
        service.fields(
          error({
            status: 422,
            code: 'VALIDATION',
            fieldErrors: {
              nom: 'Le nom est obligatoire.',
              tel1: 'Le téléphone 1 est obligatoire.',
              email: "Format d'e-mail invalide.",
              montant: 'Le montant doit être supérieur à 0.',
            },
          }),
        ),
      ).toEqual({
        nom: 'The last name is required.',
        tel1: 'Phone 1 is required.',
        email: 'Invalid e-mail format.',
        montant: 'The amount must be greater than 0.',
      });
    });

    it('traduit les motifs d\'un refus de suppression', () => {
      expect(
        service.details(
          error({
            code: 'LOCT_SUPPRESSION_REFUSEE',
            details: [
              'Le locataire a été assigné à un garage (2 location(s) : G2, G10).',
              'Des paiements ont été effectués pour ce locataire (6 versement(s)).',
              'Le garage est actuellement loué (Marie Dupont).',
              'Le garage a un historique de 3 location(s).',
            ],
          }),
        ),
      ).toEqual([
        'The tenant has been assigned to a garage (2 lease(s): G2, G10).',
        'Payments have been made for this tenant (6 payment(s)).',
        'The garage is currently rented (Marie Dupont).',
        'The garage has a history of 3 lease(s).',
      ]);
    });

    it('traduit les deux variantes du refus de résolution d\'une remarque', () => {
      expect(service.message('Seul un problème peut être marqué comme résolu.')).toBe('Only an issue can be marked as resolved.');
      expect(service.message('Seul un problème peut être rouvert.')).toBe('Only an issue can be reopened.');
    });

    it('garde le message du back quand il est inconnu, et le message générique quand il manque', () => {
      expect(service.message('Un message que le front ne connaît pas.')).toBe('Un message que le front ne connaît pas.');
      expect(service.text(error({ code: 'INCONNU_DU_FRONT', message: 'Message inédit.' }))).toBe('Message inédit.');
      expect(service.text(error({ code: 'INCONNU_DU_FRONT', message: '' }))).toBe('An error occurred.');
    });

    it('traduit aussi les erreurs réseau et inconnues', () => {
      expect(service.text(error({ status: 0, code: 'RESEAU' }))).toBe('Unable to reach the server.');
    });
  });

  describe('table de traduction', () => {
    const templates = (en as unknown as { messagesBack: Record<string, string> }).messagesBack;

    it('chaque message du back a un modèle anglais', () => {
      const keys = [...Object.values(FIXED_MESSAGES), ...PARAMETERIZED_MESSAGES.map((entry) => entry.key)];
      expect(keys.length).toBeGreaterThan(60);
      for (const key of keys) {
        expect(templates[key], key).toBeTruthy();
      }
    });

    it('chaque modèle anglais est utilisé, et ses paramètres sont ceux des groupes nommés du motif', () => {
      const used = new Set([...Object.values(FIXED_MESSAGES), ...PARAMETERIZED_MESSAGES.map((entry) => entry.key)]);
      expect(Object.keys(templates).filter((key) => !used.has(key))).toEqual([]);
      for (const { pattern, key } of PARAMETERIZED_MESSAGES) {
        const groups = [...pattern.source.matchAll(/\(\?<(\w+)>/g)].map((match) => match[1]).sort();
        const params = [...templates[key].matchAll(/\{\{(\w+)\}\}/g)].map((match) => match[1]).sort();
        expect(params, key).toEqual([...new Set(groups)]);
      }
    });

    it('un message fixe n\'a pas de paramètre', () => {
      for (const key of Object.values(FIXED_MESSAGES)) {
        expect(templates[key], key).not.toContain('{{');
      }
    });
  });
});
