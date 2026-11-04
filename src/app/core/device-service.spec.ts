import { TestBed } from '@angular/core/testing';
import { WIDTH, mockViewport } from '../../testing/match-media';
import { DeviceService } from './device-service';

describe('DeviceService', () => {
  afterEach(() => {
    delete (window as { matchMedia?: unknown }).matchMedia;
  });

  it.each([
    [WIDTH.smartphone, 'SMARTPHONE'],
    [640, 'SMARTPHONE'],
    [641, 'TABLETTE'],
    [1024, 'TABLETTE'],
    [1025, 'ORDINATEUR'],
  ] as const)('largeur %i px : %s (RG-APP-01)', (width, mode) => {
    mockViewport(width);
    expect(TestBed.inject(DeviceService).mode()).toBe(mode);
  });

  it('suit le redimensionnement de la fenêtre', () => {
    const viewport = mockViewport(WIDTH.ordinateur);
    const device = TestBed.inject(DeviceService);
    expect(device.isDesktop()).toBe(true);
    viewport.resize(WIDTH.tablette);
    expect(device.mode()).toBe('TABLETTE');
    viewport.resize(WIDTH.smartphone);
    expect(device.mode()).toBe('SMARTPHONE');
  });

  it('ordinateur quand le navigateur ne sait pas mesurer l\'écran', () => {
    expect(TestBed.inject(DeviceService).mode()).toBe('ORDINATEUR');
  });
});
