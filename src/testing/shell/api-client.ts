import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';

/** Test double of `shell/apiClient`; specs replace the methods they use. */
@Injectable({ providedIn: 'root' })
export class ApiClientService {
  get<T>(path: string): Observable<T> {
    return throwError(() => new Error(`Unexpected GET ${path}`));
  }

  getWithParams<T>(path: string, _params: Record<string, string | number>): Observable<T> {
    return throwError(() => new Error(`Unexpected GET ${path}`));
  }

  post<T>(path: string, _body: unknown, _idempotencyKey: string): Observable<T> {
    return throwError(() => new Error(`Unexpected POST ${path}`));
  }
}
