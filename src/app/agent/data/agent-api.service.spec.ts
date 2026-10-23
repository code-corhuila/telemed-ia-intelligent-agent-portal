import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';
import { ApiClientService } from 'shell/apiClient';

import { AgentApiService } from './agent-api.service';
import { Conversation } from '../model/conversation';

describe('AgentApiService', () => {
  const appointmentId = '22222222-2222-4222-8222-222222222222';
  const conversation: Conversation = {
    id: '33333333-3333-4333-8333-333333333333',
    appointmentId,
    status: 'ACTIVE',
    questionsAsked: 0,
    questionLimit: 8,
    messages: [{ id: 'm1', sender: 'AGENT', content: '¿Qué te trae?', sentAt: '2026-10-23T15:00:00Z' }],
  };

  function setUp() {
    const get = vi.fn();
    const getWithParams = vi.fn().mockReturnValue(of(conversation));
    const post = vi.fn().mockReturnValue(of(conversation));
    TestBed.configureTestingModule({
      providers: [{ provide: ApiClientService, useValue: { get, getWithParams, post } }],
    });
    return { api: TestBed.inject(AgentApiService), getWithParams, post };
  }

  it('finds the pre-consultation of an appointment', async () => {
    const { api, getWithParams } = setUp();

    expect(await firstValueFrom(api.findByAppointment(appointmentId))).toEqual(conversation);
    expect(getWithParams).toHaveBeenCalledWith('/agent/conversations', { appointmentId });
  });

  it('reports an appointment without a pre-consultation as none, not as an error', async () => {
    const { api, getWithParams } = setUp();
    getWithParams.mockReturnValue(throwError(() => ({ status: 404, code: 'CONVERSATION_NOT_FOUND' })));

    expect(await firstValueFrom(api.findByAppointment(appointmentId))).toBeNull();
  });

  it('lets any other failure through', async () => {
    const { api, getWithParams } = setUp();
    getWithParams.mockReturnValue(throwError(() => ({ status: 503, code: 'SERVICE_UNAVAILABLE' })));

    await expect(firstValueFrom(api.findByAppointment(appointmentId))).rejects.toMatchObject({
      code: 'SERVICE_UNAVAILABLE',
    });
  });

  it('starts with the caller key, so a retry gets the same conversation back', async () => {
    const { api, post } = setUp();

    await firstValueFrom(api.start(appointmentId, 'start-key-0001'));

    expect(post).toHaveBeenCalledWith('/agent/conversations', { appointmentId }, 'start-key-0001');
  });

  it('sends a message with its key and returns the agent reply', async () => {
    const { api, post } = setUp();
    const reply = { id: 'r1', sender: 'AGENT', content: '¿Desde cuándo?', sentAt: 'x', conversationStatus: 'ACTIVE' };
    post.mockReturnValue(of(reply));

    expect(await firstValueFrom(api.send(conversation.id, 'Me duele la cabeza', 'turn-key-0001'))).toEqual(reply);
    expect(post).toHaveBeenCalledWith(
      `/agent/conversations/${conversation.id}/messages`,
      { content: 'Me duele la cabeza' },
      'turn-key-0001',
    );
  });

  it('finishes and returns the finished conversation only', async () => {
    const { api, post } = setUp();
    post.mockReturnValue(of({ conversation: { ...conversation, status: 'FINISHED' } }));

    const finished = await firstValueFrom(api.finish(conversation.id));

    expect(finished.status).toBe('FINISHED');
    expect(post).toHaveBeenCalledWith(
      `/agent/conversations/${conversation.id}/finish`,
      {},
      expect.stringMatching(/^[0-9a-f-]{36}$/),
    );
  });
});
