import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  VIRTUAL_EVENT_COMMAND,
  VIRTUAL_EVENT_CONNECT,
  VIRTUAL_EVENT_CONNECTED,
  VIRTUAL_EVENT_DISCONNECTED,
  VIRTUAL_EVENT_MESSAGE,
  VIRTUAL_EVENT_STARTED,
} from '../consts';
import { createVirtualDeviceProxy, VIRTUAL_WINDOW_NAME } from '../virtual';

const origin = 'https://axidraw.test';

type VirtualProxy = ReturnType<typeof createVirtualDeviceProxy>;

// the window the virtual plotter runs in
const createPopup = (hash = '') => {
  const popup = {
    closed: false,
    document: {},
    location: {
      hash,
      replace: vi.fn((url: string) => {
        popup.location.hash = new URL(url).hash;
      }),
    },
    posted: [] as { type: string; session: string }[],
    postMessage(message: { type: string; session: string }, to: string) {
      expect(to).toBe(origin);
      popup.posted.push(message);
    },
    focus: vi.fn(),
  };
  return popup;
};

type Popup = ReturnType<typeof createPopup>;

describe('virtual device proxy', () => {
  let target: EventTarget;
  let open: ReturnType<typeof vi.fn>;
  let popup: Popup;
  let proxies: VirtualProxy[];

  const deliver = (data: unknown, source: Popup | null = popup) => {
    target.dispatchEvent(
      Object.assign(new Event('message'), { data, source, origin }),
    );
  };

  const createProxy = (config = { version: '2.7.0', paper: 'a5' }) => {
    const proxy = createVirtualDeviceProxy(config);
    proxies.push(proxy);
    const connected = vi.fn();
    const disconnected = vi.fn();
    const messages: string[] = [];
    proxy.onConnected(connected);
    proxy.onDisconnected(disconnected);
    proxy.onMessage((data) => {
      messages.push(new TextDecoder().decode(data));
    });
    return { proxy, connected, disconnected, messages };
  };

  const sessionOf = () =>
    new URLSearchParams(popup.location.hash.split('?')[1]).get('session') ??
    popup.posted.find(({ type }) => type === VIRTUAL_EVENT_CONNECT)?.session;

  beforeEach(() => {
    vi.useFakeTimers();
    popup = createPopup();
    open = vi.fn(() => popup);
    target = new EventTarget();
    vi.stubGlobal(
      'window',
      Object.assign(target, {
        location: { origin, href: `${origin}/#/` },
        open,
      }),
    );
    proxies = [];
  });

  afterEach(() => {
    proxies.forEach((proxy) => {
      proxy.close();
    });
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('opens the virtual plotter for its session', () => {
    createProxy();
    expect(open).toHaveBeenCalledWith(
      '',
      VIRTUAL_WINDOW_NAME,
      expect.stringContaining('popup'),
    );
    const url = new URL(popup.location.replace.mock.calls[0][0]);
    expect(url.origin).toBe(origin);
    const [route, query] = url.hash.split('?');
    expect(route).toBe('#virtual');
    const params = new URLSearchParams(query);
    expect(params.get('ebb')).toBe('2.7.0');
    expect(params.get('paper')).toBe('a5');
    expect(params.get('session')).toMatch(/^\w+$/);
    expect(popup.focus).toHaveBeenCalled();
  });

  it('connects to the virtual plotter that is open already', () => {
    popup = createPopup('#virtual?ebb=2.7.0&paper=a4&session=old');
    createProxy({ version: '2.7.0', paper: 'a3' });
    expect(popup.location.replace).not.toHaveBeenCalled();
    expect(popup.posted).toHaveLength(1);
    expect(popup.posted[0]).toMatchObject({
      type: VIRTUAL_EVENT_CONNECT,
      version: '2.7.0',
      paper: 'a3',
    });
    expect(popup.posted[0].session).not.toBe('old');
  });

  it('says why when the window is blocked', () => {
    open.mockReturnValue(null);
    expect(() =>
      createVirtualDeviceProxy({ version: '2.7.0', paper: 'a4' }),
    ).toThrow(/blocked/);
  });

  it('connects once the virtual plotter starts, and only once', () => {
    const { connected } = createProxy();
    const session = sessionOf();
    deliver({ type: VIRTUAL_EVENT_STARTED, session: 'another' });
    deliver({ type: VIRTUAL_EVENT_STARTED, session }, createPopup());
    expect(connected).not.toHaveBeenCalled();

    deliver({ type: VIRTUAL_EVENT_STARTED, session });
    deliver({ type: VIRTUAL_EVENT_STARTED, session });
    expect(connected).toHaveBeenCalledTimes(1);
    expect(
      popup.posted.filter(({ type }) => type === VIRTUAL_EVENT_CONNECTED),
    ).toEqual([{ type: VIRTUAL_EVENT_CONNECTED, session }]);
  });

  it('asks again until the virtual plotter answers', async () => {
    createProxy();
    const session = sessionOf();
    await vi.advanceTimersByTimeAsync(1000);
    expect(
      popup.posted.filter(({ type }) => type === VIRTUAL_EVENT_CONNECT),
    ).toHaveLength(2);
    deliver({ type: VIRTUAL_EVENT_STARTED, session });
    await vi.advanceTimersByTimeAsync(1000);
    expect(
      popup.posted.filter(({ type }) => type === VIRTUAL_EVENT_CONNECT),
    ).toHaveLength(2);
  });

  it('gives up on a virtual plotter that never answers', async () => {
    const { disconnected } = createProxy();
    await vi.advanceTimersByTimeAsync(30e3);
    expect(disconnected).toHaveBeenCalledWith(
      'The virtual plotter did not respond.',
    );
  });

  it('sends commands and passes the responses on', () => {
    const { proxy, messages } = createProxy();
    const session = sessionOf();
    deliver({ type: VIRTUAL_EVENT_STARTED, session });
    proxy.send('V\r');
    expect(popup.posted.at(-1)).toEqual({
      type: VIRTUAL_EVENT_COMMAND,
      session,
      command: 'V\r',
    });
    deliver({ type: VIRTUAL_EVENT_MESSAGE, session, data: 'OK\r\n' });
    deliver({ type: VIRTUAL_EVENT_MESSAGE, session: 'another', data: '!' });
    expect(messages).toEqual(['OK\r\n']);
  });

  it('disconnects when the virtual plotter goes away, even as it unloads', () => {
    const { disconnected } = createProxy();
    const session = sessionOf();
    deliver({ type: VIRTUAL_EVENT_STARTED, session });
    // an unloading window posts with no source
    deliver({ type: VIRTUAL_EVENT_DISCONNECTED, session }, null);
    expect(disconnected).toHaveBeenCalledWith(
      'The virtual plotter window was closed or reloaded.',
    );
  });

  it('notices its window closing', async () => {
    const { disconnected } = createProxy();
    deliver({ type: VIRTUAL_EVENT_STARTED, session: sessionOf() });
    popup.closed = true;
    await vi.advanceTimersByTimeAsync(500);
    expect(disconnected).toHaveBeenCalledWith(
      'The virtual plotter window was closed.',
    );
  });

  it('notices its window reloading', async () => {
    const { disconnected } = createProxy();
    deliver({ type: VIRTUAL_EVENT_STARTED, session: sessionOf() });
    await vi.advanceTimersByTimeAsync(500);
    expect(disconnected).not.toHaveBeenCalled();
    popup.document = {};
    await vi.advanceTimersByTimeAsync(500);
    expect(disconnected).toHaveBeenCalledWith(
      'The virtual plotter window was reloaded.',
    );
  });

  it('hangs up when asked, with nothing to complain about', () => {
    const { proxy, disconnected } = createProxy();
    const session = sessionOf();
    deliver({ type: VIRTUAL_EVENT_STARTED, session });
    proxy.close();
    expect(popup.posted.at(-1)).toEqual({
      type: VIRTUAL_EVENT_DISCONNECTED,
      session,
      reason: 'Disconnected by the main window.',
    });
    expect(disconnected).toHaveBeenCalledWith(undefined);
  });

  it('hangs up when this page goes away', () => {
    const { disconnected } = createProxy();
    const session = sessionOf();
    deliver({ type: VIRTUAL_EVENT_STARTED, session });
    target.dispatchEvent(new Event('pagehide'));
    expect(popup.posted.at(-1)).toEqual({
      type: VIRTUAL_EVENT_DISCONNECTED,
      session,
      reason: 'The main window was closed or reloaded.',
    });
    expect(disconnected).toHaveBeenCalledTimes(1);
  });

  it('lets a new connection take the window over', () => {
    const first = createProxy();
    deliver({ type: VIRTUAL_EVENT_STARTED, session: sessionOf() });
    popup.location.hash = '#virtual?session=first';
    const second = createProxy();
    expect(first.disconnected).toHaveBeenCalledWith(undefined);
    expect(second.disconnected).not.toHaveBeenCalled();
  });
});
