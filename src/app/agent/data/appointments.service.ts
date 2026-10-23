import { Injectable, inject } from '@angular/core';
import { Observable, map, throwError } from 'rxjs';
import { ApiClientService } from 'shell/apiClient';
import { SessionService } from 'shell/session';

import { UpcomingAppointment } from '../model/appointment';

/** One item of appointment-scheduling-api's patient listing ({data, meta}). */
interface AppointmentItem {
  readonly id: string;
  readonly start: string;
  readonly status: string;
}

const ACCEPTS_PRECONSULTATION = new Set(['CONFIRMED', 'RESCHEDULED']);

/** The patient's appointments, read-only, from appointment-scheduling-api through the gateway. */
@Injectable({ providedIn: 'root' })
export class AppointmentsService {
  private readonly api = inject(ApiClientService);
  private readonly session = inject(SessionService);

  /** Upcoming appointments that still accept a pre-consultation, soonest first. */
  upcoming(now: Date = new Date()): Observable<readonly UpcomingAppointment[]> {
    // identity-api puts the patient's UUID in `sub`; the shell's numeric user id cannot hold it.
    const patientId = this.session.getClaims()?.sub;
    if (!patientId) {
      return throwError(() => ({ status: 401, code: 'UNAUTHORIZED' }));
    }
    return this.api
      .getWithParams<{ data: readonly AppointmentItem[] }>(`/appointments/patient/${patientId}`, { page: 1, limit: 50 })
      .pipe(
        map((page) =>
          page.data
            .filter((item) => ACCEPTS_PRECONSULTATION.has(item.status) && new Date(item.start) > now)
            .sort((a, b) => a.start.localeCompare(b.start))
            .map((item) => ({ id: item.id, start: item.start, status: item.status as UpcomingAppointment['status'] })),
        ),
      );
  }
}
