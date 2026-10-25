import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Tooltip } from './tooltip';

@Component({
  imports: [Tooltip],
  template: `
    <button id="icone" appTooltip="Modifier"><i aria-hidden="true"></i></button>
    <button id="texte" appTooltip="Aide">Nouveau</button>
    <button id="nombre" appTooltip="Remarques (2)"><i aria-hidden="true"></i><b aria-hidden="true">2</b></button>
    <button id="vide" [appTooltip]="null"><i aria-hidden="true"></i></button>
  `,
})
class Host {}

describe('Tooltip', () => {
  const element = (id: string): HTMLElement => document.getElementById(id)!;

  beforeEach(() => {
    const fixture = TestBed.createComponent(Host);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
  });

  afterEach(() => {
    document.querySelectorAll('[role=tooltip]').forEach((bubble) => bubble.remove());
  });

  it('donne son texte comme nom accessible à un bouton qui n\'a que des icônes', () => {
    expect(element('icone').getAttribute('aria-label')).toBe('Modifier');
  });

  it('ne remplace pas le texte visible du bouton', () => {
    expect(element('texte').getAttribute('aria-label')).toBeNull();
  });

  it('garde le nom complet quand le seul texte est un nombre masqué aux lecteurs d\'écran', () => {
    expect(element('nombre').getAttribute('aria-label')).toBe('Remarques (2)');
  });

  it('ne pose pas de nom quand il n\'y a pas de texte', () => {
    expect(element('vide').getAttribute('aria-label')).toBeNull();
  });

  it('affiche la bulle au survol et au focus, puis la masque', () => {
    element('icone').dispatchEvent(new Event('mouseenter'));
    const bubble = document.querySelector<HTMLElement>('[role=tooltip]')!;
    expect(bubble.textContent).toBe('Modifier');
    expect(bubble.style.display).toBe('block');

    element('icone').dispatchEvent(new Event('mouseleave'));
    expect(bubble.style.display).toBe('none');

    element('nombre').dispatchEvent(new Event('focus'));
    expect(bubble.textContent).toBe('Remarques (2)');
    expect(bubble.style.display).toBe('block');
  });

  it('n\'affiche rien sans texte', () => {
    element('vide').dispatchEvent(new Event('mouseenter'));
    expect(document.querySelector('[role=tooltip]')).toBeNull();
  });
});
