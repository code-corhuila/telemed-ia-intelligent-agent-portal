import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { ApiClientService } from 'shell/apiClient';
import { SessionService } from 'shell/session';

import { AppointmentsService } from './appointments.service';

describe('AppointmentsService', () => {
  const patientId = '11111111-1111-4111-8111-111111111111';
  const now = new Date('2026-10-23T15:00:00Z');

  function appointment(id: string, start: string, status: string) {
    return { id, patientId, professionalId: 'p', start, end: start, status, preconsultationSummaryId: null };
  }

  function setUp(data: unknown[]) {
    const getWithParams = vi.fn().mockReturnValue(of({ data, meta: { page: 1, limit: 50, total: 3 } }));
    TestBed.configureTestingModule({
      providers: [{ provide: ApiClientService, useValue: { getWithParams } }],
    });
    // A token whose subject is the patient's UUID, as identity-api issues it.
    TestBed.inject(SessionService).signIn(`h.${btoa(JSON.stringify({ sub: patientId }))}.s`);
    return { appointments: TestBed.inject(AppointmentsService), getWithParams };
  }

  it("lists the patient's upcoming appointments that accept a pre-consultation, soonest first", async () => {
    const { appointments, getWithParams } = setUp([
      appointment('later', '2026-11-03T14:00:00Z', 'RESCHEDULED'),
      appointment('past', '2026-10-20T14:00:00Z', 'CONFIRMED'),
      appointment('cancelled', '2026-10-30T14:00:00Z', 'CANCELLED'),
      appointment('soon', '2026-10-24T09:00:00Z', 'CONFIRMED'),
    ]);

    const upcoming = await firstValueFrom(appointments.upcoming(now));

    expect(upcoming.map((a) => a.id)).toEqual(['soon', 'later']);
    expect(upcoming[0]).toEqual({ id: 'soon', start: '2026-10-24T09:00:00Z', status: 'CONFIRMED' });
    expect(getWithParams).toHaveBeenCalledWith(`/appointments/patient/${patientId}`, { page: 1, limit: 50 });
  });

  it('asks for nothing without a patient in the session', async () => {
    const getWithParams = vi.fn();
    TestBed.configureTestingModule({
      providers: [{ provide: ApiClientService, useValue: { getWithParams } }],
    });

    await expect(firstValueFrom(TestBed.inject(AppointmentsService).upcoming(now))).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
    expect(getWithParams).not.toHaveBeenCalled();
  });
});
