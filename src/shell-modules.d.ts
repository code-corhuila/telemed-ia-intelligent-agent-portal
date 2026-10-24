// Public API of the shell modules consumed through Native Federation (NORMA 5.4.1).
// Keep in sync with telemed-ia-front (src/app/core/http and core/auth).

declare module 'shell/apiClient' {
  export class ApiClientService {
    get<T>(path: string): import('rxjs').Observable<T>;
    getWithParams<T>(path: string, params: Record<string, string | number>): import('rxjs').Observable<T>;
    post<T>(path: string, body: unknown, idempotencyKey: string): import('rxjs').Observable<T>;
  }
}

declare module 'shell/session' {
  export interface SessionClaims {
    readonly sub?: string;
    readonly name?: string;
    readonly role?: string;
  }

  export class SessionService {
    isAuthenticated(): boolean;
    getClaims(): SessionClaims | null;
  }
}

declare module 'shell/apiError' {
  export interface ApiError {
    status: number;
    code: string;
    message: string;
    details: ReadonlyArray<{ field: string; message: string }>;
    traceId: string;
    userMessage: string;
  }
}
