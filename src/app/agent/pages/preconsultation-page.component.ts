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

type ViewState = 'empty' | 'loading' | 'chat';

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

  async startPreconsultation(): Promise<void> {
    this.viewState.set('loading');

    const session = await this.agentDataSource.startSession();

    this.messages.set(session.messages);
    this.viewState.set('chat');
  }
}