import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { FlowRecord } from './entities/flow-record.entity';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/flows' })
export class FlowsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`WS client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`WS client disconnected: ${client.id}`);
  }

  broadcastFlows(records: FlowRecord[]): void {
    this.server.emit('flows:new', records);
  }
}
