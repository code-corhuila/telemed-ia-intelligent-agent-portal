import { InjectionToken } from '@angular/core';

import { AgentMessage } from '../model/agent-message';
import { AgentSession } from '../model/agent-session';

export interface AgentDataSource {
  startSession(
    consultationReason: string,
  ): Promise<AgentSession>;

  sendMessage(
    sessionId: string,
    patientMessage: string,
    turn: number,
  ): Promise<AgentMessage>;
}

export const AGENT_DATA_SOURCE =
  new InjectionToken<AgentDataSource>('AGENT_DATA_SOURCE');