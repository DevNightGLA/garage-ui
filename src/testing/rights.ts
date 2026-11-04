import { TestBed } from '@angular/core/testing';
import { AuthService } from '../app/core/auth/auth-service';
import { Role, Utilisateur } from '../app/core/auth/auth.models';
import { RightsService } from '../app/core/rights/rights-service';
import { DroitAppareil, DroitProfil, DroitsMoi, Ecran } from '../app/core/rights/rights.models';

/** Écrans et actions proposées, d'après `docs/maquette/droits.js` (données de départ de DROIT_PROFIL). */
const ECRANS: readonly { ecran: Ecran; section: string; a?: true; m?: true; d?: true }[] = [
  { ecran: 'DASH', section: 'Pilotage' },
  { ecran: 'STA', section: 'Pilotage' },
  { ecran: 'GAR', section: 'Garages', a: true, m: true, d: true },
  { ecran: 'LOY', section: 'Garages', a: true, m: true, d: true },
  { ecran: 'HLOC', section: 'Garages' },
  { ecran: 'TEN', section: 'Locataires', a: true, m: true, d: true },
  { ecran: 'CHR', section: 'Locataires' },
  { ecran: 'LOC', section: 'Locations et paiements', a: true, m: true, d: true },
  { ecran: 'PAI', section: 'Locations et paiements', a: true, d: true },
  { ecran: 'REM', section: 'Remarques', a: true, m: true, d: true },
  { ecran: 'AVI', section: 'Envoi de messages', a: true },
  { ecran: 'REL', section: 'Envoi de messages', a: true },
  { ecran: 'LIB', section: 'Envoi de messages', a: true },
  { ecran: 'PAR', section: 'Configuration', m: true },
  { ecran: 'TPL', section: 'Configuration', m: true },
  { ecran: 'USR', section: 'Configuration', a: true, m: true, d: true },
  { ecran: 'DRO', section: 'Configuration', m: true },
  { ecran: 'AUD', section: 'Configuration' },
  { ecran: 'MNT', section: 'Configuration' },
];

const LOCATAIRE: readonly Ecran[] = ['GAR', 'LOY', 'HLOC', 'LOC', 'PAI'];

/** Droits par défaut d'un profil (RG-DRO-02 à 05, décision du 03/11/2026 : le Gestionnaire supprime). */
export function defaultDroits(profil: Role): DroitsMoi {
  const ecrans: DroitProfil[] = ECRANS.map(({ ecran, section, a, m, d }) => {
    const configuration = section === 'Configuration';
    const voir =
      profil === 'ADMIN' ||
      (profil === 'GESTIONNAIRE' && !configuration) ||
      (profil === 'CONSULTANT' && !configuration) ||
      (profil === 'LOCATAIRE' && LOCATAIRE.includes(ecran));
    const agir = profil === 'ADMIN' || (profil === 'GESTIONNAIRE' && !configuration);
    return {
      profil,
      ecran,
      section,
      libelle: ecran,
      ajoutPropose: !!a,
      modificationProposee: !!m,
      suppressionProposee: !!d,
      peutVoir: voir,
      peutAjouter: voir && agir && !!a,
      peutModifier: voir && agir && !!m,
      peutSupprimer: voir && agir && !!d,
    };
  });
  const appareils: DroitAppareil[] = ECRANS.flatMap(({ ecran, section }) => [
    { appareil: 'TABLETTE' as const, ecran, autorise: true },
    { appareil: 'SMARTPHONE' as const, ecran, autorise: section !== 'Configuration' || ecran === 'DRO' },
  ]);
  return { profil, ecrans, appareils };
}

export function testUser(role: Role, overrides: Partial<Utilisateur> = {}): Utilisateur {
  return { id: 1, login: 'marie', prenom: 'Marie', nom: 'Dupont', email: 'marie@example.com', role, actif: true, ...overrides };
}

/** Connecte un utilisateur du profil donné avec les droits par défaut de ce profil (à appeler après `configureTestingModule`). */
export function signInAs(role: Role, overrides: Partial<Utilisateur> = {}, droits: DroitsMoi = defaultDroits(role)): Utilisateur {
  const user = testUser(role, overrides);
  TestBed.inject(AuthService).user.set(user);
  TestBed.inject(RightsService).use(droits);
  return user;
}

/** Droits d'un profil avec un écran réglé autrement par l'Admin (`{ peutSupprimer: false }`…). */
export function withRight(droits: DroitsMoi, ecran: Ecran, patch: Partial<DroitProfil>): DroitsMoi {
  return { ...droits, ecrans: droits.ecrans.map((ligne) => (ligne.ecran === ecran ? { ...ligne, ...patch } : ligne)) };
}

/** Retire un droit au profil connecté, comme l'Admin dans « Droits d'accès » (RG-DRO-14). */
export function revokeRight(ecran: Ecran, patch: Partial<DroitProfil>): void {
  const rights = TestBed.inject(RightsService);
  const profil = rights.profil() ?? 'ADMIN';
  rights.use(withRight(defaultDroits(profil), ecran, patch));
}
