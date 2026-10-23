import { Injectable } from '@angular/core';

export interface SessionClaims {
  readonly sub?: string;
  readonly name?: string;
  readonly role?: string;
}

/** Test double of `shell/session`, kept in memory; decodes the token like the shell does. */
@Injectable({ providedIn: 'root' })
export class SessionService {
  private token: string | null = null;

  signIn(token: string): void {
    this.token = token;
  }

  isAuthenticated(): boolean {
    return this.token !== null;
  }

  getClaims(): SessionClaims | null {
    if (!this.token) {
      return null;
    }
    const payload = this.token.split('.')[1] ?? '';
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as SessionClaims;
  }
}
