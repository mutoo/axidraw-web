export type WSDevice = { path: string };

export type ServerMessage =
  | { type: 'ready' }
  | {
      type: 'devices';
      devices: WSDevice[];
    }
  | { type: 'ebb'; response: ArrayLike<number> };
  
export type ClientMessage =
  | { type: 'auth'; code: string }
  | { type: 'device_id'; device: string }
  | { type: 'command'; command: string };
