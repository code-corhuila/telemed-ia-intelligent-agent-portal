import { AgentMessage } from './agent-message';

export interface AgentSession {
  id: string;
  messages: readonly AgentMessage[];
}