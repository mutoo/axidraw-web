import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  VIRTUAL_EVENT_COMMAND,
  VIRTUAL_EVENT_CONNECT,
  VIRTUAL_EVENT_CONNECTED,
  VIRTUAL_EVENT_DISCONNECTED,
  VIRTUAL_EVENT_MESSAGE,
  VIRTUAL_EVENT_STARTED,
  VIRTUAL_STATUS_CONNECTED,
  VIRTUAL_STATUS_CONNECTING,
  VIRTUAL_STATUS_DISCONNECTED,
} from '@/communication/device/consts';
import type { HostLink } from '../host-link';
import { createHostLink } from '../host-link';
import type { IVirtualPlotter } from '../plotter';

const origin = 'https://axidraw.test';

// a window of the app that talks to this one
const createHostWindow = () => {
  const host = {
    closed: false,
    document: {},
    posted: [] as unknown[],
    postMessage(message: unknown, targetOrigin: string) {
      expect(targetOrigin).toBe(origin);
      host.posted.push(message);
    },
  };
  return host;
};

type HostWindow = ReturnType<typeof createHostWindow>;

describe('host link', () => {
  let target: EventTarget;
  let vm: IVirtualPlotter & {
    commands: string[];
    answer: (data: string) => void;
  };
  let link: HostLink;
  const onConnect = vi.fn();
  const flush = vi.fn();

  // a message for this window
  const deliver = (data: unknown, source: HostWindow | null, from = origin) => {
    target.dispatchEvent(
      Object.assign(new Event('message'), { data, source, origin: from }),
    );
  };

  const connect = (host: HostWindow, session: string | null) => {
    link = createHostLink({
      vm,
      host: host as unknown as Window,
      session,
      onConnect,
    });
  };

  beforeEach(() => {
    vi.useFakeTimers();
    target = new EventTarget();
    vi.stubGlobal('window', Object.assign(target, { location: { origin } }));
    const answers: ((data: string) => void)[] = [];
    vm = {
      commands: [],
      execute: vi.fn((command: string) => {
        vm.commands.push(command);
        return new Promise<string>((resolve) => {
          answers.push(resolve);
        });
      }),
      answer(data: string) {
        answers.shift()?.(data);
      },
      flush,
    } as unknown as typeof vm;
    onConnect.mockReset();
    flush.mockReset();
  });

  afterEach(() => {
    link.dispose();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('tells the window that opened it that it has started', () => {
    const host = createHostWindow();
    connect(host, 'one');
    expect(host.posted).toEqual([
      { type: VIRTUAL_EVENT_STARTED, session: 'one' },
    ]);
    expect(link.status).toBe(VIRTUAL_STATUS_CONNECTING);

    deliver({ type: VIRTUAL_EVENT_CONNECTED, session: 'one' }, host);
    expect(link.status).toBe(VIRTUAL_STATUS_CONNECTED);
  });

  it('runs the commands of its host, and answers them', async () => {
    const host = createHostWindow();
    connect(host, 'one');
    deliver({ type: VIRTUAL_EVENT_CONNECTED, session: 'one' }, host);

    deliver(
      { type: VIRTUAL_EVENT_COMMAND, session: 'one', command: 'V' },
      host,
    );
    // not from its host
    deliver(
      { type: VIRTUAL_EVENT_COMMAND, session: 'one', command: 'R' },
      createHostWindow(),
    );
    deliver(
      { type: VIRTUAL_EVENT_COMMAND, session: 'two', command: 'R' },
      host,
    );
    deliver(
      { type: VIRTUAL_EVENT_COMMAND, session: 'one', command: 'R' },
      host,
      'https://elsewhere.test',
    );
    expect(vm.commands).toEqual(['V']);

    vm.answer('EBBv13 2.7.0\r\n');
    await Promise.resolve();
    expect(host.posted.at(-1)).toEqual({
      type: VIRTUAL_EVENT_MESSAGE,
      session: 'one',
      data: 'EBBv13 2.7.0\r\n',
    });
  });

  it('keeps the answers to a host that has gone', async () => {
    const host = createHostWindow();
    connect(host, 'one');
    deliver(
      { type: VIRTUAL_EVENT_COMMAND, session: 'one', command: 'V' },
      host,
    );
    deliver(
      { type: VIRTUAL_EVENT_DISCONNECTED, session: 'one', reason: 'Bye.' },
      host,
    );
    vm.answer('OK\r\n');
    await Promise.resolve();
    expect(host.posted).toHaveLength(1);
    expect(flush).toHaveBeenCalled();
  });

  it('disconnects when the host says so, even while it unloads', () => {
    const host = createHostWindow();
    connect(host, 'one');
    deliver({ type: VIRTUAL_EVENT_CONNECTED, session: 'one' }, host);
    // an unloading window posts with no source
    deliver(
      {
        type: VIRTUAL_EVENT_DISCONNECTED,
        session: 'one',
        reason: 'The main window was closed or reloaded.',
      },
      null,
    );
    expect(link.status).toBe(VIRTUAL_STATUS_DISCONNECTED);
    expect(link.reason).toBe('The main window was closed or reloaded.');
  });

  it('lets another window of the app take over', () => {
    const first = createHostWindow();
    connect(first, 'one');
    const second = createHostWindow();
    deliver(
      {
        type: VIRTUAL_EVENT_CONNECT,
        session: 'two',
        version: '2.8.1',
        paper: 'a3',
      },
      second,
    );
    // the first hears it has been let go
    expect(first.posted.at(-1)).toEqual({
      type: VIRTUAL_EVENT_DISCONNECTED,
      session: 'one',
      reason: 'Another window connected to the virtual plotter.',
    });
    expect(onConnect).toHaveBeenCalledWith(
      { version: '2.8.1', paper: 'a3' },
      second,
    );
    expect(flush).toHaveBeenCalled();
    expect(second.posted).toEqual([
      { type: VIRTUAL_EVENT_STARTED, session: 'two' },
    ]);

    deliver(
      { type: VIRTUAL_EVENT_COMMAND, session: 'one', command: 'R' },
      first,
    );
    deliver(
      { type: VIRTUAL_EVENT_COMMAND, session: 'two', command: 'V' },
      second,
    );
    expect(vm.commands).toEqual(['V']);
    expect(link.status).toBe(VIRTUAL_STATUS_CONNECTED);
  });

  it('answers again when its host asks again', () => {
    const host = createHostWindow();
    connect(host, 'one');
    deliver(
      {
        type: VIRTUAL_EVENT_CONNECT,
        session: 'one',
        version: '2.7.0',
        paper: 'a4',
      },
      host,
    );
    expect(host.posted).toEqual([
      { type: VIRTUAL_EVENT_STARTED, session: 'one' },
      { type: VIRTUAL_EVENT_STARTED, session: 'one' },
    ]);
    expect(onConnect).not.toHaveBeenCalled();
    expect(flush).toHaveBeenCalledTimes(1);
  });

  it('notices the main window closing', async () => {
    const host = createHostWindow();
    connect(host, 'one');
    host.closed = true;
    await vi.advanceTimersByTimeAsync(1000);
    expect(link.status).toBe(VIRTUAL_STATUS_DISCONNECTED);
    expect(link.reason).toBe('The main window was closed.');
  });

  it('notices the main window reloading', async () => {
    const host = createHostWindow();
    connect(host, 'one');
    host.document = {};
    await vi.advanceTimersByTimeAsync(1000);
    expect(link.status).toBe(VIRTUAL_STATUS_DISCONNECTED);
    expect(link.reason).toBe('The main window was reloaded.');
  });

  it('tells its host when this window goes away', () => {
    const host = createHostWindow();
    connect(host, 'one');
    target.dispatchEvent(new Event('pagehide'));
    expect(host.posted.at(-1)).toEqual({
      type: VIRTUAL_EVENT_DISCONNECTED,
      session: 'one',
    });
  });
});
