import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PreconsultationPageComponent } from './preconsultation-page.component';

describe('PreconsultationPageComponent', () => {
  let fixture: ComponentFixture<PreconsultationPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PreconsultationPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(
      PreconsultationPageComponent,
    );

    fixture.detectChanges();
  });

  it('shows the initial empty preconsultation state', () => {
    const element: HTMLElement = fixture.nativeElement;

    expect(
      element.querySelector(
        '[data-testid="preconsultation-empty"]',
      ),
    ).toBeTruthy();

    expect(element.textContent).toContain(
      'Inicia tu conversación con la IA',
    );

    expect(
      element.querySelector(
        '[data-testid="start-preconsultation"]',
      ),
    ).toBeFalsy();

    expect(
      element.querySelector(
        '[data-testid="consultation-reason-input"]',
      ),
    ).toBeTruthy();
  });

  it('shows loading after submitting the first message', () => {
    const element: HTMLElement = fixture.nativeElement;

    const input = element.querySelector<HTMLInputElement>(
      '[data-testid="consultation-reason-input"]',
    );

    const sendButton = element.querySelector<HTMLButtonElement>(
      '[data-testid="send-consultation-reason"]',
    );

    input!.value = 'Tengo dolor de cabeza desde ayer';
    input!.dispatchEvent(new Event('input'));

    fixture.detectChanges();

    sendButton!.click();
    fixture.detectChanges();

    expect(
      element.querySelector(
        '[data-testid="preconsultation-loading"]',
      ),
    ).toBeTruthy();
  });

  it('asks about duration after receiving the consultation reason', async () => {
    const element: HTMLElement = fixture.nativeElement;

    const input = element.querySelector<HTMLInputElement>(
      '[data-testid="consultation-reason-input"]',
    );

    const sendButton = element.querySelector<HTMLButtonElement>(
      '[data-testid="send-consultation-reason"]',
    );

    input!.value = 'Tengo dolor de cabeza desde ayer';
    input!.dispatchEvent(new Event('input'));

    fixture.detectChanges();

    sendButton!.click();
    fixture.detectChanges();

    await new Promise((resolve) => setTimeout(resolve, 700));

    fixture.detectChanges();

    expect(
      element.querySelector(
        '[data-testid="preconsultation-chat"]',
      ),
    ).toBeTruthy();

    expect(element.textContent).toContain(
      'Tengo dolor de cabeza desde ayer',
    );

    expect(element.textContent).toContain(
      '¿Desde hace cuánto tiempo presentas esta molestia?',
    );
  });

  it('keeps the conversation and asks about symptoms after duration', async () => {
    const element: HTMLElement = fixture.nativeElement;

    let input = element.querySelector<HTMLInputElement>(
      '[data-testid="consultation-reason-input"]',
    );

    let sendButton = element.querySelector<HTMLButtonElement>(
      '[data-testid="send-consultation-reason"]',
    );

    input!.value = 'Tengo dolor de cabeza desde ayer';
    input!.dispatchEvent(new Event('input'));

    fixture.detectChanges();

    sendButton!.click();
    fixture.detectChanges();

    await new Promise((resolve) => setTimeout(resolve, 700));

    fixture.detectChanges();

    input = element.querySelector<HTMLInputElement>(
      '[data-testid="consultation-reason-input"]',
    );

    sendButton = element.querySelector<HTMLButtonElement>(
      '[data-testid="send-consultation-reason"]',
    );

    input!.value = 'Desde ayer en la tarde';
    input!.dispatchEvent(new Event('input'));

    fixture.detectChanges();

    sendButton!.click();
    fixture.detectChanges();

    await new Promise((resolve) => setTimeout(resolve, 700));

    fixture.detectChanges();

    expect(element.textContent).toContain(
      'Tengo dolor de cabeza desde ayer',
    );

    expect(element.textContent).toContain(
      'Desde ayer en la tarde',
    );

    expect(element.textContent).toContain(
      '¿Presentas otros síntomas además de la molestia principal?',
    );
  });

  it('shows the Intelligent Agent preconsultation experience', () => {
    const element: HTMLElement = fixture.nativeElement;

    expect(element.textContent).toContain(
      'Nueva preconsulta',
    );

    expect(
      element.querySelector(
        '[data-testid="preconsultation-status"]',
      ),
    ).toBeTruthy();

    expect(
      element.querySelector(
        '[data-testid="clinical-safety-notice"]',
      ),
    ).toBeTruthy();

    expect(element.textContent).toContain(
      'TeleMed IA no diagnostica ni prescribe medicamentos',
    );
  });

  it('shows the patient consultation reason after submitting it', async () => {
    const element: HTMLElement = fixture.nativeElement;

    const input = element.querySelector<HTMLInputElement>(
      '[data-testid="consultation-reason-input"]',
    );

    const sendButton = element.querySelector<HTMLButtonElement>(
      '[data-testid="send-consultation-reason"]',
    );

    input!.value = 'Tengo dolor de cabeza desde ayer';
    input!.dispatchEvent(new Event('input'));

    fixture.detectChanges();

    expect(sendButton!.disabled).toBe(false);

    sendButton!.click();
    fixture.detectChanges();

    await new Promise((resolve) => setTimeout(resolve, 700));

    fixture.detectChanges();

    expect(element.textContent).toContain(
      'Tengo dolor de cabeza desde ayer',
    );
  });

  it('starts the preconsultation when the patient submits the first message', async () => {
    const element: HTMLElement = fixture.nativeElement;

    expect(
      element.querySelector(
        '[data-testid="start-preconsultation"]',
      ),
    ).toBeFalsy();

    const input = element.querySelector<HTMLInputElement>(
      '[data-testid="consultation-reason-input"]',
    );

    const sendButton = element.querySelector<HTMLButtonElement>(
      '[data-testid="send-consultation-reason"]',
    );

    input!.value = 'Tengo dolor de cabeza desde ayer';
    input!.dispatchEvent(new Event('input'));

    fixture.detectChanges();

    sendButton!.click();
    fixture.detectChanges();

    await new Promise((resolve) => setTimeout(resolve, 700));

    fixture.detectChanges();

    expect(
      element.querySelector(
        '[data-testid="preconsultation-chat"]',
      ),
    ).toBeTruthy();

    expect(element.textContent).toContain(
      'Tengo dolor de cabeza desde ayer',
    );
  });

  it('shows the MVP conversation layout', () => {
    const element: HTMLElement = fixture.nativeElement;

    expect(element.textContent).toContain(
      'Nueva preconsulta',
    );

    const card = element.querySelector<HTMLElement>(
      '[data-testid="preconsultation-card"]',
    );

    expect(card).toBeTruthy();

    const composer = card?.querySelector(
      '[data-testid="consultation-composer"]',
    );

    expect(composer).toBeTruthy();

    const status = element.querySelector<HTMLElement>(
      '[data-testid="preconsultation-status"]',
    );

    expect(status).toBeTruthy();
    expect(status?.textContent).toContain('En curso');
  });
});