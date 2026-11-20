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

import { AlertsGateway } from './alerts.gateway';

type FakeClient = {
  rooms: Set<string>;
  data: Record<string, unknown>;
  join: jest.Mock;
  leave: jest.Mock;
  emit: jest.Mock;
  disconnect: jest.Mock;
};

const makeClient = (rooms: string[] = []): FakeClient => {
  const set = new Set(rooms);
  return {
    rooms: set,
    data: {},
    join: jest.fn(async (r: string) => void set.add(r)),
    leave: jest.fn(async (r: string) => void set.delete(r)),
    emit: jest.fn(),
    disconnect: jest.fn(),
  };
};

describe('AlertsGateway rooms', () => {
  let gateway: AlertsGateway;

  beforeEach(() => {
    gateway = new AlertsGateway({ authenticate: jest.fn() } as never);
  });

  it('leaves the all-room and joins device rooms on subscribe', async () => {
    const client = makeClient(['alerts:all']);
    const res = await gateway.handleSubscribe(client as never, {
      deviceIds: ['d1', 'd2'],
    });
    expect(res).toEqual({ subscribed: ['d1', 'd2'] });
    expect(client.rooms).toEqual(new Set(['alerts:device:d1', 'alerts:device:d2']));
  });

  it('ignores an empty or invalid subscribe and stays in the all-room', async () => {
    const client = makeClient(['alerts:all']);
    await gateway.handleSubscribe(client as never, { deviceIds: [] });
    await gateway.handleSubscribe(client as never, undefined as never);
    expect(client.rooms).toEqual(new Set(['alerts:all']));
  });

  it('caps a single subscribe at 50 devices', async () => {
    const client = makeClient(['alerts:all']);
    const deviceIds = Array.from({ length: 80 }, (_, i) => `d${i}`);
    const res = await gateway.handleSubscribe(client as never, { deviceIds });
    expect(res.subscribed).toHaveLength(50);
    expect(client.rooms.size).toBe(50);
  });

  it('restores the all-room and drops device rooms on unsubscribe', async () => {
    const client = makeClient(['alerts:device:d1']);
    await gateway.handleUnsubscribe(client as never);
    expect(client.rooms).toEqual(new Set(['alerts:all']));
  });

  it('broadcasts to the all-room and the device room', () => {
    const emit = jest.fn();
    const to = jest.fn().mockReturnValue({ emit });
    gateway.server = { to } as never;
    const event = { id: 'e1', deviceId: 'd1' } as never;
    gateway.broadcastAlert(event);
    expect(to).toHaveBeenCalledWith(['alerts:all', 'alerts:device:d1']);
    expect(emit).toHaveBeenCalledWith('alerts:triggered', event);
  });

  it('broadcasts only to the all-room when event has no deviceId', () => {
    const emit = jest.fn();
    const to = jest.fn().mockReturnValue({ emit });
    gateway.server = { to } as never;
    const event = { id: 'e1', deviceId: null } as never;
    gateway.broadcastAlert(event);
    expect(to).toHaveBeenCalledWith(['alerts:all']);
  });
});

describe('AlertsGateway subscribe rate limit', () => {
  let gateway: AlertsGateway;
  let now: jest.SpyInstance;

  beforeEach(() => {
    gateway = new AlertsGateway({ authenticate: jest.fn() } as never);
    now = jest.spyOn(Date, 'now').mockReturnValue(1_000_000);
  });
  afterEach(() => now.mockRestore());

  it('rejects the 11th subscribe within the window', async () => {
    const client = makeClient(['alerts:all']);
    for (let i = 0; i < 10; i++) {
      const ok = await gateway.handleSubscribe(client as never, { deviceIds: ['d1'] });
      expect(ok).toEqual({ subscribed: ['d1'] });
    }
    const res = await gateway.handleSubscribe(client as never, { deviceIds: ['d2'] });
    expect(res).toEqual({ error: 'rate_limited', retryAfterMs: 10_000 });
    expect(client.rooms.has('alerts:device:d2')).toBe(false);
  });

  it('allows subscribing again once the window has passed', async () => {
    const client = makeClient(['alerts:all']);
    for (let i = 0; i < 10; i++) {
      await gateway.handleSubscribe(client as never, { deviceIds: ['d1'] });
    }
    now.mockReturnValue(1_000_000 + 10_000);
    const res = await gateway.handleSubscribe(client as never, { deviceIds: ['d2'] });
    expect(res).toEqual({ subscribed: ['d2'] });
  });

  it('tracks the limit per client', async () => {
    const a = makeClient(['alerts:all']);
    const b = makeClient(['alerts:all']);
    for (let i = 0; i < 10; i++) {
      await gateway.handleSubscribe(a as never, { deviceIds: ['d1'] });
    }
    const res = await gateway.handleSubscribe(b as never, { deviceIds: ['d1'] });
    expect(res).toEqual({ subscribed: ['d1'] });
  });
});
