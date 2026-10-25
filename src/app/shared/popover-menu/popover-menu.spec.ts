import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PopoverMenu, PopoverMenuItem } from './popover-menu';

@Component({
  imports: [PopoverMenu],
  template: `
    @if (open()) {
      <app-popover-menu [items]="items" label="Historique" [x]="x()" [y]="120" (closed)="open.set(false)" />
    }
  `,
})
class Host {
  open = signal(true);
  x = signal(400);
  chosen: string[] = [];
  items: PopoverMenuItem[] = [
    { icon: 'fa-solid fa-euro-sign', label: 'Historique des loyers', action: () => this.chosen.push('loyers') },
    { icon: 'fa-solid fa-file-signature', label: 'Historique des locations', count: 3, action: () => this.chosen.push('locations') },
  ];
}

describe('PopoverMenu', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  let root: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    root = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('affiche les entrées avec leur pastille de compteur et se place sous le bouton', () => {
    expect(Array.from(root.querySelectorAll('.pm__label')).map((l) => l.textContent)).toEqual([
      'Historique des loyers',
      'Historique des locations',
    ]);
    expect(root.querySelectorAll('.pm__count')).toHaveLength(1);
    expect(root.querySelector('.pm__count')!.textContent).toBe('3');
    const menu = root.querySelector<HTMLElement>('.pm')!;
    expect(menu.getAttribute('role')).toBe('menu');
    expect(menu.getAttribute('aria-label')).toBe('Historique');
    expect(menu.style.left).toBe('400px');
    expect(menu.style.top).toBe('120px');
  });

  it('exécute l\'action choisie et se ferme', async () => {
    root.querySelectorAll<HTMLButtonElement>('.pm__item')[1].click();
    await fixture.whenStable();
    expect(host.chosen).toEqual(['locations']);
    expect(root.querySelector('app-popover-menu')).toBeNull();
  });

  it('se ferme sans action sur un clic ailleurs ou Échap', async () => {
    root.querySelector<HTMLElement>('.pm-backdrop')!.click();
    await fixture.whenStable();
    expect(root.querySelector('app-popover-menu')).toBeNull();

    host.open.set(true);
    await fixture.whenStable();
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await fixture.whenStable();
    expect(root.querySelector('app-popover-menu')).toBeNull();
    expect(host.chosen).toEqual([]);
  });

  it('reste dans la fenêtre quand le bouton est près du bord droit', async () => {
    host.x.set(window.innerWidth + 500);
    await fixture.whenStable();
    expect(parseFloat(root.querySelector<HTMLElement>('.pm')!.style.left)).toBe(window.innerWidth - 230 - 8);
  });
});
