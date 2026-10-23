import { AgentMessage } from './agent-message';

/** The agent API's Conversation, as the patient sees it: never the summary, which goes to the professional. */
export interface Conversation {
  readonly id: string;
  readonly appointmentId: string;
  readonly status: 'ACTIVE' | 'FINISHED';
  readonly questionsAsked: number;
  readonly questionLimit: number;
  readonly messages: readonly AgentMessage[];
}

/** The agent's answer to one patient message, and whether the conversation goes on. */
export interface AgentReply extends AgentMessage {
  readonly conversationStatus: 'ACTIVE' | 'FINISHED';
}
