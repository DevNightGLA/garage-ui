import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth/auth-service';
import { Role, Utilisateur } from './auth/auth.models';
import { RoleService } from './role-service';

const user = (role: Role): Utilisateur => ({ id: 1, login: 'u', email: 'u@example.com', role, actif: true });

describe('RoleService', () => {
  let auth: AuthService;
  let roles: RoleService;

  beforeEach(() => {
    sessionStorage.clear();
    auth = TestBed.inject(AuthService);
    roles = TestBed.inject(RoleService);
  });

  it('n\'accorde aucun droit sans utilisateur connecté', () => {
    expect(roles.role()).toBeNull();
    expect(roles.canWrite()).toBe(false);
    expect(roles.canDelete()).toBe(false);
    expect(roles.isReadOnly()).toBe(false);
  });

  it.each([
    ['ADMIN', { isAdmin: true, canWrite: true, canDelete: true, isReadOnly: false }],
    ['GESTIONNAIRE', { isAdmin: false, canWrite: true, canDelete: false, isReadOnly: false }],
    ['LECTURE_SEULE', { isAdmin: false, canWrite: false, canDelete: false, isReadOnly: true }],
  ] as [Role, Record<string, boolean>][])('applique le tableau des droits au rôle %s', (role, expected) => {
    auth.user.set(user(role));
    expect(roles.role()).toBe(role);
    expect({
      isAdmin: roles.isAdmin(),
      canWrite: roles.canWrite(),
      canDelete: roles.canDelete(),
      isReadOnly: roles.isReadOnly(),
    }).toEqual(expected);
  });
});
