import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, map, of, switchMap } from 'rxjs';

import { AgentApiService } from '../data/agent-api.service';
import { AppointmentsService } from '../data/appointments.service';
import { UserMessage, errorMessage } from '../data/error-message';
import { UpcomingAppointment } from '../model/appointment';

type Preconsultation = 'NONE' | 'ACTIVE' | 'FINISHED';

interface AppointmentRow {
  readonly appointment: UpcomingAppointment;
  readonly preconsultation: Preconsultation;
  readonly day: string;
  readonly month: string;
  readonly when: string;
}

type ViewState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'ready'; readonly rows: readonly AppointmentRow[] }
  | { readonly kind: 'error'; readonly message: UserMessage };

// Appointments are in Colombia; the patient reads them in Colombian time whatever their device says.
const TIME_ZONE = 'America/Bogota';
const WHEN = new Intl.DateTimeFormat('es-CO', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: TIME_ZONE,
});
const DAY = new Intl.DateTimeFormat('es-CO', { day: 'numeric', timeZone: TIME_ZONE });
const MONTH = new Intl.DateTimeFormat('es-CO', { month: 'short', timeZone: TIME_ZONE });

/** HU-06: the patient picks the appointment whose pre-consultation they want to do. */
@Component({
  selector: 'app-appointments-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './appointments-page.component.html',
  styleUrl: './appointments-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppointmentsPageComponent {
  private readonly appointments = inject(AppointmentsService);
  private readonly agent = inject(AgentApiService);

  readonly state = signal<ViewState>({ kind: 'loading' });

  constructor() {
    this.load();
  }

  load(): void {
    this.state.set({ kind: 'loading' });
    this.appointments
      .upcoming()
      .pipe(
        switchMap((upcoming) =>
          upcoming.length === 0 ? of([]) : forkJoin(upcoming.map((appointment) => this.rowOf(appointment))),
        ),
      )
      .subscribe({
        next: (rows) => this.state.set({ kind: 'ready', rows }),
        error: (error: unknown) => this.state.set({ kind: 'error', message: errorMessage(error) }),
      });
  }

  private rowOf(appointment: UpcomingAppointment) {
    const start = new Date(appointment.start);
    return this.agent.findByAppointment(appointment.id).pipe(
      map((conversation) => ({
        appointment,
        preconsultation: (conversation?.status ?? 'NONE') as Preconsultation,
        day: DAY.format(start),
        month: MONTH.format(start).replace('.', ''),
        when: readable(WHEN.format(start)),
      })),
    );
  }
}

/** ICU separates "a. m." with narrow no-break spaces; plain spaces read and wrap the same. */
function readable(text: string): string {
  return text.replace(/[  ]/g, ' ');
}
