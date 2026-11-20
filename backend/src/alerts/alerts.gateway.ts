import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsAuthService } from '../auth/ws-auth.service';
import { AlertEvent } from './entities/alert-event.entity';

const ALL_ROOM = 'alerts:all';
const DEVICE_ROOM_PREFIX = 'alerts:device:';
const MAX_SUBSCRIPTIONS = 50;
const deviceRoom = (id: string) => `${DEVICE_ROOM_PREFIX}${id}`;

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
    await client.join(ALL_ROOM);
    console.log(`Alerts WS client connected: ${client.id} (${user.email})`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Alerts WS client disconnected: ${client.id}`);
  }

  @SubscribeMessage('alerts:subscribe')
  async handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { deviceIds?: string[] },
  ) {
    const ids = (body?.deviceIds ?? [])
      .filter((id) => typeof id === 'string')
      .slice(0, MAX_SUBSCRIPTIONS);
    if (ids.length === 0) return { subscribed: [] };
    await client.leave(ALL_ROOM);
    for (const id of ids) await client.join(deviceRoom(id));
    return { subscribed: ids };
  }

  @SubscribeMessage('alerts:unsubscribe')
  async handleUnsubscribe(@ConnectedSocket() client: Socket) {
    for (const room of client.rooms) {
      if (room.startsWith(DEVICE_ROOM_PREFIX)) await client.leave(room);
    }
    await client.join(ALL_ROOM);
    return { subscribed: [] };
  }

  broadcastAlert(event: AlertEvent): void {
    const rooms: string[] = [ALL_ROOM];
    if (event.deviceId) rooms.push(deviceRoom(event.deviceId));
    this.server.to(rooms).emit('alerts:triggered', event);
  }
}
