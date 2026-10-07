import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';

import {
  AGENT_DATA_SOURCE,
  AgentDataSource,
} from '../data/agent-data-source';
import { SyntheticAgentService } from '../data/synthetic-agent.service';
import { AgentMessage } from '../model/agent-message';

type ViewState =
  | 'empty'
  | 'loading'
  | 'chat'
  | 'completed';

@Component({
  selector: 'app-preconsultation-page',
  standalone: true,
  templateUrl: './preconsultation-page.component.html',
  styleUrl: './preconsultation-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    SyntheticAgentService,
    {
      provide: AGENT_DATA_SOURCE,
      useExisting: SyntheticAgentService,
    },
  ],
})
export class PreconsultationPageComponent {
  private readonly agentDataSource: AgentDataSource =
    inject(AGENT_DATA_SOURCE);

  readonly viewState = signal<ViewState>('empty');
  readonly messages = signal<readonly AgentMessage[]>([]);
  readonly consultationReason = signal('');

  private readonly sessionId = signal<string | null>(null);
  private readonly patientTurn = signal(0);

  updateConsultationReason(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.consultationReason.set(input.value);
  }

  async submitConsultationReason(): Promise<void> {
    const reason = this.consultationReason().trim();

    if (
      !reason ||
      this.viewState() === 'loading' ||
      this.viewState() === 'completed'
    ) {
      return;
    }

    const patientMessage: AgentMessage = {
      id: `patient-${this.messages().length + 1}`,
      sender: 'PATIENT',
      content: reason,
      sentAt: new Date().toISOString(),
    };

    this.consultationReason.set('');

    const currentSessionId = this.sessionId();

    if (!currentSessionId) {
      await this.startConversation(
        reason,
        patientMessage,
      );

      return;
    }

    await this.continueConversation(
      currentSessionId,
      reason,
      patientMessage,
    );
  }

  private async startConversation(
    reason: string,
    patientMessage: AgentMessage,
  ): Promise<void> {
    this.viewState.set('loading');

    const session =
      await this.agentDataSource.startSession(reason);

    this.sessionId.set(session.id);

    this.messages.set([
      patientMessage,
      ...session.messages,
    ]);

    this.patientTurn.set(1);
    this.viewState.set('chat');
  }

  private async continueConversation(
    sessionId: string,
    reason: string,
    patientMessage: AgentMessage,
  ): Promise<void> {
    const turn = this.patientTurn();

    this.messages.update((messages) => [
      ...messages,
      patientMessage,
    ]);

    this.viewState.set('loading');

    const result =
      await this.agentDataSource.sendMessage(
        sessionId,
        reason,
        turn,
      );

    if (result.message) {
      this.messages.update((messages) => [
        ...messages,
        result.message!,
      ]);
    }

    this.patientTurn.update(
      (currentTurn) => currentTurn + 1,
    );

    if (result.completed) {
      this.viewState.set('completed');
      return;
    }

    this.viewState.set('chat');
  }
}