import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { provideTestTranslations } from '../../../testing/translations';
import { LanguageService } from '../language-service';
import { CODE_INCONNU, CODE_RESEAU, toApiError } from './api-error';
import { ErrorMessageService } from './error-message-service';

describe('toApiError', () => {
  it('lit le corps d\'erreur de l\'API', () => {
    const error = toApiError(
      new HttpErrorResponse({
        status: 422,
        error: {
          code: 'VALIDATION',
          message: 'Des champs obligatoires sont manquants ou invalides.',
          fieldErrors: { login: 'Le login est obligatoire.', ignore: 12 },
          details: ['a', 3, 'b'],
        },
      }),
    );
    expect(error.status).toBe(422);
    expect(error.code).toBe('VALIDATION');
    expect(error.message).toBe('Des champs obligatoires sont manquants ou invalides.');
    expect(error.fieldErrors).toEqual({ login: 'Le login est obligatoire.' });
    expect(error.details).toEqual(['a', 'b']);
  });

  it('signale un serveur injoignable', () => {
    const error = toApiError(new HttpErrorResponse({ status: 0, error: new ProgressEvent('error') }));
    expect(error.code).toBe(CODE_RESEAU);
    expect(error.fieldErrors).toEqual({});
    expect(error.details).toEqual([]);
  });

  it('donne un code inconnu à une réponse sans corps exploitable', () => {
    expect(toApiError(new HttpErrorResponse({ status: 502, error: 'Bad Gateway' })).code).toBe(CODE_INCONNU);
    expect(toApiError(new Error('boom')).code).toBe(CODE_INCONNU);
  });
});

describe('ErrorMessageService', () => {
  const apiError = (code: string, message: string) => ({ status: 409, code, message, fieldErrors: {}, details: [] });

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideTestTranslations()] });
  });

  it('affiche le message du back tel quel en français', () => {
    const service = TestBed.inject(ErrorMessageService);
    expect(service.text(apiError('GAR_NUM_EXISTE', 'Ce numéro de garage existe déjà.'))).toBe(
      'Ce numéro de garage existe déjà.',
    );
  });

  it('retombe sur le texte générique sans message', () => {
    const service = TestBed.inject(ErrorMessageService);
    expect(service.text(apiError('INCONNU', ''))).toBe('Une erreur est survenue.');
  });

  it('traduit par code en anglais, sinon garde le message du back', () => {
    TestBed.inject(LanguageService).lang.set('en');
    TestBed.inject(TranslateService).setTranslation('fr', {
      erreur: { generique: 'Une erreur est survenue.', ACCES_REFUSE: 'No access.' },
    });
    const service = TestBed.inject(ErrorMessageService);
    expect(service.text(apiError('ACCES_REFUSE', 'Droits insuffisants pour cette action.'))).toBe('No access.');
    expect(service.text(apiError('GAR_NUM_EXISTE', 'Ce numéro de garage existe déjà.'))).toBe(
      'Ce numéro de garage existe déjà.',
    );
  });
});
