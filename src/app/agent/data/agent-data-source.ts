import { InjectionToken } from '@angular/core';

import { AgentSession } from '../model/agent-session';
import { AgentTurnResult } from '../model/agent-turn-result';

export interface AgentDataSource {
  startSession(
    consultationReason: string,
  ): Promise<AgentSession>;

  sendMessage(
    sessionId: string,
    patientMessage: string,
    turn: number,
  ): Promise<AgentTurnResult>;
}

export const AGENT_DATA_SOURCE =
  new InjectionToken<AgentDataSource>('AGENT_DATA_SOURCE');