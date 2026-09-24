import { observable, runInAction } from 'mobx';
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
import type {
  VirtualHostMessage,
  VirtualPlotterMessage,
} from '@/communication/device/virtual';
import { hasSession, windowDocument } from '@/communication/device/virtual';
import type { IVirtualPlotter } from './plotter';
import { logger } from './utils';

// how often to check that the host's window is still open
const POLL_INTERVAL = 1000;

export type HostConfig = { version: string; paper: string };

export type HostLinkStatus =
  | typeof VIRTUAL_STATUS_CONNECTING
  | typeof VIRTUAL_STATUS_CONNECTED
  | typeof VIRTUAL_STATUS_DISCONNECTED;

export const hostLinkStatusLabel = (status: HostLinkStatus) =>
  ({
    [VIRTUAL_STATUS_CONNECTING]: 'Connecting…',
    [VIRTUAL_STATUS_CONNECTED]: 'Connected',
    [VIRTUAL_STATUS_DISCONNECTED]: 'Disconnected',
  })[status];

// the virtual plotter's end of its connection to a host: the window that
// opened it, or any window of the app that connects to it later
export const createHostLink = ({
  vm,
  host,
  session,
  onConnect,
}: {
  vm: IVirtualPlotter;
  host: Window;
  // the session the host opened this window for, if it did
  session: string | null;
  // a host has connected again, from its window, with its settings
  onConnect: (config: HostConfig, host: Window) => void;
}) => {
  const state = observable<{ status: HostLinkStatus; reason: string }>({
    status: VIRTUAL_STATUS_DISCONNECTED,
    // why it disconnected
    reason: '',
  });
  let link = { host, session: session ?? '' };
  // the page that connected, which is gone if the main window reloads
  let hostDocument = windowDocument(host);
  const setStatus = (status: HostLinkStatus, reason = '') => {
    runInAction(() => {
      state.status = status;
      state.reason = reason;
    });
  };
  const post = (message: VirtualPlotterMessage) => {
    link.host.postMessage(message, window.location.origin);
  };

  const start = (host: Window, session: string) => {
    // a host that's still on hears it has been let go
    if (state.status !== VIRTUAL_STATUS_DISCONNECTED) {
      post({
        type: VIRTUAL_EVENT_DISCONNECTED,
        session: link.session,
        reason: 'Another window connected to the virtual plotter.',
      });
    }
    // what an earlier host asked for is of no use to this one
    vm.flush();
    link = { host, session };
    hostDocument = windowDocument(host);
    setStatus(VIRTUAL_STATUS_CONNECTING);
    post({ type: VIRTUAL_EVENT_STARTED, session });
    logger.debug(`started session ${session}.`);
  };
  const disconnect = (reason: string) => {
    if (state.status === VIRTUAL_STATUS_DISCONNECTED) return;
    vm.flush();
    setStatus(VIRTUAL_STATUS_DISCONNECTED, reason);
    logger.debug(`disconnected: ${reason}`);
  };

  const onMessage = (event: MessageEvent<unknown>) => {
    if (event.origin !== window.location.origin) return;
    if (!hasSession(event.data)) return;
    const message = event.data as VirtualHostMessage;
    const source = event.source as Window | null;
    const fromHost =
      // a window that's unloading posts with no source
      (source === link.host || source === null) &&
      message.session === link.session &&
      state.status !== VIRTUAL_STATUS_DISCONNECTED;
    switch (message.type) {
      case VIRTUAL_EVENT_CONNECT:
        if (fromHost) {
          // it asked again before the answer got there
          post({ type: VIRTUAL_EVENT_STARTED, session: link.session });
        } else if (source) {
          onConnect({ version: message.version, paper: message.paper }, source);
          start(source, message.session);
        }
        break;
      case VIRTUAL_EVENT_CONNECTED:
        if (fromHost) {
          setStatus(VIRTUAL_STATUS_CONNECTED);
        }
        break;
      case VIRTUAL_EVENT_COMMAND: {
        if (!fromHost) return;
        if (state.status === VIRTUAL_STATUS_CONNECTING) {
          setStatus(VIRTUAL_STATUS_CONNECTED);
        }
        logger.debug(`Received command: ${message.command}`);
        const { session } = link;
        void vm.execute(message.command).then((data) => {
          // a response to a host that has gone is lost, as on a real EBB
          if (session !== link.session) return;
          if (state.status === VIRTUAL_STATUS_DISCONNECTED) return;
          logger.debug(`Respond: ${data}`);
          post({ type: VIRTUAL_EVENT_MESSAGE, session, data });
        });
        break;
      }
      case VIRTUAL_EVENT_DISCONNECTED:
        if (fromHost) {
          disconnect(message.reason);
        }
        break;
      default:
      // ignore
    }
  };

  // in case the main window went without a word
  const poll = setInterval(() => {
    if (state.status === VIRTUAL_STATUS_DISCONNECTED) return;
    if (link.host.closed) {
      disconnect('The main window was closed.');
    } else if (windowDocument(link.host) !== hostDocument) {
      disconnect('The main window was reloaded.');
    }
  }, POLL_INTERVAL);

  // this window is closing or reloading
  const onPageHide = () => {
    if (state.status === VIRTUAL_STATUS_DISCONNECTED) return;
    post({ type: VIRTUAL_EVENT_DISCONNECTED, session: link.session });
  };

  window.addEventListener('message', onMessage);
  window.addEventListener('pagehide', onPageHide);
  start(host, link.session);

  return {
    get status() {
      return state.status;
    },
    get reason() {
      return state.reason;
    },
    dispose() {
      clearInterval(poll);
      window.removeEventListener('message', onMessage);
      window.removeEventListener('pagehide', onPageHide);
    },
  };
};

export type HostLink = ReturnType<typeof createHostLink>;
