/** An appointment of the patient that can still have a pre-consultation. */
export interface UpcomingAppointment {
  readonly id: string;
  readonly start: string;
  readonly status: 'CONFIRMED' | 'RESCHEDULED';
}
