import { Injectable } from '@angular/core';

import { AgentDataSource } from './agent-data-source';
import { AgentMessage } from '../model/agent-message';
import { AgentSession } from '../model/agent-session';

@Injectable()
export class SyntheticAgentService implements AgentDataSource {
  async startSession(
    consultationReason: string,
  ): Promise<AgentSession> {
    await this.delay(600);

    return {
      id: '3d8844f4-1ca0-4d89-9e30-566f9857c1aa',
      messages: [
        {
          id: 'agent-duration-question',
          sender: 'AGENT',
          content:
            '¿Desde hace cuánto tiempo presentas esta molestia?',
          sentAt: new Date().toISOString(),
        },
      ],
    };
  }

  async sendMessage(
    sessionId: string,
    patientMessage: string,
    turn: number,
  ): Promise<AgentMessage> {
    await this.delay(600);

    if (turn === 1) {
      return {
        id: 'agent-symptoms-question',
        sender: 'AGENT',
        content:
          '¿Presentas otros síntomas además de la molestia principal?',
        sentAt: new Date().toISOString(),
      };
    }

    return {
      id: `agent-follow-up-${turn}`,
      sender: 'AGENT',
      content:
        '¿Tienes antecedentes médicos relevantes que quieras mencionar?',
      sentAt: new Date().toISOString(),
    };
  }

  private delay(milliseconds: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, milliseconds);
    });
  }
}