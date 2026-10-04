import {
  ChangeDetectionStrategy,
  Component,
  signal,
} from '@angular/core';

@Component({
  selector: 'app-preconsultation-page',
  standalone: true,
  templateUrl: './preconsultation-page.component.html',
  styleUrl: './preconsultation-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreconsultationPageComponent {
  readonly isLoading = signal(false);

  startPreconsultation(): void {
    this.isLoading.set(true);
  }
}