import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { ApiClientService } from 'shell/apiClient';

import { AgentReply, Conversation } from '../model/conversation';

/**
 * intelligent-agent-api through the shell's single HTTP client (NORMA 5.4.1),
 * which adds /api/v1, the correlation id and the error envelope normalisation.
 * The patient is always the token's subject: no patient id is ever sent.
 */
@Injectable({ providedIn: 'root' })
export class AgentApiService {
  private readonly api = inject(ApiClientService);

  /** The appointment's pre-consultation, or null when it has none yet. */
  findByAppointment(appointmentId: string): Observable<Conversation | null> {
    return this.api.getWithParams<Conversation>('/agent/conversations', { appointmentId }).pipe(
      catchError((error: { status?: number }) => (error?.status === 404 ? of(null) : throwError(() => error))),
    );
  }

  /** The caller keeps the key across retries, so a retried start gets the same conversation. */
  start(appointmentId: string, idempotencyKey: string): Observable<Conversation> {
    return this.api.post<Conversation>('/agent/conversations', { appointmentId }, idempotencyKey);
  }

  /** The caller keeps the key across retries, so a retried message is answered once. */
  send(conversationId: string, content: string, idempotencyKey: string): Observable<AgentReply> {
    return this.api.post<AgentReply>(`/agent/conversations/${conversationId}/messages`, { content }, idempotencyKey);
  }

  /** The summary is generated for the professional; the patient gets the finished conversation. */
  finish(conversationId: string): Observable<Conversation> {
    return this.api
      .post<{ conversation: Conversation }>(`/agent/conversations/${conversationId}/finish`, {}, crypto.randomUUID())
      .pipe(map((response) => response.conversation));
  }
}
