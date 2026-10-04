export interface AgentMessage {
  id: string;
  sender: 'AGENT' | 'PATIENT';
  content: string;
  sentAt: string;
}