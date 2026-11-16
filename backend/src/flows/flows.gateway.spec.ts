// @nestjs/websockets ships ESM that Jest's CJS runtime can't parse; the
// decorators are metadata-only, so no-op stubs are enough for unit tests.
jest.mock('@nestjs/websockets', () => {
  const noop = () => () => undefined;
  return {
    WebSocketGateway: noop,
    WebSocketServer: noop,
    SubscribeMessage: noop,
    MessageBody: noop,
    ConnectedSocket: noop,
  };
});

jest.mock('@nestjs/jwt', () => ({ JwtService: class JwtService {} }));

import { FlowsGateway } from './flows.gateway';

type FakeClient = {
  rooms: Set<string>;
  join: jest.Mock;
  leave: jest.Mock;
};

const makeClient = (rooms: string[] = []): FakeClient => {
  const set = new Set(rooms);
  return {
    rooms: set,
    join: jest.fn(async (r: string) => void set.add(r)),
    leave: jest.fn(async (r: string) => void set.delete(r)),
  };
};

describe('FlowsGateway rooms', () => {
  let gateway: FlowsGateway;

  beforeEach(() => {
    gateway = new FlowsGateway({ authenticate: jest.fn() } as never);
  });

  it('leaves the all-room and joins device rooms on subscribe', async () => {
    const client = makeClient(['flows:all']);
    const res = await gateway.handleSubscribe(client as never, {
      deviceIds: ['d1', 'd2'],
    });
    expect(res).toEqual({ subscribed: ['d1', 'd2'] });
    expect(client.rooms).toEqual(new Set(['flows:device:d1', 'flows:device:d2']));
  });

  it('ignores an empty or invalid subscribe and stays in the all-room', async () => {
    const client = makeClient(['flows:all']);
    await gateway.handleSubscribe(client as never, { deviceIds: [] });
    await gateway.handleSubscribe(client as never, undefined as never);
    expect(client.rooms).toEqual(new Set(['flows:all']));
  });

  it('caps a single subscribe at 50 devices', async () => {
    const client = makeClient(['flows:all']);
    const deviceIds = Array.from({ length: 80 }, (_, i) => `d${i}`);
    const res = await gateway.handleSubscribe(client as never, { deviceIds });
    expect(res.subscribed).toHaveLength(50);
    expect(client.rooms.size).toBe(50);
  });

  it('restores the all-room and drops device rooms on unsubscribe', async () => {
    const client = makeClient(['flows:device:d1']);
    await gateway.handleUnsubscribe(client as never);
    expect(client.rooms).toEqual(new Set(['flows:all']));
  });

  it('broadcasts to the all-room and the device room', () => {
    const emit = jest.fn();
    const to = jest.fn().mockReturnValue({ emit });
    gateway.server = { to } as never;
    const records = [{ id: 'r1' }] as never;
    gateway.broadcastFlows('d1', records);
    expect(to).toHaveBeenCalledWith(['flows:all', 'flows:device:d1']);
    expect(emit).toHaveBeenCalledWith('flows:new', records);
  });
});
