import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';

import { AppointmentsPageComponent } from './appointments-page.component';
import { AgentApiService } from '../data/agent-api.service';
import { AppointmentsService } from '../data/appointments.service';
import { UpcomingAppointment } from '../model/appointment';
import { Conversation } from '../model/conversation';

describe('AppointmentsPageComponent', () => {
  const fresh: UpcomingAppointment = { id: 'aaaaaaaa-0000-4000-8000-000000000001', start: '2026-10-24T14:00:00Z', status: 'CONFIRMED' };
  const inProgress: UpcomingAppointment = { id: 'aaaaaaaa-0000-4000-8000-000000000002', start: '2026-10-27T15:30:00Z', status: 'RESCHEDULED' };
  const sent: UpcomingAppointment = { id: 'aaaaaaaa-0000-4000-8000-000000000003', start: '2026-11-03T13:00:00Z', status: 'CONFIRMED' };

  function conversation(appointmentId: string, status: Conversation['status']): Conversation {
    return { id: `c-${appointmentId}`, appointmentId, status, questionsAsked: 1, questionLimit: 8, messages: [] };
  }

  function render(upcoming: unknown, byAppointment: Record<string, Conversation | null> = {}) {
    const appointments = { upcoming: vi.fn().mockReturnValue(upcoming) };
    const agent = { findByAppointment: vi.fn((id: string) => of(byAppointment[id] ?? null)) };
    TestBed.configureTestingModule({
      imports: [AppointmentsPageComponent],
      providers: [
        provideRouter([]),
        { provide: AppointmentsService, useValue: appointments },
        { provide: AgentApiService, useValue: agent },
      ],
    });
    const fixture = TestBed.createComponent(AppointmentsPageComponent);
    fixture.detectChanges();
    return { fixture, element: fixture.nativeElement as HTMLElement, appointments };
  }

  it('says it is looking for the appointments while they load', () => {
    const { element } = render(new Subject());

    expect(element.querySelector('[data-testid="appointments-loading"]')?.textContent).toContain(
      'Buscando tus próximas citas',
    );
  });

  it('offers to start, to continue, or confirms it was sent, per appointment', () => {
    const { element } = render(of([fresh, inProgress, sent]), {
      [inProgress.id]: conversation(inProgress.id, 'ACTIVE'),
      [sent.id]: conversation(sent.id, 'FINISHED'),
    });

    const items = Array.from(element.querySelectorAll('[data-testid="appointment"]'));
    expect(items).toHaveLength(3);
    expect(items[0].querySelector('a')?.textContent).toContain('Hacer preconsulta');
    expect(items[0].querySelector('a')?.getAttribute('href')).toBe(`/${fresh.id}`);
    expect(items[1].querySelector('a')?.textContent).toContain('Continuar preconsulta');
    expect(items[1].textContent).toContain('Cita reprogramada');
    // The summary is the professional's: the patient only learns it was sent.
    expect(items[2].querySelector('a')).toBeNull();
    expect(items[2].textContent).toContain('Preconsulta enviada a tu médico');
  });

  it('shows each appointment date in Spanish, in Colombian time', () => {
    const { element } = render(of([fresh]));

    const time = element.querySelector('[data-testid="appointment"] time');
    expect(time?.getAttribute('datetime')).toBe(fresh.start);
    expect(time?.textContent?.trim()).toBe('sábado, 24 de octubre, 9:00 a. m.');
  });

  it('invites the patient to book an appointment when there is none', () => {
    const { element } = render(of([]));

    expect(element.querySelector('[data-testid="appointments-empty"]')?.textContent).toContain(
      'No tienes citas próximas',
    );
  });

  it('explains a failure in Spanish and retries when it makes sense', () => {
    const { fixture, element, appointments } = render(
      throwError(() => ({ status: 503, code: 'SERVICE_UNAVAILABLE' })),
    );

    const alert = element.querySelector('[data-testid="appointments-error"]');
    expect(alert?.getAttribute('role')).toBe('alert');
    expect(alert?.textContent).toContain('no está disponible');

    appointments.upcoming.mockReturnValue(of([fresh]));
    (alert?.querySelector('button') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(element.querySelectorAll('[data-testid="appointment"]')).toHaveLength(1);
  });

  it('does not offer a retry that cannot work', () => {
    const { element } = render(throwError(() => ({ status: 401, code: 'UNAUTHORIZED' })));

    const alert = element.querySelector('[data-testid="appointments-error"]');
    expect(alert?.textContent).toContain('Inicia sesión de nuevo');
    expect(alert?.querySelector('button')).toBeNull();
  });
});
