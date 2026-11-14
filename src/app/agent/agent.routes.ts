import { Routes } from '@angular/router';

// First the appointment, then the pre-consultation: the portal opens on the patient's appointments.
export const AGENT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/appointments-page.component').then(
        (module) => module.AppointmentsPageComponent,
      ),
  },
  {
    path: ':appointmentId',
    loadComponent: () =>
      import('./pages/preconsultation-page.component').then(
        (module) => module.PreconsultationPageComponent,
      ),
  },
];
