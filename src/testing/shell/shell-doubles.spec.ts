import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { ApiClientService } from 'shell/apiClient';
import { SessionService } from 'shell/session';

// Specs run without the shell: its federated modules resolve to these doubles.
describe('shell module doubles', () => {
  it('resolves shell/apiClient to a double that fails unexpected calls', async () => {
    const api = TestBed.inject(ApiClientService);

    await expect(firstValueFrom(api.get('/agent/conversations'))).rejects.toThrow(
      'Unexpected GET /agent/conversations',
    );
  });

  it('resolves shell/session to a double exposing the token claims', () => {
    const session = TestBed.inject(SessionService);

    session.signIn('header.eyJzdWIiOiIxMTExIn0.signature');

    expect(session.isAuthenticated()).toBe(true);
    expect(session.getClaims()?.sub).toBe('1111');
  });
});
