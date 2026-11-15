import { JwtService } from '@nestjs/jwt';
import type { Socket } from 'socket.io';

// @nestjs/jwt ships ESM that Jest's CJS runtime can't parse; the service only
// needs the class as a DI token here, so a stub is enough.
jest.mock('@nestjs/jwt', () => ({ JwtService: class JwtService {} }));

import { UsersService } from '../users/users.service';
import { WsAuthService } from './ws-auth.service';

const makeClient = (
  auth: Record<string, unknown> = {},
  headers: Record<string, string> = {},
): Socket => ({ handshake: { auth, headers } }) as unknown as Socket;

describe('WsAuthService', () => {
  const user = { id: 'u1', email: 'a@b.c' };
  let jwt: { verifyAsync: jest.Mock };
  let users: { findById: jest.Mock };
  let service: WsAuthService;

  beforeEach(() => {
    jwt = { verifyAsync: jest.fn().mockResolvedValue({ sub: 'u1' }) };
    users = { findById: jest.fn().mockResolvedValue(user) };
    service = new WsAuthService(
      jwt as unknown as JwtService,
      users as unknown as UsersService,
    );
  });

  it('reads the token from handshake.auth.token', async () => {
    await expect(service.authenticate(makeClient({ token: 'abc' }))).resolves.toBe(
      user,
    );
    expect(jwt.verifyAsync).toHaveBeenCalledWith('abc');
    expect(users.findById).toHaveBeenCalledWith('u1');
  });

  it('strips a Bearer prefix from handshake.auth.token', () => {
    expect(service.extractToken(makeClient({ token: 'Bearer abc' }))).toBe('abc');
  });

  it('falls back to the Authorization header', () => {
    expect(
      service.extractToken(makeClient({}, { authorization: 'Bearer xyz' })),
    ).toBe('xyz');
  });

  it('returns null when no token is supplied', async () => {
    await expect(service.authenticate(makeClient())).resolves.toBeNull();
    expect(jwt.verifyAsync).not.toHaveBeenCalled();
  });

  it('returns null when the token fails verification', async () => {
    jwt.verifyAsync.mockRejectedValue(new Error('jwt expired'));
    await expect(
      service.authenticate(makeClient({ token: 'bad' })),
    ).resolves.toBeNull();
  });

  it('returns null when the user no longer exists', async () => {
    users.findById.mockResolvedValue(null);
    await expect(
      service.authenticate(makeClient({ token: 'abc' })),
    ).resolves.toBeNull();
  });
});
