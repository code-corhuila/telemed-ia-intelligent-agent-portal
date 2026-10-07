import { Routes } from '@angular/router';

export const AGENT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/preconsultation-page.component').then(
        (module) => module.PreconsultationPageComponent,
      ),
  },
];