import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, TitleStrategy, provideRouter } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import en from '../../../assets/i18n/en.json';
import { provideTestTranslations } from '../../../testing/translations';
import { LanguageService } from '../language-service';
import { PageTitleStrategy } from './page-title-strategy';

@Component({ template: '' })
class Page {}

describe('PageTitleStrategy', () => {
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideTestTranslations(),
        provideRouter([
          { path: 'garages', component: Page, data: { titleKey: 'nav.garages' } },
          { path: 'connexion', component: Page, data: { titleKey: 'auth.connexion.titre' } },
          { path: 'sans-titre', component: Page },
        ]),
        { provide: TitleStrategy, useExisting: PageTitleStrategy },
      ],
    });
    router = TestBed.inject(Router);
    document.title = '';
  });

  it('affiche « Écran · Gestion de garages » selon la route', async () => {
    await router.navigateByUrl('/garages');
    expect(document.title).toBe('Garages · Gestion de garages');
    await router.navigateByUrl('/connexion');
    expect(document.title).toBe('Connexion · Gestion de garages');
  });

  it('se limite au nom de l\'application quand la route n\'a pas de titre', async () => {
    await router.navigateByUrl('/sans-titre');
    expect(document.title).toBe('Gestion de garages');
  });

  it('suit la langue choisie', async () => {
    TestBed.inject(TranslateService).setTranslation('en', en);
    await router.navigateByUrl('/garages');
    TestBed.inject(LanguageService).use('en');
    expect(document.title).toBe('Garages · Garage management');
  });
});
