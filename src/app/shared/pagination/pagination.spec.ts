import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTestTranslations } from '../../../testing/translations';
import { Pagination, pageItems } from './pagination';

describe('pageItems', () => {
  it('affiche toutes les pages jusqu\'à sept', () => {
    expect(pageItems(0, 1)).toEqual([0]);
    expect(pageItems(2, 7)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('coupe avec des « … » autour de la page courante au-delà de sept', () => {
    expect(pageItems(0, 12)).toEqual([0, 1, null, 11]);
    expect(pageItems(5, 12)).toEqual([0, null, 4, 5, 6, null, 11]);
    expect(pageItems(11, 12)).toEqual([0, null, 10, 11]);
  });
});

describe('Pagination', () => {
  let fixture: ComponentFixture<Pagination>;
  const root = () => fixture.nativeElement as HTMLElement;
  const buttons = () => Array.from(root().querySelectorAll<HTMLButtonElement>('.pg__btn'));

  const setup = async (page: number, total: number, size = 10) => {
    fixture.componentRef.setInput('page', page);
    fixture.componentRef.setInput('size', size);
    fixture.componentRef.setInput('total', total);
    fixture.componentRef.setInput('noun', 'loyers');
    await fixture.whenStable();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Pagination], providers: [provideTestTranslations()] }).compileComponents();
    fixture = TestBed.createComponent(Pagination);
  });

  it('affiche « x–y sur n » et la page courante', async () => {
    await setup(2, 25);
    expect(root().querySelector('.pg__count')!.textContent).toBe('21–25 sur 25 loyers');
    expect(root().querySelector('.is-active')!.textContent!.trim()).toBe('3');
  });

  it('affiche 0–0 sur 0 quand la liste est vide', async () => {
    await setup(0, 0);
    expect(root().querySelector('.pg__count')!.textContent).toBe('0–0 sur 0 loyers');
  });

  it('ramène à la dernière page une page hors limite', async () => {
    await setup(9, 25);
    expect(root().querySelector('.pg__count')!.textContent).toBe('21–25 sur 25 loyers');
  });

  it('désactive précédent sur la première page et suivant sur la dernière', async () => {
    await setup(0, 25);
    expect(buttons()[0].disabled).toBe(true);
    expect(buttons().at(-1)!.disabled).toBe(false);

    await setup(2, 25);
    expect(buttons()[0].disabled).toBe(false);
    expect(buttons().at(-1)!.disabled).toBe(true);
  });

  it('émet le numéro de la page demandée, sans émettre pour la page courante', async () => {
    await setup(0, 25);
    const emitted: number[] = [];
    fixture.componentInstance.pageChange.subscribe((p) => emitted.push(p));
    const numbered = buttons().filter((b) => b.classList.contains('pg__btn--num'));
    numbered[0].click();
    numbered[2].click();
    buttons().at(-1)!.click();
    expect(emitted).toEqual([2, 1]);
  });
});
