import EventEmitter from 'events';
import queryString from 'query-string';
import handleEBBMessages from '../ebb/messages/ebb';
import { encode } from '../ebb/utils';
import {
  DEVICE_EVENT_DISCONNECTED,
  DEVICE_TYPE_VIRTUAL,
  VIRTUAL_EVENT_COMMAND,
  VIRTUAL_EVENT_CONNECT,
  VIRTUAL_EVENT_CONNECTED,
  VIRTUAL_EVENT_DISCONNECTED,
  VIRTUAL_EVENT_MESSAGE,
  VIRTUAL_EVENT_STARTED,
  VIRTUAL_STATUS_CONNECTED,
  VIRTUAL_STATUS_CONNECTING,
  VIRTUAL_STATUS_DISCONNECTED,
} from './consts';
import type { IDevice } from './device';
import type { PendingCommand } from './utils';
import { createDeviceBind, logger } from './utils';

// sent by the host to the virtual plotter
export type VirtualHostMessage =
  | {
      type: typeof VIRTUAL_EVENT_CONNECT;
      session: string;
      version: string;
      paper: string;
    }
  | { type: typeof VIRTUAL_EVENT_CONNECTED; session: string }
  | { type: typeof VIRTUAL_EVENT_COMMAND; session: string; command: string }
  | {
      type: typeof VIRTUAL_EVENT_DISCONNECTED;
      session: string;
      reason: string;
    };

// sent by the virtual plotter to the host
export type VirtualPlotterMessage =
  | { type: typeof VIRTUAL_EVENT_STARTED; session: string }
  | { type: typeof VIRTUAL_EVENT_MESSAGE; session: string; data: string }
  | {
      type: typeof VIRTUAL_EVENT_DISCONNECTED;
      session: string;
      reason?: string;
    };

export type VirtualDeviceConfig = {
  version: string;
  // the id of a paper size the virtual plotter knows
  paper: string;
};

// the virtual plotter always opens in this window, so connecting again finds
// the one that's open, drawing and all
export const VIRTUAL_WINDOW_NAME = 'axidraw-web-virtual-plotter';
const VIRTUAL_WINDOW_FEATURES = 'popup=1,width=1200,height=800';
// how long the virtual plotter may take to load and answer
const CONNECT_TIMEOUT = 30e3;
// how often to ask it again, and to check its window is still open
const POLL_INTERVAL = 500;

// a message of either end, which always carries its session
export const hasSession = (data: unknown): data is { session: string } =>
  typeof data === 'object' &&
  data !== null &&
  typeof (data as { session?: unknown }).session === 'string';

// the page a window shows, or null once it has left for another site
export const windowDocument = (target: Window) => {
  try {
    return target.document;
  } catch {
    return null;
  }
};

let closeActiveProxy: (() => void) | null = null;

export const createVirtualDeviceProxy = ({
  version,
  paper,
}: VirtualDeviceConfig) => {
  // one connection at a time: a new one takes the window over
  closeActiveProxy?.();
  const emitter = new EventEmitter();
  // tells this connection's messages from those of an earlier one
  const session = Math.random().toString(36).slice(2);
  const proxy = window.open('', VIRTUAL_WINDOW_NAME, VIRTUAL_WINDOW_FEATURES);
  if (!proxy) {
    throw new Error(
      'The virtual plotter window was blocked. Please allow pop-ups for this site.',
    );
  }
  let isOpen = false;
  try {
    isOpen = proxy.location.hash.startsWith('#virtual');
  } catch {
    // the window has left for another site
  }
  if (isOpen) {
    logger.info('Connect to the open virtual device window');
  } else {
    logger.info('Open virtual device window');
    proxy.location.replace(
      new URL(
        `#virtual?${queryString.stringify({ ebb: version, paper, session })}`,
        window.location.href,
      ).href,
    );
  }
  proxy.focus();

  let proxyStatus = VIRTUAL_STATUS_CONNECTING;
  const post = (message: VirtualHostMessage) => {
    proxy.postMessage(message, window.location.origin);
  };
  const connect = () => {
    post({ type: VIRTUAL_EVENT_CONNECT, session, version, paper });
  };

  // the page that answered, which is gone if the window reloads
  let plotterDocument: Document | null = null;

  const onMessage = (event: MessageEvent<unknown>) => {
    // a window that's unloading posts with no source
    if (event.source !== proxy && event.source !== null) return;
    if (event.origin !== window.location.origin) return;
    if (!hasSession(event.data) || event.data.session !== session) return;
    const message = event.data as VirtualPlotterMessage;
    logger.debug(`Received from communication.device: ${message.type}`);
    switch (message.type) {
      case VIRTUAL_EVENT_STARTED:
        if (proxyStatus !== VIRTUAL_STATUS_CONNECTING) return;
        proxyStatus = VIRTUAL_STATUS_CONNECTED;
        plotterDocument = windowDocument(proxy);
        clearTimeout(timeout);
        post({ type: VIRTUAL_EVENT_CONNECTED, session });
        emitter.emit(VIRTUAL_EVENT_CONNECTED);
        break;
      case VIRTUAL_EVENT_MESSAGE:
        emitter.emit(VIRTUAL_EVENT_MESSAGE, encode(message.data));
        break;
      case VIRTUAL_EVENT_DISCONNECTED:
        finish(
          message.reason ??
            'The virtual plotter window was closed or reloaded.',
        );
        break;
      default:
      // ignore
    }
  };

  // ask until it answers, as a window that's still loading misses messages,
  // and look out for the window closing or reloading, in case it couldn't say
  const poll = setInterval(() => {
    if (proxy.closed) {
      finish('The virtual plotter window was closed.');
    } else if (proxyStatus === VIRTUAL_STATUS_CONNECTING) {
      connect();
    } else if (windowDocument(proxy) !== plotterDocument) {
      finish('The virtual plotter window was reloaded.');
    }
  }, POLL_INTERVAL);
  const timeout = setTimeout(() => {
    finish('The virtual plotter did not respond.');
  }, CONNECT_TIMEOUT);

  // stop listening, and tell whoever listens why, if it wasn't asked for
  function finish(reason?: string) {
    if (proxyStatus === VIRTUAL_STATUS_DISCONNECTED) return;
    proxyStatus = VIRTUAL_STATUS_DISCONNECTED;
    clearInterval(poll);
    clearTimeout(timeout);
    window.removeEventListener('message', onMessage);
    window.removeEventListener('pagehide', onPageHide);
    if (closeActiveProxy === close) {
      closeActiveProxy = null;
    }
    emitter.emit(VIRTUAL_EVENT_DISCONNECTED, reason);
  }
  // hang up, when asked to or when this page goes away
  function close(reason = 'Disconnected by the main window.') {
    if (proxyStatus === VIRTUAL_STATUS_DISCONNECTED) return;
    post({ type: VIRTUAL_EVENT_DISCONNECTED, session, reason });
    logger.info('Close virtual device');
    finish();
  }
  const onPageHide = () => {
    close('The main window was closed or reloaded.');
  };
  closeActiveProxy = close;

  window.addEventListener('message', onMessage);
  window.addEventListener('pagehide', onPageHide);
  if (isOpen) {
    connect();
  }

  return {
    onConnected(listener: () => void) {
      emitter.on(VIRTUAL_EVENT_CONNECTED, listener);
    },
    onMessage(listener: (data: ArrayBufferLike) => void) {
      emitter.on(VIRTUAL_EVENT_MESSAGE, listener);
    },
    onDisconnected(listener: (reason?: string) => void) {
      emitter.on(VIRTUAL_EVENT_DISCONNECTED, listener);
    },
    send(message: string) {
      post({ type: VIRTUAL_EVENT_COMMAND, session, command: message });
      logger.debug(`Send to communication.device: ${message}`);
    },
    close() {
      close();
    },
    get status() {
      return proxyStatus;
    },
  };
};

export const connectDevice =
  () =>
  async (
    commandQueue: PendingCommand<unknown>[],
    config: VirtualDeviceConfig,
  ): Promise<IDevice> => {
    return new Promise((resolve, reject) => {
      const messageHandler = handleEBBMessages(commandQueue);
      messageHandler.next();
      const proxy = createVirtualDeviceProxy(config);
      const emitter = new EventEmitter();
      proxy.onConnected(() => {
        resolve({
          get isReady() {
            return proxy.status === VIRTUAL_STATUS_CONNECTED;
          },
          checkStatus() {
            if (proxy.status !== VIRTUAL_STATUS_CONNECTED) {
              throw new Error('Device is not ready.');
            }
          },
          send(message) {
            proxy.send(message);
          },
          disconnect() {
            proxy.close();
          },
          onDisconnected(listener) {
            emitter.on(DEVICE_EVENT_DISCONNECTED, listener);
          },
        } as IDevice);
      });
      proxy.onMessage((message: ArrayBufferLike) => {
        messageHandler.next(message);
      });
      proxy.onDisconnected((reason) => {
        messageHandler.return();
        emitter.emit(DEVICE_EVENT_DISCONNECTED, reason);
        logger.debug('Device is closed', reason);
        reject(new Error(reason));
      });
    });
  };

export default function createVirtualDevice() {
  return createDeviceBind({
    type: DEVICE_TYPE_VIRTUAL,
    connectDevice: connectDevice(),
  });
}
