import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PreconsultationPageComponent } from './preconsultation-page.component';

describe('PreconsultationPageComponent', () => {
  let fixture: ComponentFixture<PreconsultationPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PreconsultationPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PreconsultationPageComponent);
    fixture.detectChanges();
  });

  it('shows the initial empty preconsultation state', () => {
    const element: HTMLElement = fixture.nativeElement;

    expect(
      element.querySelector('[data-testid="preconsultation-empty"]'),
    ).toBeTruthy();

    expect(element.textContent).toContain('Inicia tu preconsulta');

    const startButton = element.querySelector<HTMLButtonElement>(
      '[data-testid="start-preconsultation"]',
    );

    expect(startButton).toBeTruthy();
    expect(startButton?.disabled).toBe(false);
  });
});