import { ApiError } from 'shell/apiError';

export interface UserMessage {
  readonly text: string;
  /** Whether trying again may work; a rule that said no will say no again. */
  readonly retryable: boolean;
  /** traceId the patient can quote to support; only for unexpected failures. */
  readonly supportCode?: string;
}

const GENERIC = 'No pudimos completar la solicitud. Inténtalo de nuevo en unos minutos.';

// Codes from the agent API's error envelope and the shell interceptor.
const MESSAGES: Readonly<Record<string, Omit<UserMessage, 'supportCode'>>> = {
  APPOINTMENT_NOT_FOUND: { text: 'No encontramos esa cita entre las tuyas.', retryable: false },
  APPOINTMENT_NOT_ELIGIBLE: { text: 'Esta cita ya no admite preconsulta.', retryable: false },
  PRECONSULTATION_ALREADY_EXISTS: { text: 'Esta cita ya tiene una preconsulta.', retryable: false },
  ACTIVE_PRECONSULTATION_EXISTS: {
    text: 'Tienes otra preconsulta en curso. Termínala antes de empezar una nueva.',
    retryable: false,
  },
  CONVERSATION_NOT_FOUND: { text: 'No encontramos esta preconsulta.', retryable: false },
  CONVERSATION_FINISHED: { text: 'Esta preconsulta ya terminó.', retryable: false },
  NOTHING_TO_SUMMARIZE: {
    text: 'Cuéntale al asistente el motivo de tu consulta antes de terminar.',
    retryable: false,
  },
  MESSAGE_TOO_LONG: { text: 'Tu mensaje es muy largo. Escribe máximo 1000 caracteres.', retryable: false },
  INVALID_MESSAGE: { text: 'Escribe lo que quieres contarle al asistente.', retryable: false },
  SERVICE_UNAVAILABLE: {
    text: 'El asistente no está disponible en este momento. Inténtalo de nuevo en unos segundos.',
    retryable: true,
  },
  NETWORK_ERROR: {
    text: 'No pudimos conectarnos. Revisa tu conexión a internet e inténtalo de nuevo.',
    retryable: true,
  },
  TIMEOUT: { text: 'El asistente tardó demasiado en responder. Inténtalo de nuevo.', retryable: true },
  UNAUTHORIZED: { text: 'Tu sesión terminó. Inicia sesión de nuevo para continuar.', retryable: false },
};

/** Spanish message for the patient; server messages are English and technical. */
export function errorMessage(error: unknown): UserMessage {
  if (!isApiError(error)) {
    return { text: GENERIC, retryable: true };
  }
  return MESSAGES[error.code] ?? { text: GENERIC, retryable: true, supportCode: error.traceId };
}

function isApiError(error: unknown): error is Pick<ApiError, 'status' | 'code' | 'traceId'> {
  return typeof error === 'object' && error !== null && 'status' in error && 'code' in error;
}
