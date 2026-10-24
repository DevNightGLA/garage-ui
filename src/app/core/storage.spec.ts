import { TestBed } from '@angular/core/testing';
import { STORAGE_KEYS, SafeStorage, StorageService } from './storage';

describe('StorageService', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('lit, écrit et supprime dans localStorage et sessionStorage', () => {
    const storage = TestBed.inject(StorageService);
    storage.local.set(STORAGE_KEYS.langue, 'en');
    storage.session.set(STORAGE_KEYS.jeton, 'abc');
    expect(localStorage.getItem('gg-lang')).toBe('en');
    expect(sessionStorage.getItem('gg-token')).toBe('abc');
    expect(storage.local.get(STORAGE_KEYS.langue)).toBe('en');

    storage.local.remove(STORAGE_KEYS.langue);
    expect(storage.local.get(STORAGE_KEYS.langue)).toBeNull();
  });

  it('ne lève jamais d\'exception quand le stockage est indisponible', () => {
    const broken = new SafeStorage(() => {
      throw new Error('stockage bloqué');
    });
    expect(broken.get('x')).toBeNull();
    expect(() => broken.set('x', 'y')).not.toThrow();
    expect(() => broken.remove('x')).not.toThrow();
  });
});
