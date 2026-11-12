import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AlertEvent } from './entities/alert-event.entity';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/alerts' })
export class AlertsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Alerts WS client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Alerts WS client disconnected: ${client.id}`);
  }

  broadcastAlert(event: AlertEvent): void {
    this.server.emit('alerts:triggered', event);
  }
}
