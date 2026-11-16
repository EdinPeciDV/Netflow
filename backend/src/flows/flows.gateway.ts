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
import { FlowRecord } from './entities/flow-record.entity';

const ALL_ROOM = 'flows:all';
const DEVICE_ROOM_PREFIX = 'flows:device:';
const deviceRoom = (id: string) => `${DEVICE_ROOM_PREFIX}${id}`;

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/flows' })
export class FlowsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly wsAuth: WsAuthService) {}

  async handleConnection(client: Socket) {
    const user = await this.wsAuth.authenticate(client);
    if (!user) {
      console.log(`WS client rejected (unauthorized): ${client.id}`);
      client.emit('error', { message: 'Unauthorized' });
      client.disconnect(true);
      return;
    }
    client.data.user = user;
    await client.join(ALL_ROOM);
    console.log(`WS client connected: ${client.id} (${user.email})`);
  }

  handleDisconnect(client: Socket) {
    console.log(`WS client disconnected: ${client.id}`);
  }

  /**
   * Narrow this client to the given devices. By default every client is in the
   * `flows:all` room; subscribing leaves it and joins one room per device.
   */
  @SubscribeMessage('flows:subscribe')
  async handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { deviceIds?: string[] },
  ) {
    const ids = (body?.deviceIds ?? []).filter((id) => typeof id === 'string');
    if (ids.length === 0) return { subscribed: [] };
    await client.leave(ALL_ROOM);
    for (const id of ids) await client.join(deviceRoom(id));
    return { subscribed: ids };
  }

  /** Drop all device filters and go back to receiving every flow. */
  @SubscribeMessage('flows:unsubscribe')
  async handleUnsubscribe(@ConnectedSocket() client: Socket) {
    for (const room of client.rooms) {
      if (room.startsWith(DEVICE_ROOM_PREFIX)) await client.leave(room);
    }
    await client.join(ALL_ROOM);
    return { subscribed: [] };
  }

  broadcastFlows(deviceId: string, records: FlowRecord[]): void {
    this.server.to([ALL_ROOM, deviceRoom(deviceId)]).emit('flows:new', records);
  }
}
