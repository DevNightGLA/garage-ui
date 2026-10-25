import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RemarquesButton } from './remarques-button';

describe('RemarquesButton', () => {
  let fixture: ComponentFixture<RemarquesButton>;

  const render = (count: number, label: string) => {
    fixture = TestBed.createComponent(RemarquesButton);
    fixture.componentRef.setInput('count', count);
    fixture.componentRef.setInput('label', label);
    fixture.detectChanges();
    return fixture.nativeElement.querySelector('button') as HTMLButtonElement;
  };

  it('affiche le nombre et garde « Remarques (n) » comme nom accessible', () => {
    const button = render(2, 'Remarques (2)');
    expect(button.querySelector('.remarques__n')?.textContent).toBe('2');
    expect(button.querySelector('.remarques__n')?.getAttribute('aria-hidden')).toBe('true');
    expect(button.getAttribute('aria-label')).toBe('Remarques (2)');
  });

  it('n\'affiche pas de nombre pour zéro et garde son nom accessible', () => {
    const button = render(0, 'Remarques (0)');
    expect(button.querySelector('.remarques__n')).toBeNull();
    expect(button.getAttribute('aria-label')).toBe('Remarques (0)');
  });

  it('émet l\'ouverture sans propager le clic à la ligne du tableau', () => {
    const button = render(1, 'Remarques (1)');
    const opened = vi.fn();
    fixture.componentInstance.opened.subscribe(opened);
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    const stop = vi.spyOn(click, 'stopPropagation');
    button.dispatchEvent(click);
    expect(opened).toHaveBeenCalledOnce();
    expect(stop).toHaveBeenCalled();
  });
});
