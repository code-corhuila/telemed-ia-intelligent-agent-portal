import { errorMessage } from './error-message';

describe('errorMessage', () => {
  it('explains the agent rules in Spanish', () => {
    expect(errorMessage({ status: 409, code: 'ACTIVE_PRECONSULTATION_EXISTS' }).text).toContain(
      'otra preconsulta en curso',
    );
    expect(errorMessage({ status: 422, code: 'APPOINTMENT_NOT_ELIGIBLE' }).text).toContain('ya no admite');
    expect(errorMessage({ status: 400, code: 'MESSAGE_TOO_LONG' }).text).toContain('1000 caracteres');
  });

  it('lets the patient retry when the assistant is unavailable, but not when a rule says no', () => {
    expect(errorMessage({ status: 503, code: 'SERVICE_UNAVAILABLE' }).retryable).toBe(true);
    expect(errorMessage({ status: 0, code: 'NETWORK_ERROR' }).retryable).toBe(true);
    expect(errorMessage({ status: 409, code: 'CONVERSATION_FINISHED' }).retryable).toBe(false);
  });

  it('gives a support code only for unexpected failures', () => {
    expect(errorMessage({ status: 500, code: 'INTERNAL_ERROR', traceId: 'trace-1' })).toEqual({
      text: 'No pudimos completar la solicitud. Inténtalo de nuevo en unos minutos.',
      retryable: true,
      supportCode: 'trace-1',
    });
    expect(errorMessage(new Error('boom')).supportCode).toBeUndefined();
  });
});
