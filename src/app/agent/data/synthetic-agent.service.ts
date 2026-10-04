import { Injectable } from '@angular/core';

import { AgentDataSource } from './agent-data-source';
import { AgentSession } from '../model/agent-session';

@Injectable()
export class SyntheticAgentService implements AgentDataSource {
  async startSession(): Promise<AgentSession> {
    await this.delay(600);

    return {
      id: '3d8844f4-1ca0-4d89-9e30-566f9857c1aa',
      messages: [
        {
          id: 'a2f16b43-6381-4d50-a75c-996f47298046',
          sender: 'AGENT',
          content:
            'Hola, soy el asistente de preconsulta de TeleMed IA. Cuéntame cuál es el motivo de tu consulta.',
          sentAt: '2026-10-04T18:00:00Z',
        },
      ],
    };
  }

  private delay(milliseconds: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, milliseconds);
    });
  }
}