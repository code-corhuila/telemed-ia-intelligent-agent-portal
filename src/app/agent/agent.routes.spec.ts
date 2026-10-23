import { Type } from '@angular/core';

import { AGENT_ROUTES } from './agent.routes';
import { AppointmentsPageComponent } from './pages/appointments-page.component';
import { PreconsultationPageComponent } from './pages/preconsultation-page.component';

describe('AGENT_ROUTES', () => {
  async function componentAt(path: string): Promise<Type<unknown>> {
    const route = AGENT_ROUTES.find((candidate) => candidate.path === path);
    return (await route!.loadComponent!()) as Type<unknown>;
  }

  it('opens on the patient appointments: first the appointment, then the pre-consultation', async () => {
    expect(await componentAt('')).toBe(AppointmentsPageComponent);
  });

  it('opens the pre-consultation of one appointment', async () => {
    expect(await componentAt(':appointmentId')).toBe(PreconsultationPageComponent);
  });
});
