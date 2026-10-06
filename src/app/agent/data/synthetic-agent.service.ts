import { Injectable } from '@angular/core';

import { AgentDataSource } from './agent-data-source';
import { AgentSession } from '../model/agent-session';
import { AgentTurnResult } from '../model/agent-turn-result';

interface SyntheticSessionState {
  consultationReason: string;
  duration?: string;
  symptoms?: string;
  relevantHistory?: string;
}

@Injectable()
export class SyntheticAgentService implements AgentDataSource {
  private readonly sessions =
    new Map<string, SyntheticSessionState>();

  async startSession(
    consultationReason: string,
  ): Promise<AgentSession> {
    await this.delay(600);

    const sessionId =
      '3d8844f4-1ca0-4d89-9e30-566f9857c1aa';

    this.sessions.set(sessionId, {
      consultationReason,
    });

    return {
      id: sessionId,
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
  ): Promise<AgentTurnResult> {
    await this.delay(600);

    const session = this.sessions.get(sessionId);

    if (!session) {
      throw new Error('Synthetic Agent session not found');
    }

    if (turn === 1) {
      session.duration = patientMessage;

      return {
        completed: false,
        message: {
          id: 'agent-symptoms-question',
          sender: 'AGENT',
          content:
            '¿Presentas otros síntomas además de la molestia principal?',
          sentAt: new Date().toISOString(),
        },
      };
    }

    if (turn === 2) {
      session.symptoms = patientMessage;

      return {
        completed: false,
        message: {
          id: 'agent-history-question',
          sender: 'AGENT',
          content:
            '¿Tienes antecedentes médicos relevantes que quieras mencionar?',
          sentAt: new Date().toISOString(),
        },
      };
    }

    session.relevantHistory = patientMessage;

    return {
      completed: true,
      summary: {
        consultationReason: session.consultationReason,
        duration: session.duration ?? 'No informado',
        symptoms: session.symptoms ?? 'No informado',
        relevantHistory:
          session.relevantHistory ?? 'No informado',
      },
    };
  }

  private delay(milliseconds: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, milliseconds);
    });
  }
}