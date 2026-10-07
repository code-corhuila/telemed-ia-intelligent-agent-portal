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
  
  it('shows loading after starting the preconsultation', () => {
  const element: HTMLElement = fixture.nativeElement;

  const startButton = element.querySelector<HTMLButtonElement>(
    '[data-testid="start-preconsultation"]',
  );

  startButton?.click();
  fixture.detectChanges();

  expect(
    element.querySelector('[data-testid="preconsultation-loading"]'),
  ).toBeTruthy();

  expect(element.textContent).toContain(
    'Preparando tu preconsulta',
  );
});

it('shows the first synthetic agent message after starting the preconsultation', async () => {
  const element: HTMLElement = fixture.nativeElement;

  const startButton = element.querySelector<HTMLButtonElement>(
    '[data-testid="start-preconsultation"]',
  );

  startButton?.click();
  fixture.detectChanges();

  await new Promise((resolve) => setTimeout(resolve, 700));

  fixture.detectChanges();

  expect(
    element.querySelector('[data-testid="preconsultation-chat"]'),
  ).toBeTruthy();

  expect(element.textContent).toContain(
    'Hola, soy el asistente de preconsulta de TeleMed IA',
  );
});

});