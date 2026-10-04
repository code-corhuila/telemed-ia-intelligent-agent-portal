import { InjectionToken } from '@angular/core';

import { AgentSession } from '../model/agent-session';

export interface AgentDataSource {
  startSession(): Promise<AgentSession>;
}

export const AGENT_DATA_SOURCE =
  new InjectionToken<AgentDataSource>('AGENT_DATA_SOURCE');