export const DEVICE_TYPE_USB = 'axidraw-web-device-type-usb';
export const DEVICE_TYPE_SERIAL = 'axidraw-web-device-type-serial';
export const DEVICE_TYPE_WEBSOCKET = 'axidraw-web-device-type-ws';
export const DEVICE_TYPE_VIRTUAL = 'axidraw-web-device-type-virtual';

export const DEVICE_EVENT_CONNECTED = 'axidraw-web-device-event-connected';
export const DEVICE_EVENT_DISCONNECTED =
  'axidraw-web-device-event-disconnected';

export const WEBSOCKET_STATUS_DISCONNECTED =
  'axidraw-web-ws-status-disconnected';
export const WEBSOCKET_STATUS_CONNECTED = 'axidraw-web-ws-status-connected';
export const WEBSOCKET_STATUS_AUTHORIZED = 'axidraw-web-ws-status-authorized';
export const WEBSOCKET_STATUS_STANDBY = 'axidraw-web-ws-status-standby';

export const WEBSOCKET_EVENT_CONNECTED = 'axidraw-web-ws-event-connected';
export const WEBSOCKET_EVENT_DISCONNECTED = 'axidraw-web-ws-event-disconnected';
export const WEBSOCKET_EVENT_MESSAGE = 'axidraw-web-ws-event-message';

export const VIRTUAL_STATUS_DISCONNECTED =
  'axidraw-web-virtual-status-disconnected';
export const VIRTUAL_STATUS_CONNECTING =
  'axidraw-web-virtual-status-connecting';
export const VIRTUAL_STATUS_CONNECTED = 'axidraw-web-virtual-status-connected';

// host -> virtual plotter: connect, asked until the virtual plotter answers
export const VIRTUAL_EVENT_CONNECT = 'axidraw-web-virtual-event-connect';
// virtual plotter -> host: ready for the session
export const VIRTUAL_EVENT_STARTED = 'axidraw-web-virtual-event-started';
// host -> virtual plotter: got it, the session is on
export const VIRTUAL_EVENT_CONNECTED = 'axidraw-web-virtual-event-connected';
// either way: the session is over
export const VIRTUAL_EVENT_DISCONNECTED =
  'axidraw-web-virtual-event-disconnected';
// host -> virtual plotter: an EBB command
export const VIRTUAL_EVENT_COMMAND = 'axidraw-web-virtual-event-command';
// virtual plotter -> host: what the EBB responded
export const VIRTUAL_EVENT_MESSAGE = 'axidraw-web-virtual-event-message';
