import { AgentMessage } from './agent-message';
import { PreconsultationSummary } from './preconsultation-summary';

export interface AgentTurnResult {
  readonly message?: AgentMessage;
  readonly summary?: PreconsultationSummary;
  readonly completed: boolean;
}