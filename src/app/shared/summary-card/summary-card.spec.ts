import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SummaryCard } from './summary-card';

describe('SummaryCard', () => {
  let fixture: ComponentFixture<SummaryCard>;
  let root: HTMLElement;

  const text = (element: Element | null) => (element?.textContent ?? '').replace(/\s+/g, ' ').trim();

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SummaryCard] }).compileComponents();
    fixture = TestBed.createComponent(SummaryCard);
    fixture.componentRef.setInput('avatar', 'G05');
    fixture.componentRef.setInput('kicker', 'Garage');
    fixture.componentRef.setInput('title', 'G05');
    fixture.componentRef.setInput('fields', [
      { label: 'Statut', value: 'Loué' },
      { label: 'Clés / réserve', value: '3 / 1' },
    ]);
    root = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('affiche la pastille, l\'intitulé et chaque champ avec son libellé', () => {
    expect(text(root.querySelector('.sc__avatar'))).toBe('G05');
    expect(text(root.querySelector('.sc__kicker'))).toBe('Garage');
    expect(text(root.querySelector('.sc__title'))).toBe('G05');
    expect(Array.from(root.querySelectorAll('.sc__field')).map((f) => text(f))).toEqual(['StatutLoué', 'Clés / réserve3 / 1']);
  });

  it('la pastille est ronde par défaut et carrée pour un garage', async () => {
    expect(root.querySelector('.sc__avatar')!.classList.contains('sc__avatar--square')).toBe(false);
    fixture.componentRef.setInput('shape', 'square');
    await fixture.whenStable();
    expect(root.querySelector('.sc__avatar')!.classList.contains('sc__avatar--square')).toBe(true);
  });
});
