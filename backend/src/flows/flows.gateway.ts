import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsAuthService } from '../auth/ws-auth.service';
import { FlowRecord } from './entities/flow-record.entity';

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
    console.log(`WS client connected: ${client.id} (${user.email})`);
  }

  handleDisconnect(client: Socket) {
    console.log(`WS client disconnected: ${client.id}`);
  }

  broadcastFlows(records: FlowRecord[]): void {
    this.server.emit('flows:new', records);
  }
}
