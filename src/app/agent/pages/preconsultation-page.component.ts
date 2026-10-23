import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AgentApiService } from '../data/agent-api.service';
import { UserMessage, errorMessage } from '../data/error-message';
import { AgentMessage } from '../model/agent-message';
import { Conversation } from '../model/conversation';

type Phase = 'loading' | 'unavailable' | 'empty' | 'chat' | 'completed';

interface PageError {
  readonly message: UserMessage;
  /** Repeats the failed action with the same idempotency key, so nothing is done twice. */
  readonly retry?: () => void;
}

/**
 * HU-06: the patient's pre-consultation for one appointment, on the real agent API.
 * The summary is generated for the professional and never shown here.
 */
@Component({
  selector: 'app-preconsultation-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './preconsultation-page.component.html',
  styleUrl: './preconsultation-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreconsultationPageComponent {
  private readonly agent = inject(AgentApiService);
  private readonly appointmentId = inject(ActivatedRoute).snapshot.paramMap.get('appointmentId') ?? '';
  // One key for this page's start: a retried start gets the same conversation back.
  private readonly startKey = crypto.randomUUID();
  private conversation: Conversation | null = null;

  @ViewChild('messagesContainer')
  private messagesContainer?: ElementRef<HTMLElement>;

  @ViewChild('messageInput')
  private messageInput?: ElementRef<HTMLInputElement>;

  readonly phase = signal<Phase>('loading');
  readonly messages = signal<readonly AgentMessage[]>([]);
  readonly draft = signal('');
  readonly isResponding = signal(false);
  readonly error = signal<PageError | null>(null);

  constructor() {
    this.load();
  }

  load(): void {
    this.error.set(null);
    this.phase.set('loading');
    this.agent.findByAppointment(this.appointmentId).subscribe({
      next: (conversation) => (conversation ? this.show(conversation) : this.phase.set('empty')),
      error: (error: unknown) => {
        // Without knowing whether one exists, offering to start one could mislead.
        this.phase.set('unavailable');
        this.fail(error, () => this.load());
      },
    });
  }

  updateDraft(event: Event): void {
    this.draft.set((event.target as HTMLInputElement).value);
  }

  start(): void {
    this.error.set(null);
    this.isResponding.set(true);
    this.agent.start(this.appointmentId, this.startKey).subscribe({
      next: (conversation) => {
        this.isResponding.set(false);
        this.show(conversation);
        this.keepConversationAtBottom(true);
      },
      error: (error: unknown) => {
        this.isResponding.set(false);
        this.fail(error, () => this.start());
      },
    });
  }

  send(): void {
    const text = this.draft().trim();
    if (!text || this.isResponding() || !this.conversation) {
      return;
    }
    const message: AgentMessage = {
      id: crypto.randomUUID(),
      sender: 'PATIENT',
      content: text,
      sentAt: new Date().toISOString(),
    };
    this.messages.update((messages) => [...messages, message]);
    this.draft.set('');
    this.deliver(message, crypto.randomUUID());
  }

  finish(): void {
    if (!this.conversation || this.isResponding()) {
      return;
    }
    this.error.set(null);
    this.isResponding.set(true);
    this.agent.finish(this.conversation.id).subscribe({
      next: () => {
        this.isResponding.set(false);
        this.phase.set('completed');
      },
      error: (error: unknown) => {
        this.isResponding.set(false);
        this.fail(error);
      },
    });
  }

  private deliver(message: AgentMessage, idempotencyKey: string): void {
    this.error.set(null);
    this.isResponding.set(true);
    this.keepConversationAtBottom();
    this.agent.send(this.conversation!.id, message.content, idempotencyKey).subscribe({
      next: (reply) => {
        this.isResponding.set(false);
        this.messages.update((messages) => [...messages, reply]);
        if (reply.conversationStatus === 'FINISHED') {
          this.phase.set('completed');
          return;
        }
        this.keepConversationAtBottom(true);
      },
      error: (error: unknown) => {
        this.isResponding.set(false);
        const userMessage = errorMessage(error);
        if (userMessage.retryable) {
          // The message stays on screen and is resent with the same key: the agent answers it once.
          this.error.set({ message: userMessage, retry: () => this.deliver(message, idempotencyKey) });
          return;
        }
        // Refused as written: the patient gets their text back to change it.
        this.messages.update((messages) => messages.filter((candidate) => candidate.id !== message.id));
        this.draft.set(message.content);
        this.error.set({ message: userMessage });
      },
    });
  }

  private show(conversation: Conversation): void {
    this.conversation = conversation;
    this.messages.set(conversation.messages);
    this.phase.set(conversation.status === 'FINISHED' ? 'completed' : 'chat');
  }

  private fail(error: unknown, retry?: () => void): void {
    const message = errorMessage(error);
    this.error.set({ message, retry: message.retryable ? retry : undefined });
  }

  private keepConversationAtBottom(focusInput = false): void {
    setTimeout(() => {
      const container = this.messagesContainer?.nativeElement;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
      if (focusInput) {
        this.messageInput?.nativeElement.focus();
      }
    });
  }
}
