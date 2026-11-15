import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsAuthService } from '../auth/ws-auth.service';
import { AlertEvent } from './entities/alert-event.entity';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/alerts' })
export class AlertsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly wsAuth: WsAuthService) {}

  async handleConnection(client: Socket) {
    const user = await this.wsAuth.authenticate(client);
    if (!user) {
      console.log(`Alerts WS client rejected (unauthorized): ${client.id}`);
      client.emit('error', { message: 'Unauthorized' });
      client.disconnect(true);
      return;
    }
    client.data.user = user;
    console.log(`Alerts WS client connected: ${client.id} (${user.email})`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Alerts WS client disconnected: ${client.id}`);
  }

  broadcastAlert(event: AlertEvent): void {
    this.server.emit('alerts:triggered', event);
  }
}
