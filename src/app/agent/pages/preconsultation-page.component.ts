import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
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

  @ViewChild('messagesContainer')
  private messagesContainer?: ElementRef<HTMLElement>;

  @ViewChild('messageInput')
  private messageInput?: ElementRef<HTMLInputElement>;

  readonly viewState = signal<ViewState>('empty');
  readonly messages = signal<readonly AgentMessage[]>([]);
  readonly consultationReason = signal('');
  readonly isResponding = signal(false);

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
      this.isResponding() ||
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
    this.messages.set([
      patientMessage,
    ]);

    this.viewState.set('chat');
    this.isResponding.set(true);

    this.keepConversationAtBottom();

    const session =
      await this.agentDataSource.startSession(reason);

    this.sessionId.set(session.id);

    this.messages.update((messages) => [
      ...messages,
      ...session.messages,
    ]);

    this.patientTurn.set(1);
    this.isResponding.set(false);

    this.keepConversationAtBottom(true);
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

    this.isResponding.set(true);

    this.keepConversationAtBottom();

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

    this.isResponding.set(false);

    if (result.completed) {
      this.viewState.set('completed');
      return;
    }

    this.keepConversationAtBottom(true);
  }

  private keepConversationAtBottom(
    focusInput = false,
  ): void {
    setTimeout(() => {
      const container =
        this.messagesContainer?.nativeElement;

      if (container) {
        container.scrollTop =
          container.scrollHeight;
      }

      if (focusInput) {
        this.messageInput?.nativeElement.focus();
      }
    });
  }
}