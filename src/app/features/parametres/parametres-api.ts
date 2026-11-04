import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ParametreDTO, ParametreValeur } from './parametres.models';

@Injectable({ providedIn: 'root' })
export class ParametresApi {
  private readonly http = inject(HttpClient);

  /** Tous les paramètres hors modèles de messages, triés par catégorie et ordre (écran `PAR`). */
  list(): Observable<ParametreDTO[]> {
    return this.http.get<ParametreDTO[]>('/api/parametres');
  }

  /** Enregistre les valeurs d'une catégorie ; renvoie la catégorie à jour. */
  saveCategory(categorie: string, parametres: ParametreValeur[]): Observable<ParametreDTO[]> {
    return this.http.put<ParametreDTO[]>(`/api/parametres/${encodeURIComponent(categorie)}`, { parametres });
  }

  /** Objets et textes des trois modèles, et la signature (écran `TPL`). */
  modeles(): Observable<ParametreDTO[]> {
    return this.http.get<ParametreDTO[]>('/api/modeles-messages');
  }

  saveModeles(parametres: ParametreValeur[]): Observable<ParametreDTO[]> {
    return this.http.put<ParametreDTO[]>('/api/modeles-messages', { parametres });
  }
}
