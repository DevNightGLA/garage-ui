import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { provideTestTranslations } from '../../testing/translations';
import { LanguageService } from './language-service';

describe('LanguageService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideTestTranslations()] });
  });

  it('démarre en français sans préférence mémorisée', () => {
    const service = TestBed.inject(LanguageService);
    service.init();
    expect(service.lang()).toBe('fr');
    expect(document.documentElement.lang).toBe('fr');
  });

  it('reprend la langue mémorisée', () => {
    localStorage.setItem('gg-lang', 'en');
    const service = TestBed.inject(LanguageService);
    service.init();
    expect(service.lang()).toBe('en');
    expect(TestBed.inject(TranslateService).getCurrentLang()).toBe('en');
    expect(document.documentElement.lang).toBe('en');
  });

  it('ignore une valeur mémorisée inconnue', () => {
    localStorage.setItem('gg-lang', 'de');
    const service = TestBed.inject(LanguageService);
    service.init();
    expect(service.lang()).toBe('fr');
  });

  it('mémorise le choix de l\'utilisateur', () => {
    const service = TestBed.inject(LanguageService);
    service.use('en');
    expect(service.lang()).toBe('en');
    expect(localStorage.getItem('gg-lang')).toBe('en');
    service.use('fr');
    expect(localStorage.getItem('gg-lang')).toBe('fr');
  });
});
