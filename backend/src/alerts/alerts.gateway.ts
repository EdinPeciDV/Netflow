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
const SUBSCRIBE_LIMIT = 10;
const SUBSCRIBE_WINDOW_MS = 10_000;
const HEARTBEAT_INTERVAL_MS = 30_000;
const PONG_TIMEOUT_MS = 5_000;
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
    client.data.pongReceived = true;
    await client.join(ALL_ROOM);
    console.log(`Alerts WS client connected: ${client.id} (${user.email})`);
    this.scheduleHeartbeat(client);
  }

  handleDisconnect(client: Socket) {
    clearTimeout(client.data.pingTimer as ReturnType<typeof setTimeout>);
    clearTimeout(client.data.pongTimer as ReturnType<typeof setTimeout>);
    console.log(`Alerts WS client disconnected: ${client.id}`);
  }

  private scheduleHeartbeat(client: Socket): void {
    client.data.pingTimer = setTimeout(() => {
      client.data.pongReceived = false;
      client.emit('gateway:ping');
      client.data.pongTimer = setTimeout(() => {
        if (!client.data.pongReceived) {
          console.log(`Alerts WS client timed out (no pong): ${client.id}`);
          client.disconnect(true);
        }
      }, PONG_TIMEOUT_MS);
    }, HEARTBEAT_INTERVAL_MS);
  }

  @SubscribeMessage('gateway:pong')
  handlePong(@ConnectedSocket() client: Socket) {
    client.data.pongReceived = true;
    this.scheduleHeartbeat(client);
  }

  @SubscribeMessage('alerts:subscribe')
  async handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { deviceIds?: string[] },
  ) {
    const retryAfterMs = this.checkSubscribeRate(client);
    if (retryAfterMs > 0) return { error: 'rate_limited', retryAfterMs };
    const ids = (body?.deviceIds ?? [])
      .filter((id) => typeof id === 'string')
      .slice(0, MAX_SUBSCRIPTIONS);
    if (ids.length === 0) return { subscribed: [] };
    await client.leave(ALL_ROOM);
    for (const id of ids) await client.join(deviceRoom(id));
    return { subscribed: ids };
  }

  private checkSubscribeRate(client: Socket): number {
    const now = Date.now();
    const hits: number[] = (client.data.subscribeHits ??= []);
    while (hits.length && now - hits[0] >= SUBSCRIBE_WINDOW_MS) hits.shift();
    if (hits.length >= SUBSCRIBE_LIMIT) {
      return SUBSCRIBE_WINDOW_MS - (now - hits[0]);
    }
    hits.push(now);
    return 0;
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
