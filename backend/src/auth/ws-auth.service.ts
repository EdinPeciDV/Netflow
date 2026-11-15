import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Socket } from 'socket.io';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import type { JwtPayload } from './jwt.strategy';

/**
 * Authenticates Socket.io connections. Browsers cannot set an Authorization
 * header on a WebSocket handshake, so the token is accepted from
 * `handshake.auth.token` first (socket.io `auth` option) and falls back to a
 * standard `Authorization: Bearer <token>` header for non-browser clients.
 */
@Injectable()
export class WsAuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  extractToken(client: Socket): string | null {
    const authToken: unknown = client.handshake.auth?.token;
    if (typeof authToken === 'string' && authToken.length > 0) {
      return authToken.replace(/^Bearer\s+/i, '');
    }

    const header = client.handshake.headers.authorization;
    if (typeof header === 'string') {
      const [scheme, token] = header.split(' ');
      if (scheme?.toLowerCase() === 'bearer' && token) return token;
    }

    return null;
  }

  /** Returns the authenticated user, or null if the token is missing/invalid. */
  async authenticate(client: Socket): Promise<User | null> {
    const token = this.extractToken(client);
    if (!token) return null;

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      return await this.usersService.findById(payload.sub);
    } catch {
      return null;
    }
  }
}
