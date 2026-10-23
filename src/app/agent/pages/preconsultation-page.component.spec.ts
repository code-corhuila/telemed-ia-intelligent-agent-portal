import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Observable, Subject, of, throwError } from 'rxjs';

import { PreconsultationPageComponent } from './preconsultation-page.component';
import { AgentApiService } from '../data/agent-api.service';
import { AgentReply, Conversation } from '../model/conversation';

describe('PreconsultationPageComponent', () => {
  const appointmentId = 'aaaaaaaa-0000-4000-8000-000000000001';
  const opening = { id: 'm1', sender: 'AGENT' as const, content: '¿Cuál es el motivo de tu consulta?', sentAt: 'x' };
  const active: Conversation = {
    id: 'c1', appointmentId, status: 'ACTIVE', questionsAsked: 0, questionLimit: 8, messages: [opening],
  };

  function reply(content: string, conversationStatus: AgentReply['conversationStatus'] = 'ACTIVE'): AgentReply {
    return { id: `r-${content}`, sender: 'AGENT', content, sentAt: 'x', conversationStatus };
  }

  interface AgentDouble {
    findByAppointment: ReturnType<typeof vi.fn>;
    start: ReturnType<typeof vi.fn>;
    send: ReturnType<typeof vi.fn>;
    finish: ReturnType<typeof vi.fn>;
  }

  async function render(existing: Observable<Conversation | null>) {
    const agent: AgentDouble = {
      findByAppointment: vi.fn().mockReturnValue(existing),
      start: vi.fn().mockReturnValue(of(active)),
      send: vi.fn().mockReturnValue(of(reply('¿Desde cuándo?'))),
      finish: vi.fn().mockReturnValue(of({ ...active, status: 'FINISHED' })),
    };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: ':appointmentId', component: PreconsultationPageComponent }]),
        { provide: AgentApiService, useValue: agent },
      ],
    });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(`/${appointmentId}`, PreconsultationPageComponent);
    const fixture = harness.fixture;
    fixture.detectChanges();
    return { fixture, element: harness.routeNativeElement as HTMLElement, agent };
  }

  function byTestId(element: HTMLElement, id: string): HTMLElement | null {
    return element.querySelector(`[data-testid="${id}"]`);
  }

  function write(fixture: { detectChanges(): void }, element: HTMLElement, text: string): void {
    const input = byTestId(element, 'message-input') as HTMLInputElement;
    input.value = text;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    (byTestId(element, 'send-message') as HTMLButtonElement).click();
    fixture.detectChanges();
  }

  it('looks for the pre-consultation of the appointment in the route', async () => {
    const { element, agent } = await render(new Subject());

    expect(agent.findByAppointment).toHaveBeenCalledWith(appointmentId);
    expect(byTestId(element, 'preconsultation-loading')?.getAttribute('role')).toBe('status');
  });

  it('starts it only when the patient asks to, and shows the agent opening question', async () => {
    const { fixture, element, agent } = await render(of(null));
    expect(byTestId(element, 'message-input')).toBeNull();

    byTestId(element, 'start-preconsultation')!.click();
    fixture.detectChanges();

    expect(agent.start).toHaveBeenCalledWith(appointmentId, expect.stringMatching(/^[0-9a-f-]{36}$/));
    expect(element.textContent).toContain('¿Cuál es el motivo de tu consulta?');
    expect(byTestId(element, 'message-input')).not.toBeNull();
  });

  it('retries a failed start with the same key, so it never starts twice', async () => {
    const { fixture, element, agent } = await render(of(null));
    agent.start.mockReturnValueOnce(throwError(() => ({ status: 503, code: 'SERVICE_UNAVAILABLE' })));

    byTestId(element, 'start-preconsultation')!.click();
    fixture.detectChanges();
    expect(byTestId(element, 'preconsultation-error')?.textContent).toContain('no está disponible');
    byTestId(element, 'retry')!.click();
    fixture.detectChanges();

    expect(agent.start.mock.calls[1][1]).toBe(agent.start.mock.calls[0][1]);
    expect(element.textContent).toContain('¿Cuál es el motivo de tu consulta?');
  });

  it("resumes a conversation in progress and sends the patient's answer", async () => {
    const { fixture, element, agent } = await render(of(active));

    write(fixture, element, 'Me duele la cabeza');

    expect(agent.send).toHaveBeenCalledWith('c1', 'Me duele la cabeza', expect.stringMatching(/^[0-9a-f-]{36}$/));
    const messages = Array.from(element.querySelectorAll('[data-testid="message"]')).map((m) => m.textContent);
    expect(messages.at(-2)).toContain('Me duele la cabeza');
    expect(messages.at(-1)).toContain('¿Desde cuándo?');
  });

  it('keeps a failed message on screen and resends it with the same key', async () => {
    const { fixture, element, agent } = await render(of(active));
    agent.send.mockReturnValueOnce(throwError(() => ({ status: 503, code: 'SERVICE_UNAVAILABLE' })));

    write(fixture, element, 'Me duele la cabeza');
    expect(element.textContent).toContain('Me duele la cabeza');
    byTestId(element, 'retry')!.click();
    fixture.detectChanges();

    expect(agent.send.mock.calls[1]).toEqual(agent.send.mock.calls[0]);
    expect(element.textContent).toContain('¿Desde cuándo?');
  });

  it('gives the text back when the message itself was refused', async () => {
    const { fixture, element, agent } = await render(of(active));
    agent.send.mockReturnValueOnce(throwError(() => ({ status: 400, code: 'MESSAGE_TOO_LONG' })));

    write(fixture, element, 'Un mensaje demasiado largo');

    expect(byTestId(element, 'preconsultation-error')?.textContent).toContain('1000 caracteres');
    expect(byTestId(element, 'retry')).toBeNull();
    expect((byTestId(element, 'message-input') as HTMLInputElement).value).toBe('Un mensaje demasiado largo');
  });

  it('lets the patient finish at any moment, and never shows them the summary', async () => {
    const { fixture, element, agent } = await render(of(active));

    byTestId(element, 'finish-preconsultation')!.click();
    fixture.detectChanges();

    expect(agent.finish).toHaveBeenCalledWith('c1');
    expect(byTestId(element, 'preconsultation-completed')?.textContent).toContain('profesional de salud');
    expect(byTestId(element, 'message-input')).toBeNull();
  });

  it('explains why it cannot finish before the patient said anything', async () => {
    const { fixture, element, agent } = await render(of(active));
    agent.finish.mockReturnValueOnce(throwError(() => ({ status: 409, code: 'NOTHING_TO_SUMMARIZE' })));

    byTestId(element, 'finish-preconsultation')!.click();
    fixture.detectChanges();

    expect(byTestId(element, 'preconsultation-error')?.textContent).toContain('motivo de tu consulta');
    expect(byTestId(element, 'message-input')).not.toBeNull();
  });

  it('closes when the agent has what the professional needs', async () => {
    const { fixture, element, agent } = await render(of(active));
    agent.send.mockReturnValueOnce(of(reply('Gracias, ya tengo la información.', 'FINISHED')));

    write(fixture, element, 'Eso es todo');

    expect(byTestId(element, 'preconsultation-completed')).not.toBeNull();
    expect(byTestId(element, 'finish-preconsultation')).toBeNull();
  });

  it('shows a finished pre-consultation as sent, with a way back to the appointments', async () => {
    const { element } = await render(of({ ...active, status: 'FINISHED' }));

    expect(byTestId(element, 'preconsultation-completed')).not.toBeNull();
    expect(byTestId(element, 'back-to-appointments')?.getAttribute('href')).toBe('/');
    expect(byTestId(element, 'clinical-safety-notice')?.textContent).toContain('no diagnostica');
  });
});
