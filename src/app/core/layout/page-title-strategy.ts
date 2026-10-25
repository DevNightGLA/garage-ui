import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { take } from 'rxjs';

/**
 * Titre de l'onglet : « Garages · Gestion de garages », dans la langue courante.
 * La clé de traduction est lue dans `data.titleKey` de la route la plus profonde.
 */
@Injectable({ providedIn: 'root' })
export class PageTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly translate = inject(TranslateService);
  private titleKey: string | null = null;

  constructor() {
    super();
    this.translate.onLangChange.subscribe(() => this.apply());
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    let route: ActivatedRouteSnapshot = snapshot.root;
    while (route.firstChild) {
      route = route.firstChild;
    }
    this.titleKey = (route.data['titleKey'] as string | undefined) ?? null;
    this.apply();
  }

  private apply(): void {
    const key = this.titleKey;
    this.translate
      .get(key ? [key, 'app.titre'] : ['app.titre'])
      .pipe(take(1))
      .subscribe((texts: Record<string, string>) => {
        const app = texts['app.titre'];
        this.title.setTitle(key ? `${texts[key]} · ${app}` : app);
      });
  }
}
