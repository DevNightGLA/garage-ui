import { TestBed } from '@angular/core/testing';
import { signInAs } from '../../testing/rights';
import { NavigationMemory } from './navigation-memory';

describe('NavigationMemory', () => {
  let memory: NavigationMemory;

  beforeEach(() => {
    localStorage.clear();
    memory = TestBed.inject(NavigationMemory);
    signInAs('ADMIN');
  });

  it('propose le premier écran autorisé tant qu\'aucune page n\'est mémorisée', () => {
    expect(memory.lastPath()).toBe('tableau-de-bord');
    signInAs('LOCATAIRE');
    expect(memory.lastPath()).toBe('garages');
  });

  it('mémorise la dernière page visitée, y compris une sous-page', () => {
    memory.remember('/locataires');
    expect(memory.lastPath()).toBe('locataires');
    memory.remember('/paiements?mois=2026-10#haut');
    expect(memory.lastPath()).toBe('paiements');
    memory.remember('/statistiques/repartition');
    expect(memory.lastPath()).toBe('statistiques/repartition');
  });

  it('ignore les adresses qui ne sont pas un écran du menu', () => {
    memory.remember('/garages');
    memory.remember('/connexion');
    memory.remember('/');
    memory.remember('/statistiques');
    expect(memory.lastPath()).toBe('garages');
  });

  it('ignore une valeur mémorisée devenue inconnue ou interdite au profil', () => {
    localStorage.setItem('gg-page', 'supprimee');
    expect(memory.lastPath()).toBe('tableau-de-bord');
    localStorage.setItem('gg-page', 'utilisateurs');
    signInAs('GESTIONNAIRE');
    expect(memory.lastPath()).toBe('tableau-de-bord');
  });

  it('sans aucun écran autorisé, propose la page « Accès refusé »', () => {
    signInAs('CONSULTANT', {}, { profil: 'CONSULTANT', ecrans: [], appareils: [] });
    expect(memory.lastPath()).toBe('acces-refuse');
  });
});
