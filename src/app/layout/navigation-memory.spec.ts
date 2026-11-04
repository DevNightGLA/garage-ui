import { TestBed } from '@angular/core/testing';
import { NavigationMemory } from './navigation-memory';

describe('NavigationMemory', () => {
  let memory: NavigationMemory;

  beforeEach(() => {
    localStorage.clear();
    memory = TestBed.inject(NavigationMemory);
  });

  it('propose le tableau de bord tant qu\'aucune page n\'est mémorisée', () => {
    expect(memory.lastPath()).toBe('tableau-de-bord');
  });

  it('mémorise la dernière page visitée', () => {
    memory.remember('/locataires');
    expect(memory.lastPath()).toBe('locataires');
    memory.remember('/paiements?mois=2026-10#haut');
    expect(memory.lastPath()).toBe('paiements');
  });

  it('ignore les adresses qui ne sont pas un écran du menu', () => {
    memory.remember('/garages');
    memory.remember('/connexion');
    memory.remember('/');
    expect(memory.lastPath()).toBe('garages');
  });

  it('ignore une valeur mémorisée devenue inconnue', () => {
    localStorage.setItem('gg-page', 'supprimee');
    expect(memory.lastPath()).toBe('tableau-de-bord');
  });
});
